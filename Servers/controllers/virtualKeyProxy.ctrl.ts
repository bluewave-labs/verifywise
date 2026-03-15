/**
 * Virtual Key Proxy Controller
 *
 * Handles OpenAI-compatible proxy requests authenticated via virtual keys.
 * Translates OpenAI SDK format (model field = endpoint slug) to gateway format.
 */

import { Request, Response } from "express";
import logger from "../utils/logger/fileLogger";
import { proxyCompletion, proxyStream, proxyEmbedding } from "../services/aiGateway.service";

/**
 * OpenAI-compatible error response.
 */
function openAIError(res: Response, status: number, message: string, type: string, code: string) {
  return res.status(status).json({
    error: { message, type, code },
  });
}

/**
 * Resolve endpoint slug from the model field.
 * If the virtual key has allowed_endpoint_ids, validate the endpoint is permitted.
 */
async function resolveEndpointSlug(
  organizationId: number,
  model: string,
  allowedEndpointIds: number[]
): Promise<{ slug: string } | { error: string }> {
  // model field is treated as the endpoint slug
  const slug = model;

  // If allowed_endpoint_ids is empty, all endpoints are allowed
  if (!allowedEndpointIds || allowedEndpointIds.length === 0) {
    return { slug };
  }

  // Validate the slug maps to an allowed endpoint
  // We need to check if there's an endpoint with this slug that's in the allowed list
  // The proxyCompletion service will resolve by slug, but we need to pre-check
  const { sequelize } = require("../database/db");
  const result = (await sequelize.query(
    `SELECT id FROM ai_gateway_endpoints
     WHERE organization_id = :organizationId AND slug = :slug AND is_active = true`,
    { replacements: { organizationId, slug } }
  )) as [any[], number];

  if (result[0].length === 0) {
    return { error: `Model '${model}' not found` };
  }

  const endpointId = result[0][0].id;
  if (!allowedEndpointIds.includes(endpointId)) {
    return { error: `This API key does not have access to model '${model}'` };
  }

  return { slug };
}

/**
 * POST /v1/chat/completions
 *
 * OpenAI-compatible chat completion endpoint.
 * Supports both streaming and non-streaming.
 */
export async function chatCompletions(req: Request, res: Response) {
  const vk = (req as any).virtualKey;
  if (!vk) {
    return openAIError(res, 401, "Authentication required", "invalid_request_error", "missing_api_key");
  }

  try {
    const { model, messages, max_tokens, temperature, top_p, stream } = req.body;

    if (!model || !messages) {
      return openAIError(res, 400, "'model' and 'messages' are required", "invalid_request_error", "invalid_request");
    }

    // Resolve endpoint slug from model field
    const resolved = await resolveEndpointSlug(vk.organizationId, model, vk.allowed_endpoint_ids);
    if ("error" in resolved) {
      return openAIError(res, 404, resolved.error, "invalid_request_error", "model_not_found");
    }

    const metadata = {
      ...((vk.metadata as Record<string, string>) || {}),
      virtual_key_id: String(vk.id),
      virtual_key_name: vk.name,
    };

    if (stream) {
      // Streaming response
      const { stream: nodeStream, cleanup } = await proxyStream(
        vk.organizationId,
        resolved.slug,
        messages,
        { max_tokens, temperature, top_p, metadata },
        0, // userId = 0 for virtual key requests
        0  // fallback depth
      );

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      nodeStream.pipe(res);

      let cleanedUp = false;
      const doCleanup = async () => {
        if (cleanedUp) return;
        cleanedUp = true;
        await cleanup();
      };

      nodeStream.on("end", doCleanup);
      nodeStream.on("error", async (err) => {
        logger.error("Virtual key stream error:", err);
        await doCleanup();
        if (!res.headersSent) {
          res.status(500).end();
        }
      });

      req.on("close", async () => {
        if (!res.writableEnded) {
          nodeStream.destroy();
          await doCleanup();
        }
      });

      return;
    }

    // Non-streaming response
    const result = await proxyCompletion(
      vk.organizationId,
      resolved.slug,
      messages,
      { max_tokens, temperature, top_p, metadata },
      0 // userId = 0 for virtual key requests
    );

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message?.includes("blocked by guardrail")) {
      return openAIError(res, 400, error.message, "invalid_request_error", "content_policy_violation");
    }
    if (error.code === "budget_exceeded") {
      return openAIError(res, 429, error.message, "insufficient_quota", "budget_exceeded");
    }
    if (error.code === "rate_limited") {
      return openAIError(res, 429, error.message, "rate_limit_error", "rate_limit_exceeded");
    }
    if (error.message?.includes("not found")) {
      return openAIError(res, 404, error.message, "invalid_request_error", "model_not_found");
    }
    if (error.message?.includes("inactive")) {
      return openAIError(res, 400, error.message, "invalid_request_error", "model_not_available");
    }
    logger.error("Virtual key chat completion error:", error);
    return openAIError(res, 500, "Internal server error", "api_error", "internal_error");
  }
}

/**
 * POST /v1/embeddings
 *
 * OpenAI-compatible embeddings endpoint.
 */
export async function embeddings(req: Request, res: Response) {
  const vk = (req as any).virtualKey;
  if (!vk) {
    return openAIError(res, 401, "Authentication required", "invalid_request_error", "missing_api_key");
  }

  try {
    const { model, input } = req.body;

    if (!model || !input) {
      return openAIError(res, 400, "'model' and 'input' are required", "invalid_request_error", "invalid_request");
    }

    const resolved = await resolveEndpointSlug(vk.organizationId, model, vk.allowed_endpoint_ids);
    if ("error" in resolved) {
      return openAIError(res, 404, resolved.error, "invalid_request_error", "model_not_found");
    }

    const result = await proxyEmbedding(
      vk.organizationId,
      resolved.slug,
      input,
      0 // userId = 0 for virtual key requests
    );

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return openAIError(res, 404, error.message, "invalid_request_error", "model_not_found");
    }
    logger.error("Virtual key embedding error:", error);
    return openAIError(res, 500, "Internal server error", "api_error", "internal_error");
  }
}
