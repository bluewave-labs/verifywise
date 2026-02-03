"use strict";
/**
 * Authentication Middleware - Virtual Key validation
 * Based on spec: docs/SPEC.md Sections 4.1, 4.2, 4.3
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.updateQuotaUsage = updateQuotaUsage;
exports.checkQuota = checkQuota;
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const configManager_1 = require("../config/configManager");
const eventQueue_1 = require("../queue/eventQueue");
require("../types/express-augment");
// Bounded LRU-style Map with max size to prevent memory leaks
const MAX_RATE_LIMIT_ENTRIES = 100000;
const MAX_QUOTA_ENTRIES = 100000;
// In-memory rate limit tracking with bounded size
// Key: key_id, Value: { count, windowStart }
const rateLimitState = new Map();
// In-memory quota tracking with bounded size
// Key: key_id, Value: { tokens, windowStart }
const quotaState = new Map();
/**
 * Evict oldest entries when Map exceeds max size
 */
function evictOldestEntries(map, maxSize) {
    if (map.size <= maxSize)
        return;
    // Delete oldest 10% when limit reached
    const toDelete = Math.ceil(map.size * 0.1);
    const iterator = map.keys();
    for (let i = 0; i < toDelete; i++) {
        const key = iterator.next().value;
        if (key)
            map.delete(key);
    }
}
/**
 * Constant-time string comparison to prevent timing attacks
 */
function safeCompare(a, b) {
    try {
        const bufA = Buffer.from(a);
        const bufB = Buffer.from(b);
        // If lengths differ, still do comparison but return false
        // This prevents length-based timing attacks
        if (bufA.length !== bufB.length) {
            crypto_1.default.timingSafeEqual(bufA, bufA); // Dummy comparison for constant time
            return false;
        }
        return crypto_1.default.timingSafeEqual(bufA, bufB);
    }
    catch {
        return false;
    }
}
function authMiddleware(req, res, next) {
    const correlationId = (0, uuid_1.v4)();
    const gatewayId = req.gatewayId;
    // Check if config is loaded
    if (!configManager_1.configManager.isLoaded()) {
        res.status(503).json({
            error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Gateway is not configured',
            },
        });
        return;
    }
    // Extract API key from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        logAuthFailure(correlationId, gatewayId, 'Missing Authorization header');
        res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Missing Authorization header',
            },
        });
        return;
    }
    // Support both "Bearer <key>" and just "<key>"
    let keyValue;
    if (authHeader.startsWith('Bearer ')) {
        keyValue = authHeader.substring(7);
    }
    else {
        keyValue = authHeader;
    }
    // Look up virtual key
    const virtualKey = configManager_1.configManager.getVirtualKey(keyValue);
    if (!virtualKey) {
        logAuthFailure(correlationId, gatewayId, 'Invalid virtual key');
        res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid API key',
            },
        });
        return;
    }
    // Check if key is active
    if (!virtualKey.active) {
        logAuthFailure(correlationId, gatewayId, 'Virtual key is inactive');
        res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: 'API key is inactive',
            },
        });
        return;
    }
    // Check rate limit
    const rateLimitProfile = configManager_1.configManager.getRateLimitProfile(virtualKey.rate_limit_profile_id);
    if (rateLimitProfile) {
        const rateLimitResult = checkRateLimit(virtualKey.key_id, rateLimitProfile);
        if (!rateLimitResult.allowed) {
            eventQueue_1.eventQueue.enqueue({
                event_id: (0, uuid_1.v4)(),
                correlation_id: correlationId,
                event_type: 'rate_limit_exceeded',
                timestamp: new Date().toISOString(),
                gateway_id: gatewayId,
                tenant_id: virtualKey.tenant_id,
                app_id: virtualKey.app_id,
                payload: {
                    profile_id: rateLimitProfile.profile_id,
                    current_count: rateLimitResult.currentCount,
                    max_requests: rateLimitProfile.max_requests,
                    window_seconds: rateLimitProfile.window_seconds,
                },
            });
            res.status(429).json({
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Rate limit exceeded',
                    retry_after_seconds: rateLimitResult.retryAfter,
                },
            });
            return;
        }
    }
    // Check quota (token budget)
    const quotaProfile = configManager_1.configManager.getQuotaProfile(virtualKey.quota_profile_id);
    if (quotaProfile) {
        const quotaResult = checkQuota(virtualKey.key_id, quotaProfile);
        if (!quotaResult.allowed) {
            eventQueue_1.eventQueue.enqueue({
                event_id: (0, uuid_1.v4)(),
                correlation_id: correlationId,
                event_type: 'quota_exceeded',
                timestamp: new Date().toISOString(),
                gateway_id: gatewayId,
                tenant_id: virtualKey.tenant_id,
                app_id: virtualKey.app_id,
                payload: {
                    profile_id: quotaProfile.profile_id,
                    current_tokens: quotaResult.currentTokens,
                    max_tokens: quotaProfile.max_total_tokens,
                    window_seconds: quotaProfile.window_seconds,
                },
            });
            res.status(429).json({
                error: {
                    code: 'QUOTA_EXCEEDED',
                    message: 'Token quota exceeded',
                    current_tokens: quotaResult.currentTokens,
                    max_tokens: quotaProfile.max_total_tokens,
                },
            });
            return;
        }
    }
    // Build request context
    const context = {
        correlation_id: correlationId,
        tenant_id: virtualKey.tenant_id,
        app_id: virtualKey.app_id,
        virtual_key: virtualKey,
        rate_limit_profile: rateLimitProfile || null,
        quota_profile: configManager_1.configManager.getQuotaProfile(virtualKey.quota_profile_id) || null,
        start_time: Date.now(),
    };
    // Attach context to request
    req.context = context;
    // Add correlation ID to response headers
    res.setHeader('X-Correlation-ID', correlationId);
    next();
}
/**
 * Check rate limit for a key
 */
function checkRateLimit(keyId, profile) {
    const now = Date.now();
    const windowMs = profile.window_seconds * 1000;
    // Evict old entries if needed
    evictOldestEntries(rateLimitState, MAX_RATE_LIMIT_ENTRIES);
    let state = rateLimitState.get(keyId);
    // If no state or window expired, start fresh
    if (!state || now - state.windowStart >= windowMs) {
        state = { count: 1, windowStart: now };
        rateLimitState.set(keyId, state);
        return { allowed: true, currentCount: 1 };
    }
    // Check if limit exceeded
    if (state.count >= profile.max_requests) {
        const retryAfter = Math.ceil((state.windowStart + windowMs - now) / 1000);
        return { allowed: false, currentCount: state.count, retryAfter };
    }
    // Increment count
    state.count++;
    return { allowed: true, currentCount: state.count };
}
/**
 * Update quota usage after a request
 * Called from llm.routes.ts after successful completion
 */
function updateQuotaUsage(keyId, tokens, windowSeconds) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    // Evict old entries if needed
    evictOldestEntries(quotaState, MAX_QUOTA_ENTRIES);
    let state = quotaState.get(keyId);
    // If no state or window expired, start fresh
    if (!state || now - state.windowStart >= windowMs) {
        state = { tokens, windowStart: now };
        quotaState.set(keyId, state);
        return true;
    }
    // Add tokens
    state.tokens += tokens;
    return true;
}
/**
 * Check if quota would be exceeded
 */
function checkQuota(keyId, profile) {
    const now = Date.now();
    const windowMs = profile.window_seconds * 1000;
    const state = quotaState.get(keyId);
    // If no state or window expired, full quota available
    if (!state || now - state.windowStart >= windowMs) {
        return {
            allowed: true,
            currentTokens: 0,
            remaining: profile.max_total_tokens,
        };
    }
    const remaining = profile.max_total_tokens - state.tokens;
    return {
        allowed: remaining > 0,
        currentTokens: state.tokens,
        remaining: Math.max(0, remaining),
    };
}
/**
 * Log authentication failure
 */
function logAuthFailure(correlationId, gatewayId, reason) {
    eventQueue_1.eventQueue.enqueue({
        event_id: (0, uuid_1.v4)(),
        correlation_id: correlationId,
        event_type: 'auth_failed',
        timestamp: new Date().toISOString(),
        gateway_id: gatewayId,
        tenant_id: 'unknown',
        app_id: 'unknown',
        payload: {
            reason,
        },
    });
}
//# sourceMappingURL=auth.middleware.js.map