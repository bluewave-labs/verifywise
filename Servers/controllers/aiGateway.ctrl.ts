import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import {
  ValidationException,
} from "../domain.layer/exceptions/custom.exception";

// Guardrail utils
import {
  getAllGuardrailsQuery,
  createGuardrailQuery,
  updateGuardrailQuery,
  deleteGuardrailQuery,
  getGuardrailSettingsQuery,
  upsertGuardrailSettingsQuery,
  getGuardrailLogsQuery,
  getGuardrailStatsQuery,
  getGuardrailStatsByTypeQuery,
  getGuardrailStatsByDayQuery,
  purgeGuardrailLogsQuery,
  getActiveGuardrailsQuery,
} from "../utils/aiGatewayGuardrail.utils";

// API Key utils
import {
  getAllApiKeysQuery,
  createApiKeyQuery,
  updateApiKeyQuery,
  deleteApiKeyQuery,
} from "../utils/aiGatewayApiKey.utils";

// Endpoint utils
import {
  getAllEndpointsQuery,
  getEndpointByIdQuery,
  createEndpointQuery,
  updateEndpointQuery,
  deleteEndpointQuery,
} from "../utils/aiGatewayEndpoint.utils";

// Spend utils
import {
  getSpendSummaryQuery,
  getSpendByModelQuery,
  getSpendByEndpointQuery,
  getSpendByUserQuery,
  getSpendByDayQuery,
  getSpendByTagQuery,
} from "../utils/aiGatewaySpendLog.utils";

// Budget utils
import {
  getBudgetQuery,
  upsertBudgetQuery,
} from "../utils/aiGatewayBudget.utils";

// Service
import {
  proxyCompletion,
  proxyStream,
  proxyEmbedding,
} from "../services/aiGateway.service";

const fileName = "aiGateway.ctrl.ts";
const ROLE_NAME_TO_ID: Record<string, number> = {
  Admin: 1, Reviewer: 2, Editor: 3, Auditor: 4,
};
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

function parseId(raw: string | string[]): number {
  const id = Number(raw);
  if (isNaN(id) || id <= 0) {
    throw new ValidationException("Invalid ID parameter");
  }
  return id;
}

// ─── API Keys ────────────────────────────────────────────────────────────────

export async function getApiKeys(req: Request, res: Response) {
  const fn = "getApiKeys";
  logStructured("processing", "fetching all gateway API keys", fn, fileName);
  try {
    const keys = await getAllApiKeysQuery(req.organizationId!);
    logStructured("successful", "gateway API keys fetched", fn, fileName);
    return res.status(200).json(STATUS_CODE[200](keys));
  } catch (error) {
    logStructured("error", "failed to fetch gateway API keys", fn, fileName);
    logger.error("Error fetching gateway API keys:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function createApiKey(req: Request, res: Response) {
  const fn = "createApiKey";
  logStructured("processing", "creating gateway API key", fn, fileName);
  try {
    const { provider, key_name, api_key } = req.body;
    if (!provider || !key_name || !api_key) {
      throw new ValidationException("provider, key_name, and api_key are required");
    }

    const key = await createApiKeyQuery(req.organizationId!, { provider, key_name, api_key });
    logStructured("successful", `gateway API key created: ${key_name}`, fn, fileName);
    return res.status(201).json(STATUS_CODE[201](key));
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }
    logStructured("error", "failed to create gateway API key", fn, fileName);
    logger.error("Error creating gateway API key:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function updateApiKey(req: Request, res: Response) {
  const fn = "updateApiKey";
  logStructured("processing", "updating gateway API key", fn, fileName);
  try {
    const id = parseId(req.params.id);
    const updated = await updateApiKeyQuery(req.organizationId!, id, req.body);
    if (!updated) {
      return res.status(404).json(STATUS_CODE[404]("API key not found"));
    }
    logStructured("successful", `gateway API key updated: ${id}`, fn, fileName);
    return res.status(200).json(STATUS_CODE[200](updated));
  } catch (error) {
    logStructured("error", "failed to update gateway API key", fn, fileName);
    logger.error("Error updating gateway API key:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function deleteApiKey(req: Request, res: Response) {
  const fn = "deleteApiKey";
  logStructured("processing", "deleting gateway API key", fn, fileName);
  try {
    const id = parseId(req.params.id);
    const deleted = await deleteApiKeyQuery(req.organizationId!, id);
    if (!deleted) {
      return res.status(404).json(STATUS_CODE[404]("API key not found"));
    }
    logStructured("successful", `gateway API key deleted: ${id}`, fn, fileName);
    return res.status(200).json(STATUS_CODE[200]({ deleted: true }));
  } catch (error) {
    logStructured("error", "failed to delete gateway API key", fn, fileName);
    logger.error("Error deleting gateway API key:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

export async function getEndpoints(req: Request, res: Response) {
  const fn = "getEndpoints";
  logStructured("processing", "fetching all gateway endpoints", fn, fileName);
  try {
    const roleId = ROLE_NAME_TO_ID[(req as any).role] || undefined;
    const endpoints = await getAllEndpointsQuery(req.organizationId!, roleId);
    logStructured("successful", "gateway endpoints fetched", fn, fileName);
    return res.status(200).json(STATUS_CODE[200](endpoints));
  } catch (error) {
    logStructured("error", "failed to fetch gateway endpoints", fn, fileName);
    logger.error("Error fetching gateway endpoints:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function getEndpoint(req: Request, res: Response) {
  const fn = "getEndpoint";
  logStructured("processing", "fetching gateway endpoint", fn, fileName);
  try {
    const id = parseId(req.params.id);
    const endpoint = await getEndpointByIdQuery(req.organizationId!, id);
    if (!endpoint) {
      return res.status(404).json(STATUS_CODE[404]("Endpoint not found"));
    }
    logStructured("successful", `gateway endpoint fetched: ${id}`, fn, fileName);
    return res.status(200).json(STATUS_CODE[200](endpoint));
  } catch (error) {
    logStructured("error", "failed to fetch gateway endpoint", fn, fileName);
    logger.error("Error fetching gateway endpoint:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function createEndpoint(req: Request, res: Response) {
  const fn = "createEndpoint";
  logStructured("processing", "creating gateway endpoint", fn, fileName);
  try {
    const { slug, display_name, provider, model, api_key_id } = req.body;
    if (!slug || !display_name || !provider || !model || !api_key_id) {
      throw new ValidationException("slug, display_name, provider, model, and api_key_id are required");
    }
    if (!SLUG_PATTERN.test(slug)) {
      throw new ValidationException("slug must be lowercase alphanumeric with hyphens (e.g., prod-gpt4o)");
    }

    const endpoint = await createEndpointQuery(req.organizationId!, {
      slug,
      display_name,
      provider,
      model,
      api_key_id,
      max_tokens: req.body.max_tokens,
      temperature: req.body.temperature,
      system_prompt: req.body.system_prompt,
      rate_limit_rpm: req.body.rate_limit_rpm,
    });
    logStructured("successful", `gateway endpoint created: ${slug}`, fn, fileName);
    return res.status(201).json(STATUS_CODE[201](endpoint));
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }
    logStructured("error", "failed to create gateway endpoint", fn, fileName);
    logger.error("Error creating gateway endpoint:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function updateEndpoint(req: Request, res: Response) {
  const fn = "updateEndpoint";
  logStructured("processing", "updating gateway endpoint", fn, fileName);
  try {
    const id = parseId(req.params.id);
    if (req.body.slug && !SLUG_PATTERN.test(req.body.slug)) {
      throw new ValidationException("slug must be lowercase alphanumeric with hyphens (e.g., prod-gpt4o)");
    }
    const updated = await updateEndpointQuery(req.organizationId!, id, req.body);
    if (!updated) {
      return res.status(404).json(STATUS_CODE[404]("Endpoint not found"));
    }
    logStructured("successful", `gateway endpoint updated: ${id}`, fn, fileName);
    return res.status(200).json(STATUS_CODE[200](updated));
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }
    logStructured("error", "failed to update gateway endpoint", fn, fileName);
    logger.error("Error updating gateway endpoint:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function deleteEndpoint(req: Request, res: Response) {
  const fn = "deleteEndpoint";
  logStructured("processing", "deleting gateway endpoint", fn, fileName);
  try {
    const id = parseId(req.params.id);
    const deleted = await deleteEndpointQuery(req.organizationId!, id);
    if (!deleted) {
      return res.status(404).json(STATUS_CODE[404]("Endpoint not found"));
    }
    logStructured("successful", `gateway endpoint deleted: ${id}`, fn, fileName);
    return res.status(200).json(STATUS_CODE[200]({ deleted: true }));
  } catch (error) {
    logStructured("error", "failed to delete gateway endpoint", fn, fileName);
    logger.error("Error deleting gateway endpoint:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

// ─── Spend ───────────────────────────────────────────────────────────────────

function getDateRange(period: string): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  switch (period) {
    case "1d":
      start.setDate(start.getDate() - 1);
      break;
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    default:
      start.setDate(start.getDate() - 7);
  }
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export async function getSpendSummary(req: Request, res: Response) {
  const fn = "getSpendSummary";
  logStructured("processing", "fetching spend summary", fn, fileName);
  try {
    const period = (req.query.period as string) || "7d";
    const { startDate, endDate } = getDateRange(period);
    const [summary, byDay, byModel] = await Promise.all([
      getSpendSummaryQuery(req.organizationId!, startDate, endDate),
      getSpendByDayQuery(req.organizationId!, startDate, endDate, period),
      getSpendByModelQuery(req.organizationId!, startDate, endDate),
    ]);

    logStructured("successful", "spend summary fetched", fn, fileName);
    return res.status(200).json(STATUS_CODE[200]({ summary, byDay, byModel }));
  } catch (error) {
    logStructured("error", "failed to fetch spend summary", fn, fileName);
    logger.error("Error fetching spend summary:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function getSpendByEndpoint(req: Request, res: Response) {
  const fn = "getSpendByEndpoint";
  logStructured("processing", "fetching spend by endpoint", fn, fileName);
  try {
    const period = (req.query.period as string) || "7d";
    const { startDate, endDate } = getDateRange(period);
    const data = await getSpendByEndpointQuery(req.organizationId!, startDate, endDate);
    logStructured("successful", "spend by endpoint fetched", fn, fileName);
    return res.status(200).json(STATUS_CODE[200](data));
  } catch (error) {
    logStructured("error", "failed to fetch spend by endpoint", fn, fileName);
    logger.error("Error fetching spend by endpoint:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function getSpendByUser(req: Request, res: Response) {
  const fn = "getSpendByUser";
  logStructured("processing", "fetching spend by user", fn, fileName);
  try {
    const period = (req.query.period as string) || "7d";
    const { startDate, endDate } = getDateRange(period);
    const data = await getSpendByUserQuery(req.organizationId!, startDate, endDate);
    logStructured("successful", "spend by user fetched", fn, fileName);
    return res.status(200).json(STATUS_CODE[200](data));
  } catch (error) {
    logStructured("error", "failed to fetch spend by user", fn, fileName);
    logger.error("Error fetching spend by user:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function getSpendByTag(req: Request, res: Response) {
  const fn = "getSpendByTag";
  logStructured("processing", "fetching spend by tag", fn, fileName);
  try {
    const period = (req.query.period as string) || "7d";
    const tagKey = (req.query.tag as string) || "department";
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(tagKey)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid tag key"));
    }
    const { startDate, endDate } = getDateRange(period);
    const data = await getSpendByTagQuery(req.organizationId!, tagKey, startDate, endDate);
    logStructured("successful", "spend by tag fetched", fn, fileName);
    return res.status(200).json(STATUS_CODE[200](data));
  } catch (error) {
    logStructured("error", "failed to fetch spend by tag", fn, fileName);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

// ─── Budget ──────────────────────────────────────────────────────────────────

export async function getBudget(req: Request, res: Response) {
  const fn = "getBudget";
  logStructured("processing", "fetching gateway budget", fn, fileName);
  try {
    const budget = await getBudgetQuery(req.organizationId!);
    logStructured("successful", "gateway budget fetched", fn, fileName);
    return res.status(200).json(STATUS_CODE[200](budget));
  } catch (error) {
    logStructured("error", "failed to fetch gateway budget", fn, fileName);
    logger.error("Error fetching gateway budget:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function upsertBudget(req: Request, res: Response) {
  const fn = "upsertBudget";
  logStructured("processing", "upserting gateway budget", fn, fileName);
  try {
    const monthly_limit_usd = Number(req.body.monthly_limit_usd);
    if (isNaN(monthly_limit_usd) || monthly_limit_usd <= 0) {
      throw new ValidationException("monthly_limit_usd must be a positive number");
    }

    const alert_threshold_pct = Number(req.body.alert_threshold_pct ?? 80);
    if (isNaN(alert_threshold_pct) || alert_threshold_pct < 0 || alert_threshold_pct > 100) {
      throw new ValidationException("alert_threshold_pct must be between 0 and 100");
    }

    const budget = await upsertBudgetQuery(req.organizationId!, {
      monthly_limit_usd,
      alert_threshold_pct,
      is_hard_limit: req.body.is_hard_limit,
    });
    logStructured("successful", "gateway budget upserted", fn, fileName);
    return res.status(200).json(STATUS_CODE[200](budget));
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }
    logStructured("error", "failed to upsert gateway budget", fn, fileName);
    logger.error("Error upserting gateway budget:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

// ─── Proxy ───────────────────────────────────────────────────────────────────

export async function chatCompletion(req: Request, res: Response) {
  const fn = "chatCompletion";
  logStructured("processing", "proxying chat completion", fn, fileName);
  try {
    const { endpoint_slug, messages, max_tokens, temperature, top_p } = req.body;
    if (!endpoint_slug || !messages) {
      throw new ValidationException("endpoint_slug and messages are required");
    }

    const result = await proxyCompletion(
      req.organizationId!,
      endpoint_slug,
      messages,
      { max_tokens, temperature, top_p },
      Number(req.userId)
    );

    logStructured("successful", "chat completion proxied", fn, fileName);
    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error: any) {
    if (error instanceof ValidationException) {
      const isGuardrailBlock = error.message.includes("blocked by guardrail");
      const status = isGuardrailBlock ? 422 : 400;
      return res.status(status).json({ message: error.message, guardrail_blocked: isGuardrailBlock });
    }
    if (error.code === "budget_exceeded" || error.code === "rate_limited") {
      return res.status(429).json({ message: error.message, code: error.code });
    }
    logStructured("error", "failed to proxy chat completion", fn, fileName);
    logger.error("Error proxying chat completion:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function chatCompletionStream(req: Request, res: Response) {
  const fn = "chatCompletionStream";
  logStructured("processing", "proxying streaming chat completion", fn, fileName);
  try {
    const { endpoint_slug, messages, max_tokens, temperature, top_p } = req.body;
    if (!endpoint_slug || !messages) {
      throw new ValidationException("endpoint_slug and messages are required");
    }

    const { stream, cleanup } = await proxyStream(
      req.organizationId!,
      endpoint_slug,
      messages,
      { max_tokens, temperature, top_p },
      Number(req.userId)
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    stream.pipe(res);

    let cleanedUp = false;
    const doCleanup = async () => {
      if (cleanedUp) return;
      cleanedUp = true;
      await cleanup();
    };

    stream.on("end", doCleanup);
    stream.on("error", async (err) => {
      logger.error("Stream error:", err);
      await doCleanup();
      if (!res.headersSent) {
        res.status(500).end();
      }
    });

    // Handle client disconnect mid-stream
    req.on("close", async () => {
      if (!res.writableEnded) {
        stream.destroy();
        await doCleanup();
      }
    });

    return;
  } catch (error: any) {
    if (error instanceof ValidationException) {
      const isGuardrailBlock = error.message.includes("blocked by guardrail");
      const status = isGuardrailBlock ? 422 : 400;
      return res.status(status).json({ message: error.message, guardrail_blocked: isGuardrailBlock });
    }
    if (error.code === "budget_exceeded") {
      return res.status(429).json({ message: error.message });
    }
    logStructured("error", "failed to proxy streaming chat", fn, fileName);
    logger.error("Error proxying streaming chat:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function embeddingProxy(req: Request, res: Response) {
  const fn = "embeddingProxy";
  logStructured("processing", "proxying embedding", fn, fileName);
  try {
    const { endpoint_slug, input } = req.body;
    if (!endpoint_slug || !input) {
      throw new ValidationException("endpoint_slug and input are required");
    }

    const result = await proxyEmbedding(
      req.organizationId!,
      endpoint_slug,
      input,
      Number(req.userId)
    );

    logStructured("successful", "embedding proxied", fn, fileName);
    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error: any) {
    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }
    logStructured("error", "failed to proxy embedding", fn, fileName);
    logger.error("Error proxying embedding:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

// ─── Providers ───────────────────────────────────────────────────────────────

const AI_GATEWAY_URL = process.env.AI_GATEWAY_URL || "http://localhost:8100";
const AI_GATEWAY_KEY = process.env.AI_GATEWAY_INTERNAL_KEY || "";

export async function getProviders(_req: Request, res: Response) {
  const fn = "getProviders";
  logStructured("processing", "fetching providers from AI Gateway", fn, fileName);
  try {
    const response = await fetch(`${AI_GATEWAY_URL}/v1/models`, {
      headers: { "x-internal-key": AI_GATEWAY_KEY },
    });

    if (!response.ok) {
      return res.status(200).json(STATUS_CODE[200]({ providers: [] }));
    }

    const data = await response.json();
    logStructured("successful", "providers fetched", fn, fileName);
    return res.status(200).json(STATUS_CODE[200]({ providers: data.providers || [] }));
  } catch {
    // If AIGateway is not running, return empty list
    return res.status(200).json(STATUS_CODE[200]({ providers: [] }));
  }
}

// ─── Guardrail Rules ─────────────────────────────────────────────────────────

export async function getGuardrails(req: Request, res: Response) {
  const fn = "getGuardrails";
  logStructured("processing", "fetching guardrail rules", fn, fileName);
  try {
    const rules = await getAllGuardrailsQuery(req.organizationId!);
    logStructured("successful", "guardrail rules fetched", fn, fileName);
    return res.status(200).json(STATUS_CODE[200](rules));
  } catch (error) {
    logStructured("error", "failed to fetch guardrail rules", fn, fileName);
    logger.error("Error fetching guardrail rules:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function createGuardrail(req: Request, res: Response) {
  const fn = "createGuardrail";
  logStructured("processing", "creating guardrail rule", fn, fileName);
  try {
    const { guardrail_type, name, config, scope, action } = req.body;
    if (!guardrail_type || !name) {
      throw new ValidationException("guardrail_type and name are required");
    }
    if (!["pii", "content_filter"].includes(guardrail_type)) {
      throw new ValidationException("guardrail_type must be 'pii' or 'content_filter'");
    }
    if (action && !["block", "mask"].includes(action)) {
      throw new ValidationException("action must be 'block' or 'mask'");
    }

    // Validate regex patterns for content filter
    if (guardrail_type === "content_filter" && config?.type === "regex" && config?.pattern) {
      try {
        new RegExp(config.pattern);
      } catch {
        throw new ValidationException("Invalid regex pattern");
      }
    }

    const rule = await createGuardrailQuery(req.organizationId!, {
      guardrail_type,
      name,
      config: config || {},
      scope,
      action,
      created_by: Number(req.userId),
    });
    logStructured("successful", `guardrail rule created: ${rule.id}`, fn, fileName);
    return res.status(201).json(STATUS_CODE[201](rule));
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }
    logStructured("error", "failed to create guardrail rule", fn, fileName);
    logger.error("Error creating guardrail rule:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function updateGuardrail(req: Request, res: Response) {
  const fn = "updateGuardrail";
  logStructured("processing", "updating guardrail rule", fn, fileName);
  try {
    const id = parseId(req.params.id);

    // Validate regex if updating content filter pattern
    if (req.body.config?.type === "regex" && req.body.config?.pattern) {
      try {
        new RegExp(req.body.config.pattern);
      } catch {
        throw new ValidationException("Invalid regex pattern");
      }
    }

    const updated = await updateGuardrailQuery(req.organizationId!, id, req.body);
    if (!updated) {
      return res.status(404).json(STATUS_CODE[404]("Guardrail rule not found"));
    }
    logStructured("successful", `guardrail rule updated: ${id}`, fn, fileName);
    return res.status(200).json(STATUS_CODE[200](updated));
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }
    logStructured("error", "failed to update guardrail rule", fn, fileName);
    logger.error("Error updating guardrail rule:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function deleteGuardrail(req: Request, res: Response) {
  const fn = "deleteGuardrail";
  logStructured("processing", "deleting guardrail rule", fn, fileName);
  try {
    const id = parseId(req.params.id);
    const deleted = await deleteGuardrailQuery(req.organizationId!, id);
    if (!deleted) {
      return res.status(404).json(STATUS_CODE[404]("Guardrail rule not found"));
    }
    logStructured("successful", `guardrail rule deleted: ${id}`, fn, fileName);
    return res.status(200).json(STATUS_CODE[200]({ deleted: true }));
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }
    logStructured("error", "failed to delete guardrail rule", fn, fileName);
    logger.error("Error deleting guardrail rule:", error);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

// ─── Guardrail Settings ──────────────────────────────────────────────────────

export async function getGuardrailSettings(req: Request, res: Response) {
  const fn = "getGuardrailSettings";
  try {
    const settings = await getGuardrailSettingsQuery(req.organizationId!);
    return res.status(200).json(STATUS_CODE[200](settings));
  } catch (error) {
    logStructured("error", "failed to fetch guardrail settings", fn, fileName);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function updateGuardrailSettings(req: Request, res: Response) {
  const fn = "updateGuardrailSettings";
  try {
    const settings = await upsertGuardrailSettingsQuery(req.organizationId!, req.body);
    logStructured("successful", "guardrail settings updated", fn, fileName);
    return res.status(200).json(STATUS_CODE[200](settings));
  } catch (error) {
    logStructured("error", "failed to update guardrail settings", fn, fileName);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

// ─── Guardrail Test (proxy to FastAPI) ───────────────────────────────────────

export async function testGuardrails(req: Request, res: Response) {
  const fn = "testGuardrails";
  logStructured("processing", "testing guardrail rules", fn, fileName);
  try {
    const { text } = req.body;
    if (!text) {
      throw new ValidationException("text is required");
    }

    // Get active rules and settings
    const [rules, settings] = await Promise.all([
      getActiveGuardrailsQuery(req.organizationId!),
      getGuardrailSettingsQuery(req.organizationId!),
    ]);

    const response = await fetch(`${AI_GATEWAY_URL}/v1/guardrails/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": AI_GATEWAY_KEY,
      },
      body: JSON.stringify({
        text,
        guardrail_rules: rules,
        settings: settings || {},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json(STATUS_CODE[500](errorText));
    }

    const data = await response.json();
    logStructured("successful", "guardrail test completed", fn, fileName);
    return res.status(200).json(STATUS_CODE[200](data));
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }
    logStructured("error", "failed to test guardrails", fn, fileName);
    logger.error("Error testing guardrails:", error);
    return res.status(500).json(STATUS_CODE[500]("Guardrail test failed — is the AI Gateway service running?"));
  }
}

// ─── Guardrail Logs & Stats ──────────────────────────────────────────────────

export async function getGuardrailLogs(req: Request, res: Response) {
  const fn = "getGuardrailLogs";
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const logs = await getGuardrailLogsQuery(req.organizationId!, limit, offset);
    return res.status(200).json(STATUS_CODE[200](logs));
  } catch (error) {
    logStructured("error", "failed to fetch guardrail logs", fn, fileName);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function getGuardrailStats(req: Request, res: Response) {
  const fn = "getGuardrailStats";
  try {
    const period = (req.query.period as string) || "7d";
    const { startDate, endDate } = getDateRange(period);

    const [summary, byType, byDay] = await Promise.all([
      getGuardrailStatsQuery(req.organizationId!, startDate, endDate),
      getGuardrailStatsByTypeQuery(req.organizationId!, startDate, endDate),
      getGuardrailStatsByDayQuery(req.organizationId!, startDate, endDate),
    ]);

    return res.status(200).json(STATUS_CODE[200]({ summary, byType, byDay }));
  } catch (error) {
    logStructured("error", "failed to fetch guardrail stats", fn, fileName);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}

export async function purgeGuardrailLogs(req: Request, res: Response) {
  const fn = "purgeGuardrailLogs";
  try {
    const settings = await getGuardrailSettingsQuery(req.organizationId!);
    const retentionDays = settings?.log_retention_days || 90;
    const deleted = await purgeGuardrailLogsQuery(req.organizationId!, retentionDays);
    logStructured("successful", `purged ${deleted} guardrail logs`, fn, fileName);
    return res.status(200).json(STATUS_CODE[200]({ deleted_count: deleted }));
  } catch (error) {
    logStructured("error", "failed to purge guardrail logs", fn, fileName);
    return res.status(500).json(STATUS_CODE[500]("Internal server error"));
  }
}
