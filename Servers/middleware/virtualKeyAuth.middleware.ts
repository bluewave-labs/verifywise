/**
 * Virtual Key Authentication Middleware
 *
 * Authenticates requests using virtual keys (sk-vw-xxx Bearer tokens).
 * Used for OpenAI-compatible /v1/* proxy routes.
 * Returns OpenAI-compatible error JSON on failure.
 */

import { Request, Response, NextFunction } from "express";
import { hashVirtualKey, getVirtualKeyByHashQuery } from "../utils/aiGatewayVirtualKey.utils";
import { checkRateLimit } from "../utils/aiGatewayRateLimit.utils";
import { openAIError } from "../utils/openAIErrorResponse";
import logger from "../utils/logger/fileLogger";

/**
 * Express middleware for virtual key authentication.
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Validate prefix starts with "sk-vw-"
 * 3. SHA-256 hash the token
 * 4. Look up in ai_gateway_virtual_keys by key_hash
 * 5. Check: is_active, not revoked, not expired
 * 6. Check: budget not exceeded
 * 7. Check: rate limit via Redis
 * 8. Attach virtualKey info to req
 */
const authenticateVirtualKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return openAIError(res, 401, "Missing Authorization header with Bearer token", "invalid_request_error", "missing_api_key");
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  if (!token.startsWith("sk-vw-")) {
    return openAIError(res, 401, "Invalid API key format. Expected sk-vw-* virtual key.", "invalid_request_error", "invalid_api_key");
  }

  try {
    const keyHash = hashVirtualKey(token);
    const virtualKey = await getVirtualKeyByHashQuery(keyHash);

    if (!virtualKey) {
      return openAIError(res, 401, "Invalid API key", "invalid_request_error", "invalid_api_key");
    }

    // Check active status
    if (!virtualKey.is_active) {
      return openAIError(res, 401, "This API key has been revoked", "invalid_request_error", "api_key_revoked");
    }

    // Check revoked_at
    if (virtualKey.revoked_at) {
      return openAIError(res, 401, "This API key has been revoked", "invalid_request_error", "api_key_revoked");
    }

    // Check expiration
    if (virtualKey.expires_at && new Date(virtualKey.expires_at) < new Date()) {
      return openAIError(res, 401, "This API key has expired", "invalid_request_error", "api_key_expired");
    }

    // Check budget
    if (virtualKey.max_budget_usd !== null && virtualKey.max_budget_usd !== undefined) {
      const spend = Number(virtualKey.current_spend_usd) || 0;
      const limit = Number(virtualKey.max_budget_usd);
      if (spend >= limit) {
        return openAIError(res, 429, `Budget limit exceeded for this key ($${spend.toFixed(4)} / $${limit.toFixed(2)})`, "insufficient_quota", "budget_exceeded");
      }
    }

    // Check rate limit (use "vk:" prefix to avoid collision with endpoint rate limit keys)
    if (virtualKey.rate_limit_rpm && virtualKey.rate_limit_rpm > 0) {
      const rl = await checkRateLimit(
        `vk:${virtualKey.id}`,
        virtualKey.rate_limit_rpm
      );
      if (!rl.allowed) {
        return openAIError(res, 429, `Rate limit exceeded (${virtualKey.rate_limit_rpm} RPM)`, "rate_limit_error", "rate_limit_exceeded");
      }
    }

    // Attach virtual key info to request
    req.virtualKey = {
      id: virtualKey.id,
      organizationId: virtualKey.organization_id,
      name: virtualKey.name,
      allowed_endpoint_ids: virtualKey.allowed_endpoint_ids || [],
      metadata: virtualKey.metadata || {},
    };

    // Set organizationId for downstream services
    req.organizationId = virtualKey.organization_id;

    next();
  } catch (error) {
    logger.error("Virtual key auth error:", error);
    return openAIError(res, 500, "Internal server error during authentication", "api_error", "internal_error");
  }
};

export default authenticateVirtualKey;
