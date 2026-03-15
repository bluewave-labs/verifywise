/**
 * Virtual Key Proxy Controller
 *
 * Handles OpenAI-compatible proxy requests authenticated via virtual keys.
 * Translates OpenAI SDK format (model field = endpoint slug) to gateway format.
 */

import { Request, Response } from "express";
import logger from "../utils/logger/fileLogger";
import { proxyCompletion, proxyStream, proxyEmbedding } from "../services/aiGateway.service";
import { getEndpointBySlugQuery } from "../utils/aiGatewayEndpoint.utils";
import { openAIError } from "../utils/openAIErrorResponse";
import { pipeStreamWithCleanup } from "../utils/streamCleanup.utils";

/**
 * Validate that the model (endpoint slug) is accessible by this virtual key.
 * If allowed_endpoint_ids is empty, all endpoints are allowed.
 */
async function validateEndpointAccess(
  organizationId: number,
  model: string,
  allowedEndpointIds: number[]
): Promise<{ slug: string } | { error: string }> {
  if (!allowedEndpointIds || allowedEndpointIds.length === 0) {
    return { slug: model };
  }

  const endpoint = await getEndpointBySlugQuery(organizationId, model);
  if (!endpoint) {
    return { error: `Model '${model}' not found` };
  }
  if (!endpoint.is_active) {
    return { error: `Model '${model}' is not available` };
  }
  if (!allowedEndpointIds.includes(endpoint.id)) {
    return { error: `This API key does not have access to model '${model}'` };
  }

  return { slug: model };
}

/**
 * POST /v1/chat/completions
 *
 * OpenAI-compatible chat completion endpoint.
 * Supports both streaming and non-streaming.
 */
export async function chatCompletions(req: Request, res: Response) {
  const vk = req.virtualKey;
  if (!vk) {
    return openAIError(res, 401, "Authentication required", "invalid_request_error", "missing_api_key");
  }

  try {
    const { model, messages, max_tokens, temperature, top_p, stream } = req.body;

    if (!model || !messages) {
      return openAIError(res, 400, "'model' and 'messages' are required", "invalid_request_error", "invalid_request");
    }

    const resolved = await validateEndpointAccess(vk.organizationId, model, vk.allowed_endpoint_ids);
    if ("error" in resolved) {
      return openAIError(res, 404, resolved.error, "invalid_request_error", "model_not_found");
    }

    const metadata = {
      ...(vk.metadata || {}),
      virtual_key_id: String(vk.id),
      virtual_key_name: vk.name,
    };

    if (stream) {
      const { stream: nodeStream, cleanup } = await proxyStream(
        vk.organizationId,
        resolved.slug,
        messages,
        { max_tokens, temperature, top_p, metadata },
        0, // userId = 0 for virtual key requests
        0  // fallback depth
      );

      pipeStreamWithCleanup(nodeStream, req, res, cleanup);
      return;
    }

    const result = await proxyCompletion(
      vk.organizationId,
      resolved.slug,
      messages,
      { max_tokens, temperature, top_p, metadata },
      0
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
  const vk = req.virtualKey;
  if (!vk) {
    return openAIError(res, 401, "Authentication required", "invalid_request_error", "missing_api_key");
  }

  try {
    const { model, input } = req.body;

    if (!model || !input) {
      return openAIError(res, 400, "'model' and 'input' are required", "invalid_request_error", "invalid_request");
    }

    const resolved = await validateEndpointAccess(vk.organizationId, model, vk.allowed_endpoint_ids);
    if ("error" in resolved) {
      return openAIError(res, 404, resolved.error, "invalid_request_error", "model_not_found");
    }

    const result = await proxyEmbedding(
      vk.organizationId,
      resolved.slug,
      input,
      0
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
