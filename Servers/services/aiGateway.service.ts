/**
 * AI Gateway Service
 *
 * Orchestrates the proxy flow for AI Gateway requests:
 * 1. Look up endpoint by slug
 * 2. Decrypt the API key
 * 3. Reserve budget (if budget exists and is a hard limit)
 * 4. Forward request to FastAPI gateway service
 * 5. Log spend to ai_gateway_spend_logs
 * 6. Adjust budget with actual cost
 */

import { Readable } from "stream";
import logger from "../utils/logger/fileLogger";
import { getEndpointBySlugQuery } from "../utils/aiGatewayEndpoint.utils";
import { getApiKeyByIdQuery } from "../utils/aiGatewayApiKey.utils";
import { insertSpendLogQuery } from "../utils/aiGatewaySpendLog.utils";
import {
  getBudgetQuery,
  reserveBudgetQuery,
  adjustBudgetSpendQuery,
} from "../utils/aiGatewayBudget.utils";
import { decrypt } from "../utils/encryption.utils";
import {
  NotFoundException,
  BusinessLogicException,
  ExternalServiceException,
  ValidationException,
} from "../domain.layer/exceptions/custom.exception";
import { checkRateLimit } from "../utils/aiGatewayRateLimit.utils";
import redisClient from "../database/redis";
import {
  getActiveGuardrailsQuery,
  getGuardrailSettingsQuery,
  insertGuardrailLogQuery,
} from "../utils/aiGatewayGuardrail.utils";

const AI_GATEWAY_URL =
  process.env.AI_GATEWAY_URL || "http://localhost:8100";
const INTERNAL_KEY =
  process.env.AI_GATEWAY_INTERNAL_KEY || "";

/** Estimated cost per token (rough default, overridden by FastAPI response) */
const DEFAULT_ESTIMATED_COST = 0.005;

interface CompletionOptions {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

interface GatewayResponse {
  choices?: Array<{
    message?: { role: string; content: string };
    delta?: { content?: string };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost_usd?: number;
  model?: string;
}

interface EmbeddingResponse {
  data?: Array<{ embedding: number[]; index: number }>;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
  cost_usd?: number;
  model?: string;
}

/**
 * Run guardrail scanning on the last user message.
 * Returns the (possibly masked) messages array, or throws if blocked.
 * Logs each detection to ai_gateway_guardrail_logs.
 */
async function runGuardrails(
  organizationId: number,
  messages: Array<{ role: string; content: string }>,
  endpointId: number | null,
  userId: number
): Promise<Array<{ role: string; content: string }>> {
  // Get active rules and settings
  const [rules, settings] = await Promise.all([
    getActiveGuardrailsQuery(organizationId),
    getGuardrailSettingsQuery(organizationId),
  ]);

  // No active guardrails — pass through
  if (!rules || (rules as any[]).length === 0) {
    return messages;
  }

  // Extract last user message for scanning
  const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
  if (lastUserIdx === -1) return messages;
  const actualIdx = messages.length - 1 - lastUserIdx;
  const lastUserMessage = messages[actualIdx];

  try {
    const response = await fetch(`${AI_GATEWAY_URL}/v1/guardrails/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": INTERNAL_KEY,
      },
      body: JSON.stringify({
        text: lastUserMessage.content,
        guardrail_rules: rules,
        settings: settings || {},
      }),
    });

    if (!response.ok) {
      // Guardrail service error — check on_error settings
      const settingsObj = (settings as any) || {};
      if (settingsObj.pii_on_error === "block" || settingsObj.content_filter_on_error === "block") {
        throw new ValidationException("Guardrail scan failed and on_error is set to block");
      }
      logger.error(`Guardrail scan returned ${response.status}`);
      return messages; // fail-open
    }

    const result = await response.json();

    // Log each detection
    for (const detection of result.detections || []) {
      try {
        await insertGuardrailLogQuery(organizationId, {
          guardrail_id: detection.guardrail_id || null,
          endpoint_id: endpointId || undefined,
          user_id: userId,
          guardrail_type: detection.guardrail_type,
          action_taken: result.blocked ? "blocked" : detection.action === "mask" ? "masked" : "allowed",
          matched_text: detection.matched_text,
          entity_type: detection.entity_type,
          execution_time_ms: result.execution_time_ms,
        });
      } catch (logErr) {
        logger.error("Failed to write guardrail log:", logErr);
      }
    }

    // If blocked, throw with reason
    if (result.blocked) {
      throw new ValidationException(
        `Request blocked by guardrail: ${result.block_reason}`
      );
    }

    // If masked, replace the last user message content
    if (result.masked_text) {
      const updatedMessages = [...messages];
      updatedMessages[actualIdx] = {
        ...updatedMessages[actualIdx],
        content: result.masked_text,
      };
      return updatedMessages;
    }

    return messages;
  } catch (err: any) {
    // Re-throw our own ValidationException (blocked)
    if (err instanceof ValidationException) throw err;

    // External service error — check on_error
    const settingsObj = (settings as any) || {};
    if (settingsObj.pii_on_error === "block") {
      throw new ValidationException("Guardrail scan unavailable and PII on_error is set to block");
    }
    logger.error("Guardrail scan error:", err.message);
    return messages; // fail-open
  }
}

/**
 * Resolve endpoint and decrypt API key
 */
async function resolveEndpoint(organizationId: number, endpointSlug: string) {
  const endpoint = await getEndpointBySlugQuery(organizationId, endpointSlug);
  if (!endpoint) {
    throw new NotFoundException(
      `Endpoint not found: ${endpointSlug}`,
      "ai_gateway_endpoints",
      endpointSlug
    );
  }

  if (!endpoint.is_active) {
    throw new BusinessLogicException(
      `Endpoint is inactive: ${endpointSlug}`,
      "endpoint_inactive",
      { slug: endpointSlug }
    );
  }

  const apiKeyRecord = await getApiKeyByIdQuery(
    organizationId,
    endpoint.api_key_id
  );
  if (!apiKeyRecord) {
    throw new NotFoundException(
      `API key not found for endpoint: ${endpointSlug}`,
      "ai_gateway_api_keys",
      endpoint.api_key_id
    );
  }

  if (!apiKeyRecord.is_active) {
    throw new BusinessLogicException(
      `API key is inactive for endpoint: ${endpointSlug}`,
      "api_key_inactive",
      { key_name: apiKeyRecord.key_name }
    );
  }

  let decryptedKey: string;
  try {
    decryptedKey = decrypt(apiKeyRecord.encrypted_key);
  } catch (err) {
    throw new BusinessLogicException(
      "Failed to decrypt API key",
      "decryption_failed"
    );
  }

  return { endpoint, decryptedKey };
}

/**
 * Try to reserve budget. Returns true if budget reservation succeeded or no budget exists.
 */
async function tryReserveBudget(
  organizationId: number,
  estimatedCost: number
): Promise<boolean> {
  const budget = await getBudgetQuery(organizationId);
  if (!budget) {
    return true; // No budget configured, allow all requests
  }

  const reserved = await reserveBudgetQuery(organizationId, estimatedCost);
  if (!reserved) {
    throw new BusinessLogicException(
      "Monthly budget limit exceeded",
      "budget_exceeded",
      {
        monthly_limit_usd: budget.monthly_limit_usd,
        current_spend_usd: budget.current_spend_usd,
      }
    );
  }

  return true;
}

/**
 * Log spend and adjust budget after request completes
 */
async function finalizeSpend(
  organizationId: number,
  endpointId: number,
  userId: number,
  provider: string,
  model: string,
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number },
  costUsd: number,
  latencyMs: number,
  statusCode: number,
  estimatedCost: number,
  extra?: {
    metadata?: object;
    request_messages?: object;
    response_text?: string;
    error_message?: string;
  }
): Promise<void> {
  try {
    await insertSpendLogQuery(organizationId, {
      endpoint_id: endpointId,
      user_id: userId,
      provider,
      model,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      cost_usd: costUsd,
      latency_ms: latencyMs,
      status_code: statusCode,
      metadata: extra?.metadata,
      request_messages: extra?.request_messages,
      response_text: extra?.response_text,
      error_message: extra?.error_message,
    });
  } catch (err) {
    logger.error("Failed to insert spend log:", err);
  }

  try {
    await adjustBudgetSpendQuery(organizationId, estimatedCost, costUsd);
  } catch (err) {
    logger.error("Failed to adjust budget spend:", err);
  }

  // Check budget alert threshold (non-blocking)
  try {
    await checkBudgetAlert(organizationId);
  } catch (err) {
    logger.error("Failed to check budget alert:", err);
  }
}

/**
 * Check if budget alert threshold is crossed and send notification.
 * Uses Redis to prevent duplicate alerts within the same month.
 */
async function checkBudgetAlert(organizationId: number): Promise<void> {
  const budget = await getBudgetQuery(organizationId);
  if (!budget || !budget.monthly_limit_usd || Number(budget.monthly_limit_usd) <= 0) return;

  const spendPct = (Number(budget.current_spend_usd) / Number(budget.monthly_limit_usd)) * 100;
  const threshold = budget.alert_threshold_pct || 80;

  if (spendPct < threshold) return;

  // Check if we already sent an alert this month
  const alertKey = `gw:alert:${organizationId}:${new Date().toISOString().slice(0, 7)}`;
  const alreadySent = await redisClient.get(alertKey);
  if (alreadySent) return;

  // Mark as sent (expire at end of month)
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - new Date().getDate() + 1;
  await redisClient.set(alertKey, "1", "EX", daysRemaining * 86400);

  logger.info(`Budget alert: org ${organizationId} at ${spendPct.toFixed(1)}% (threshold: ${threshold}%)`);

  // TODO: Send email/Slack notification via NotificationService when alert_email_enabled or alert_slack_enabled
}

/**
 * Proxy a chat completion request through the FastAPI gateway
 */
export async function proxyCompletion(
  organizationId: number,
  endpointSlug: string,
  messages: Array<{ role: string; content: string }>,
  options: CompletionOptions,
  userId: number
): Promise<GatewayResponse> {
  const { endpoint, decryptedKey } = await resolveEndpoint(
    organizationId,
    endpointSlug
  );

  // Rate limit check
  if (endpoint.rate_limit_rpm && endpoint.rate_limit_rpm > 0) {
    const rl = await checkRateLimit(endpoint.id, endpoint.rate_limit_rpm);
    if (!rl.allowed) {
      const err = new BusinessLogicException(
        `Rate limit exceeded for endpoint ${endpointSlug} (${endpoint.rate_limit_rpm} RPM)`
      );
      (err as any).code = "rate_limited";
      throw err;
    }
  }

  // Run guardrails on input (scan last user message)
  const scannedMessages = await runGuardrails(
    organizationId,
    messages,
    endpoint.id,
    userId
  );

  const estimatedCost = DEFAULT_ESTIMATED_COST;
  await tryReserveBudget(organizationId, estimatedCost);

  const startTime = Date.now();
  let statusCode = 200;

  // Prepend system prompt if configured on the endpoint
  const finalMessages =
    endpoint.system_prompt
      ? [{ role: "system", content: endpoint.system_prompt }, ...scannedMessages]
      : scannedMessages;

  try {
    const response = await fetch(`${AI_GATEWAY_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": INTERNAL_KEY,
        "x-provider-key": decryptedKey,
      },
      body: JSON.stringify({
        provider: endpoint.provider,
        model: endpoint.model,
        messages: finalMessages,
        max_tokens: options.max_tokens ?? endpoint.max_tokens ?? undefined,
        temperature: options.temperature ?? endpoint.temperature ?? undefined,
        top_p: options.top_p,
        stream: false,
      }),
    });

    statusCode = response.status;

    if (!response.ok) {
      const errorBody = await response.text();
      throw new ExternalServiceException(
        `AI Gateway returned ${response.status}: ${errorBody}`,
        "ai-gateway-fastapi",
        "/v1/chat/completions"
      );
    }

    const data = (await response.json()) as GatewayResponse;
    const latencyMs = Date.now() - startTime;

    const usage = data.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };
    const costUsd = data.cost_usd || 0;

    await finalizeSpend(
      organizationId,
      endpoint.id,
      userId,
      endpoint.provider,
      data.model || endpoint.model,
      usage,
      costUsd,
      latencyMs,
      statusCode,
      estimatedCost,
      {
        request_messages: finalMessages,
        response_text: data.choices?.[0]?.message?.content,
      }
    );

    return data;
  } catch (err) {
    const latencyMs = Date.now() - startTime;

    // Log the failed request spend (cost = 0) and adjust budget back
    await finalizeSpend(
      organizationId,
      endpoint.id,
      userId,
      endpoint.provider,
      endpoint.model,
      { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      0,
      latencyMs,
      statusCode >= 400 ? statusCode : 500,
      estimatedCost,
      {
        request_messages: finalMessages,
        error_message: (err as Error).message?.slice(0, 500),
      }
    );

    throw err;
  }
}

/**
 * Proxy a streaming chat completion request through the FastAPI gateway.
 * Returns a ReadableStream that the controller can pipe to the response.
 */
export async function proxyStream(
  organizationId: number,
  endpointSlug: string,
  messages: Array<{ role: string; content: string }>,
  options: CompletionOptions,
  userId: number
): Promise<{ stream: Readable; cleanup: () => Promise<void> }> {
  const { endpoint, decryptedKey } = await resolveEndpoint(
    organizationId,
    endpointSlug
  );

  // Rate limit check
  if (endpoint.rate_limit_rpm && endpoint.rate_limit_rpm > 0) {
    const rl = await checkRateLimit(endpoint.id, endpoint.rate_limit_rpm);
    if (!rl.allowed) {
      const err = new BusinessLogicException(
        `Rate limit exceeded for endpoint ${endpointSlug} (${endpoint.rate_limit_rpm} RPM)`
      );
      (err as any).code = "rate_limited";
      throw err;
    }
  }

  // Run guardrails on input (scan last user message)
  const scannedMessages = await runGuardrails(
    organizationId,
    messages,
    endpoint.id,
    userId
  );

  const estimatedCost = DEFAULT_ESTIMATED_COST;
  await tryReserveBudget(organizationId, estimatedCost);

  const startTime = Date.now();

  const finalMessages =
    endpoint.system_prompt
      ? [{ role: "system", content: endpoint.system_prompt }, ...scannedMessages]
      : scannedMessages;

  const response = await fetch(`${AI_GATEWAY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": INTERNAL_KEY,
      "x-provider-key": decryptedKey,
    },
    body: JSON.stringify({
      provider: endpoint.provider,
      model: endpoint.model,
      messages: finalMessages,
      max_tokens: options.max_tokens ?? endpoint.max_tokens ?? undefined,
      temperature: options.temperature ?? endpoint.temperature ?? undefined,
      top_p: options.top_p,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    // Adjust budget back since we reserved
    await adjustBudgetSpendQuery(organizationId, estimatedCost, 0);
    throw new ExternalServiceException(
      `AI Gateway returned ${response.status}: ${errorBody}`,
      "ai-gateway-fastapi",
      "/v1/chat/completions"
    );
  }

  if (!response.body) {
    await adjustBudgetSpendQuery(organizationId, estimatedCost, 0);
    throw new ExternalServiceException(
      "No response body from AI Gateway stream",
      "ai-gateway-fastapi",
      "/v1/chat/completions"
    );
  }

  // Convert web ReadableStream to Node.js Readable
  const reader = response.body.getReader();
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalCostUsd = 0;
  let finalModel = endpoint.model;

  const decoder = new TextDecoder();

  const nodeStream = new Readable({
    async read() {
      try {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null);
          return;
        }
        this.push(Buffer.from(value));

        // Try to parse SSE chunks for usage data
        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const chunk = JSON.parse(line.slice(6));
              if (chunk.usage) {
                totalPromptTokens = chunk.usage.prompt_tokens || totalPromptTokens;
                totalCompletionTokens = chunk.usage.completion_tokens || totalCompletionTokens;
              }
              if (chunk.cost_usd) {
                totalCostUsd = chunk.cost_usd;
              }
              if (chunk.model) {
                finalModel = chunk.model;
              }
            } catch {
              // Ignore JSON parse errors on SSE chunks
            }
          }
        }
      } catch (err) {
        this.destroy(err as Error);
      }
    },
  });

  const cleanup = async () => {
    const latencyMs = Date.now() - startTime;
    await finalizeSpend(
      organizationId,
      endpoint.id,
      userId,
      endpoint.provider,
      finalModel,
      {
        prompt_tokens: totalPromptTokens,
        completion_tokens: totalCompletionTokens,
        total_tokens: totalPromptTokens + totalCompletionTokens,
      },
      totalCostUsd,
      latencyMs,
      200,
      estimatedCost
    );
  };

  return { stream: nodeStream, cleanup };
}

/**
 * Proxy an embedding request through the FastAPI gateway
 */
export async function proxyEmbedding(
  organizationId: number,
  endpointSlug: string,
  input: string | string[],
  userId: number
): Promise<EmbeddingResponse> {
  const { endpoint, decryptedKey } = await resolveEndpoint(
    organizationId,
    endpointSlug
  );

  const estimatedCost = DEFAULT_ESTIMATED_COST;
  await tryReserveBudget(organizationId, estimatedCost);

  const startTime = Date.now();
  let statusCode = 200;

  try {
    const response = await fetch(`${AI_GATEWAY_URL}/v1/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": INTERNAL_KEY,
        "x-provider-key": decryptedKey,
      },
      body: JSON.stringify({
        provider: endpoint.provider,
        model: endpoint.model,
        input,
      }),
    });

    statusCode = response.status;

    if (!response.ok) {
      const errorBody = await response.text();
      throw new ExternalServiceException(
        `AI Gateway returned ${response.status}: ${errorBody}`,
        "ai-gateway-fastapi",
        "/v1/embeddings"
      );
    }

    const data = (await response.json()) as EmbeddingResponse;
    const latencyMs = Date.now() - startTime;

    const usage = data.usage || { prompt_tokens: 0, total_tokens: 0 };
    const costUsd = data.cost_usd || 0;

    await finalizeSpend(
      organizationId,
      endpoint.id,
      userId,
      endpoint.provider,
      data.model || endpoint.model,
      {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: 0,
        total_tokens: usage.total_tokens,
      },
      costUsd,
      latencyMs,
      statusCode,
      estimatedCost
    );

    return data;
  } catch (err) {
    const latencyMs = Date.now() - startTime;

    await finalizeSpend(
      organizationId,
      endpoint.id,
      userId,
      endpoint.provider,
      endpoint.model,
      { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      0,
      latencyMs,
      statusCode >= 400 ? statusCode : 500,
      estimatedCost
    );

    throw err;
  }
}
