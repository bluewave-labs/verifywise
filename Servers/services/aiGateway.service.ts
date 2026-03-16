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
import {
  getEndpointBySlugQuery,
  getEndpointByIdQuery,
} from "../utils/aiGatewayEndpoint.utils";
import { getApiKeyByIdQuery } from "../utils/aiGatewayApiKey.utils";
import { insertSpendLogQuery } from "../utils/aiGatewaySpendLog.utils";
import {
  getBudgetQuery,
  reserveBudgetQuery,
  adjustBudgetSpendQuery,
} from "../utils/aiGatewayBudget.utils";
import { incrementVirtualKeySpend } from "../utils/aiGatewayVirtualKey.utils";
import { notifyVirtualKeyBudgetExhausted } from "./aiGateway/aiGatewayNotifications";
import { decrypt } from "../utils/encryption.utils";
import {
  NotFoundException,
  BusinessLogicException,
  ExternalServiceException,
  ValidationException,
} from "../domain.layer/exceptions/custom.exception";
import { checkRateLimit } from "../utils/aiGatewayRateLimit.utils";
import { notifyBudgetWarning, notifyBudgetExhausted } from "./aiGateway/aiGatewayNotifications";
import redisClient from "../database/redis";
import {
  getActiveGuardrailsQuery,
  getGuardrailSettingsQuery,
  insertGuardrailLogQuery,
} from "../utils/aiGatewayGuardrail.utils";
import {
  resolvePromptQuery,
  resolveVariables,
} from "../utils/aiGatewayPrompt.utils";

const AI_GATEWAY_URL =
  process.env.AI_GATEWAY_URL || "http://localhost:8100";

/**
 * Build the final messages array by resolving prompt templates.
 *
 * Priority:
 * 1. If endpoint has a prompt_id, resolve the published version and prepend its messages.
 * 2. If no published version exists (or resolution fails), fall back to system_prompt.
 * 3. Otherwise, return scannedMessages as-is.
 */
async function buildFinalMessages(
  organizationId: number,
  endpoint: { prompt_id: number | null; system_prompt: string | null },
  scannedMessages: Array<{ role: string; content: string }>,
  metadata?: Record<string, string>
): Promise<Array<{ role: string; content: string }>> {
  if (endpoint.prompt_id) {
    try {
      const promptData = await resolvePromptQuery(organizationId, endpoint.prompt_id);
      if (promptData?.content) {
        const vars = metadata || {};
        return [
          ...resolveVariables(promptData.content, vars),
          ...scannedMessages,
        ];
      }
      // No published version — fall back to system_prompt or raw messages
      return endpoint.system_prompt
        ? [{ role: "system", content: endpoint.system_prompt }, ...scannedMessages]
        : scannedMessages;
    } catch (err) {
      logger.error("Failed to resolve prompt template:", err);
      return endpoint.system_prompt
        ? [{ role: "system", content: endpoint.system_prompt }, ...scannedMessages]
        : scannedMessages;
    }
  }

  if (endpoint.system_prompt) {
    return [{ role: "system", content: endpoint.system_prompt }, ...scannedMessages];
  }

  return scannedMessages;
}
const INTERNAL_KEY =
  process.env.AI_GATEWAY_INTERNAL_KEY || "";

/** Estimated cost per token (rough default, overridden by FastAPI response) */
const DEFAULT_ESTIMATED_COST = 0.005;

/** Maximum fallback chain depth to prevent infinite recursion */
const MAX_FALLBACK_DEPTH = 3;

interface CompletionOptions {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  metadata?: Record<string, string>;
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

  // Cache settings for finalizeSpend (avoids second DB query)
  if (settings) setCachedSettings(organizationId, settings);

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

/** Settings cache to avoid DB query on every request (60s TTL) */
const settingsCache = new Map<number, { data: any; expiry: number }>();
function getCachedSettings(organizationId: number): any | null {
  const cached = settingsCache.get(organizationId);
  if (cached && cached.expiry > Date.now()) return cached.data;
  return null;
}
function setCachedSettings(organizationId: number, data: any): void {
  settingsCache.set(organizationId, { data, expiry: Date.now() + 60_000 });
}

/** Max chars for stored prompt/response text (LiteLLM uses 2048) */
const MAX_LOG_TEXT_LENGTH = 2048;

/**
 * Smart truncation: keep 80% from start + 20% from end with marker.
 * Same pattern as LiteLLM's spend_tracking_utils.
 */
function truncateLogText(text: string, maxLen: number = MAX_LOG_TEXT_LENGTH): string {
  if (!text || text.length <= maxLen) return text;
  const startChars = Math.floor(maxLen * 0.8);
  const endChars = Math.max(0, maxLen - startChars - 60);
  const skipped = text.length - startChars - endChars;
  return `${text.slice(0, startChars)} ... (truncated ${skipped} chars) ... ${text.slice(-endChars)}`;
}

/**
 * Truncate request messages: keep last 3 messages, truncate each content.
 */
function truncateMessages(messages: any): any {
  if (!messages || !Array.isArray(messages)) return messages;
  const lastN = messages.slice(-3);
  return lastN.map((m: any) => ({
    ...m,
    content: typeof m.content === "string" ? truncateLogText(m.content) : m.content,
  }));
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
  // Extract virtual key ID from metadata if present
  const virtualKeyId = (extra?.metadata as any)?.virtual_key_id
    ? Number((extra!.metadata as any).virtual_key_id)
    : undefined;
  try {
    // Use cached settings (populated by runGuardrails or fetched here with 60s TTL)
    let settings = getCachedSettings(organizationId);
    if (!settings) {
      try {
        settings = await getGuardrailSettingsQuery(organizationId);
        if (settings) setCachedSettings(organizationId, settings);
      } catch (err) {
        logger.warn("Failed to fetch guardrail settings for log config:", err);
      }
    }
    const logBodies = {
      request: settings?.log_request_body === true,
      response: settings?.log_response_body === true,
    };

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
      request_messages: logBodies.request ? truncateMessages(extra?.request_messages) : undefined,
      response_text: logBodies.response && extra?.response_text ? truncateLogText(extra.response_text) : undefined,
      error_message: extra?.error_message ? truncateLogText(extra.error_message, 500) : undefined,
      virtual_key_id: virtualKeyId,
    });
  } catch (err) {
    logger.error("Failed to insert spend log:", err);
  }

  try {
    await adjustBudgetSpendQuery(organizationId, estimatedCost, costUsd);
  } catch (err) {
    logger.error("Failed to adjust budget spend:", err);
  }

  // Increment virtual key spend if applicable
  if (virtualKeyId && costUsd > 0) {
    try {
      const updated = await incrementVirtualKeySpend(virtualKeyId, costUsd);
      // Check virtual key budget alert using returned values (no extra DB query)
      if (updated) {
        checkVirtualKeyBudgetAlert(
          virtualKeyId, organizationId, updated.name,
          Number(updated.current_spend_usd), updated.max_budget_usd ? Number(updated.max_budget_usd) : null
        ).catch((err) =>
          logger.error("Failed to check virtual key budget alert:", err)
        );
      }
    } catch (err) {
      logger.error("Failed to increment virtual key spend:", err);
    }
  }

  // Check budget alert threshold (non-blocking)
  try {
    await checkBudgetAlert(organizationId);
  } catch (err) {
    logger.error("Failed to check budget alert:", err);
  }
}

/**
 * Get the current month key and TTL for monthly Redis alert deduplication.
 */
function getMonthlyAlertTtl(): { month: string; ttl: number } {
  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - now.getDate() + 1;
  return { month, ttl: daysRemaining * 86400 };
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

  const { month, ttl } = getMonthlyAlertTtl();

  logger.info(`Budget alert: org ${organizationId} at ${spendPct.toFixed(1)}% (threshold: ${threshold}%)`);

  // Separate Redis keys so both warning AND exhausted can fire in the same month
  if (spendPct >= 100 && budget.is_hard_limit) {
    const exhaustedKey = `gw:alert:exhausted:${organizationId}:${month}`;
    if (await redisClient.get(exhaustedKey)) return;
    await redisClient.set(exhaustedKey, "1", "EX", ttl);
    notifyBudgetExhausted(organizationId, budget).catch((err) =>
      logger.error("Failed to send budget exhausted notification:", err)
    );
  } else {
    const warningKey = `gw:alert:warning:${organizationId}:${month}`;
    if (await redisClient.get(warningKey)) return;
    await redisClient.set(warningKey, "1", "EX", ttl);
    notifyBudgetWarning(organizationId, budget).catch((err) =>
      logger.error("Failed to send budget warning notification:", err)
    );
  }
}

/**
 * Check if virtual key budget is exhausted and send notification.
 * Accepts spend/limit values from incrementVirtualKeySpend to avoid a second DB query.
 */
async function checkVirtualKeyBudgetAlert(
  virtualKeyId: number,
  organizationId: number,
  keyName: string,
  spend: number,
  limit: number | null
): Promise<void> {
  if (!limit || spend < limit) return;

  const { month, ttl } = getMonthlyAlertTtl();
  const alertKey = `gw:alert:vk:exhausted:${virtualKeyId}:${month}`;
  if (await redisClient.get(alertKey)) return;

  await redisClient.set(alertKey, "1", "EX", ttl);

  notifyVirtualKeyBudgetExhausted(organizationId, keyName, spend, limit).catch((err) =>
    logger.error("Failed to send virtual key budget exhausted notification:", err)
  );
}

/**
 * Proxy a chat completion request through the FastAPI gateway
 */
export async function proxyCompletion(
  organizationId: number,
  endpointSlug: string,
  messages: Array<{ role: string; content: string }>,
  options: CompletionOptions,
  userId: number,
  _fallbackDepth: number = 0
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

  // Resolve prompt template if endpoint has a prompt_id bound
  const finalMessages = await buildFinalMessages(
    organizationId,
    endpoint,
    scannedMessages,
    options.metadata
  );

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
        metadata: options.metadata,
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

    // Fallback: if the endpoint has a fallback and the error is from the LLM provider, retry
    if (
      err instanceof ExternalServiceException &&
      endpoint.fallback_endpoint_id &&
      _fallbackDepth < MAX_FALLBACK_DEPTH
    ) {
      try {
        const fallbackEp = await getEndpointByIdQuery(organizationId, endpoint.fallback_endpoint_id);
        if (fallbackEp && fallbackEp.is_active) {
          logger.info(`Falling back from ${endpointSlug} to ${fallbackEp.slug} (depth ${_fallbackDepth + 1}/${MAX_FALLBACK_DEPTH})`);
          return proxyCompletion(organizationId, fallbackEp.slug, messages, options, userId, _fallbackDepth + 1);
        }
      } catch (fallbackErr) {
        logger.error("Fallback resolution failed:", fallbackErr);
      }
    }

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
  userId: number,
  _fallbackDepth: number = 0
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

  // Resolve prompt template if endpoint has a prompt_id bound
  const finalMessages = await buildFinalMessages(
    organizationId,
    endpoint,
    scannedMessages,
    options.metadata
  );

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
    await adjustBudgetSpendQuery(organizationId, estimatedCost, 0);

    // Fallback: if endpoint has a fallback and the error is from the provider, retry
    if (endpoint.fallback_endpoint_id && _fallbackDepth < MAX_FALLBACK_DEPTH) {
      try {
        const fallbackEp = await getEndpointByIdQuery(organizationId, endpoint.fallback_endpoint_id);
        if (fallbackEp && fallbackEp.is_active) {
          logger.info(`Stream falling back from ${endpointSlug} to ${fallbackEp.slug} (depth ${_fallbackDepth + 1}/${MAX_FALLBACK_DEPTH})`);
          return proxyStream(organizationId, fallbackEp.slug, messages, options, userId, _fallbackDepth + 1);
        }
      } catch (fallbackErr) {
        logger.error("Stream fallback resolution failed:", fallbackErr);
      }
    }

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
      estimatedCost,
      { metadata: options.metadata, request_messages: finalMessages }
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
