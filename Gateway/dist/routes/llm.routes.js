"use strict";
/**
 * LLM Routes - Chat completions endpoint
 * Based on spec: docs/SPEC.md Sections 3.1, 5, 6
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmRoutes = void 0;
const express_1 = require("express");
const uuid_1 = require("uuid");
const configManager_1 = require("../config/configManager");
const eventQueue_1 = require("../queue/eventQueue");
const openai_client_1 = require("../vendors/openai.client");
const auth_middleware_1 = require("../middleware/auth.middleware");
const guardrailsEngine_1 = require("../guardrails/guardrailsEngine");
const pricing_1 = require("../utils/pricing");
require("../types/express-augment");
exports.llmRoutes = (0, express_1.Router)();
// Request validation limits
const MAX_MESSAGES = 100;
const MAX_MESSAGE_CONTENT_LENGTH = 100000; // 100KB per message
const MAX_METADATA_SIZE = 10000; // 10KB for metadata
/**
 * Validate chat request to prevent abuse
 */
function validateChatRequest(body) {
    // Validate messages array
    if (!body.messages || !Array.isArray(body.messages)) {
        return { valid: false, error: 'messages array is required' };
    }
    if (body.messages.length === 0) {
        return { valid: false, error: 'messages array cannot be empty' };
    }
    if (body.messages.length > MAX_MESSAGES) {
        return { valid: false, error: `messages array cannot exceed ${MAX_MESSAGES} messages` };
    }
    // Validate each message
    for (let i = 0; i < body.messages.length; i++) {
        const msg = body.messages[i];
        if (!msg || typeof msg !== 'object') {
            return { valid: false, error: `messages[${i}] must be an object` };
        }
        if (!msg.role || typeof msg.role !== 'string') {
            return { valid: false, error: `messages[${i}].role must be a string` };
        }
        if (!['system', 'user', 'assistant'].includes(msg.role)) {
            return { valid: false, error: `messages[${i}].role must be 'system', 'user', or 'assistant'` };
        }
        if (typeof msg.content !== 'string') {
            return { valid: false, error: `messages[${i}].content must be a string` };
        }
        if (msg.content.length > MAX_MESSAGE_CONTENT_LENGTH) {
            return { valid: false, error: `messages[${i}].content exceeds maximum length of ${MAX_MESSAGE_CONTENT_LENGTH}` };
        }
    }
    // Validate temperature
    if (body.temperature !== undefined) {
        if (typeof body.temperature !== 'number' || body.temperature < 0 || body.temperature > 2) {
            return { valid: false, error: 'temperature must be a number between 0 and 2' };
        }
    }
    // Validate max_tokens
    if (body.max_tokens !== undefined) {
        if (typeof body.max_tokens !== 'number' || body.max_tokens < 1 || body.max_tokens > 128000) {
            return { valid: false, error: 'max_tokens must be a number between 1 and 128000' };
        }
    }
    // Validate metadata size
    if (body.metadata) {
        const metadataSize = JSON.stringify(body.metadata).length;
        if (metadataSize > MAX_METADATA_SIZE) {
            return { valid: false, error: `metadata exceeds maximum size of ${MAX_METADATA_SIZE} bytes` };
        }
    }
    return { valid: true };
}
/**
 * POST /v1/llm/chat
 * Main chat completions endpoint
 */
exports.llmRoutes.post('/chat', async (req, res) => {
    const context = req.context;
    const correlationId = context.correlation_id;
    const startTime = Date.now();
    try {
        const body = req.body;
        // Validate request
        const validation = validateChatRequest(body);
        if (!validation.valid) {
            res.status(400).json({
                error: {
                    code: 'INVALID_REQUEST',
                    message: validation.error,
                },
            });
            return;
        }
        // Extract user_id from metadata
        const userId = body.metadata?.user_id;
        // Resolve route - check body.route first, then X-Route-ID header
        const routeHint = body.route || req.headers['x-route-id'];
        // Log request received
        eventQueue_1.eventQueue.enqueue({
            event_id: (0, uuid_1.v4)(),
            correlation_id: correlationId,
            event_type: 'request_received',
            timestamp: new Date().toISOString(),
            gateway_id: req.gatewayId,
            tenant_id: context.tenant_id,
            app_id: context.app_id,
            user_id: userId,
            payload: {
                route_hint: routeHint,
                model_hint: body.model,
                metadata: body.metadata,
            },
        });
        const route = resolveRoute(context, routeHint);
        if (!route) {
            eventQueue_1.eventQueue.enqueue({
                event_id: (0, uuid_1.v4)(),
                correlation_id: correlationId,
                event_type: 'request_failed',
                timestamp: new Date().toISOString(),
                gateway_id: req.gatewayId,
                tenant_id: context.tenant_id,
                app_id: context.app_id,
                user_id: userId,
                payload: {
                    error_code: 'NO_ROUTE',
                    message: 'No matching route found',
                },
            });
            res.status(400).json({
                error: {
                    code: 'NO_ROUTE',
                    message: 'No matching route found for this request',
                },
            });
            return;
        }
        // Check if route is allowed for this virtual key
        if (!context.virtual_key.allowed_routes.includes(route.route_id)) {
            res.status(403).json({
                error: {
                    code: 'ROUTE_NOT_ALLOWED',
                    message: 'This virtual key is not authorized for the requested route',
                },
            });
            return;
        }
        // Get provider
        const provider = configManager_1.configManager.getProvider(route.primary.provider_id);
        if (!provider) {
            res.status(500).json({
                error: {
                    code: 'PROVIDER_NOT_FOUND',
                    message: 'Route provider not configured',
                },
            });
            return;
        }
        // Apply input guardrails
        const tenantGuardrails = configManager_1.configManager.getGuardrails(context.tenant_id);
        const { messages: guardedMessages, result: inputGuardrailResult } = (0, guardrailsEngine_1.applyInputGuardrails)(body.messages, tenantGuardrails);
        // Log input guardrail evaluation if any rules were triggered
        if (inputGuardrailResult.triggered_rules.length > 0) {
            eventQueue_1.eventQueue.enqueue({
                event_id: (0, uuid_1.v4)(),
                correlation_id: correlationId,
                event_type: 'guardrail_evaluated',
                timestamp: new Date().toISOString(),
                gateway_id: req.gatewayId,
                tenant_id: context.tenant_id,
                app_id: context.app_id,
                user_id: userId,
                payload: {
                    type: 'input',
                    applied_rules: tenantGuardrails?.input_rules.map(r => r.rule_id) || [],
                    triggered_rules: inputGuardrailResult.triggered_rules.map(r => r.rule_id),
                    actions_taken: inputGuardrailResult.actions_taken,
                },
            });
        }
        // If input is blocked, return error
        if (!inputGuardrailResult.allowed) {
            const blockedRule = inputGuardrailResult.triggered_rules.find(r => r.action === 'block');
            eventQueue_1.eventQueue.enqueue({
                event_id: (0, uuid_1.v4)(),
                correlation_id: correlationId,
                event_type: 'policy_violation',
                timestamp: new Date().toISOString(),
                gateway_id: req.gatewayId,
                tenant_id: context.tenant_id,
                app_id: context.app_id,
                user_id: userId,
                payload: {
                    violation_type: 'input_guardrail',
                    rule_id: blockedRule?.rule_id,
                    severity: 'high',
                    action_taken: 'blocked',
                },
            });
            res.status(400).json({
                error: {
                    code: 'INPUT_GUARDRAIL_BLOCKED',
                    message: 'Request blocked by input guardrail policy',
                    rule_id: blockedRule?.rule_id,
                },
            });
            return;
        }
        // Log vendor request
        eventQueue_1.eventQueue.enqueue({
            event_id: (0, uuid_1.v4)(),
            correlation_id: correlationId,
            event_type: 'vendor_request_sent',
            timestamp: new Date().toISOString(),
            gateway_id: req.gatewayId,
            tenant_id: context.tenant_id,
            app_id: context.app_id,
            user_id: userId,
            payload: {
                provider: provider.provider_id,
                model: route.primary.model,
                route: route.route_id,
            },
        });
        // Make request to vendor
        const vendorStartTime = Date.now();
        let response;
        let retryCount = 0;
        let lastError = null;
        // Try primary provider with retries (only retry if error is retryable)
        while (retryCount <= route.retry.max_retries) {
            try {
                response = await openai_client_1.openaiClient.chat({
                    provider,
                    model: route.primary.model,
                    messages: guardedMessages, // Use guardrail-processed messages
                    temperature: body.temperature,
                    max_tokens: body.max_tokens,
                    timeout_ms: route.primary.timeout_ms,
                });
                break;
            }
            catch (error) {
                lastError = error;
                // Only retry if error is marked as retryable (e.g., timeout, rate limit, server error)
                // Don't retry auth errors or client errors
                const isRetryable = error.retryable === true;
                if (isRetryable && retryCount < route.retry.max_retries) {
                    retryCount++;
                    eventQueue_1.eventQueue.enqueue({
                        event_id: (0, uuid_1.v4)(),
                        correlation_id: correlationId,
                        event_type: 'vendor_retry_attempt',
                        timestamp: new Date().toISOString(),
                        gateway_id: req.gatewayId,
                        tenant_id: context.tenant_id,
                        app_id: context.app_id,
                        user_id: userId,
                        payload: {
                            provider: provider.provider_id,
                            model: route.primary.model,
                            retry_count: retryCount,
                            reason: error.message,
                        },
                    });
                    // Backoff before retry
                    await new Promise(resolve => setTimeout(resolve, route.retry.backoff_ms * retryCount));
                }
                else {
                    // Not retryable or max retries reached, break out
                    break;
                }
            }
        }
        // If primary failed, try fallbacks
        if (!response && route.fallbacks.length > 0) {
            for (const fallback of route.fallbacks) {
                const fallbackProvider = configManager_1.configManager.getProvider(fallback.provider_id);
                if (!fallbackProvider)
                    continue;
                try {
                    eventQueue_1.eventQueue.enqueue({
                        event_id: (0, uuid_1.v4)(),
                        correlation_id: correlationId,
                        event_type: 'fallback_executed',
                        timestamp: new Date().toISOString(),
                        gateway_id: req.gatewayId,
                        tenant_id: context.tenant_id,
                        app_id: context.app_id,
                        user_id: userId,
                        payload: {
                            from_provider: provider.provider_id,
                            to_provider: fallbackProvider.provider_id,
                            from_model: route.primary.model,
                            to_model: fallback.model,
                            reason: lastError?.message || 'Primary provider failed',
                        },
                    });
                    response = await openai_client_1.openaiClient.chat({
                        provider: fallbackProvider,
                        model: fallback.model,
                        messages: guardedMessages, // Use guardrail-processed messages
                        temperature: body.temperature,
                        max_tokens: body.max_tokens,
                        timeout_ms: fallback.timeout_ms,
                    });
                    break;
                }
                catch (error) {
                    lastError = error;
                }
            }
        }
        if (!response) {
            eventQueue_1.eventQueue.enqueue({
                event_id: (0, uuid_1.v4)(),
                correlation_id: correlationId,
                event_type: 'request_failed',
                timestamp: new Date().toISOString(),
                gateway_id: req.gatewayId,
                tenant_id: context.tenant_id,
                app_id: context.app_id,
                user_id: userId,
                payload: {
                    error_code: 'VENDOR_ERROR',
                    message: lastError?.message || 'All providers failed',
                },
            });
            res.status(502).json({
                error: {
                    code: 'VENDOR_ERROR',
                    message: 'All providers failed to respond',
                },
            });
            return;
        }
        const vendorLatency = Date.now() - vendorStartTime;
        // Log vendor response
        eventQueue_1.eventQueue.enqueue({
            event_id: (0, uuid_1.v4)(),
            correlation_id: correlationId,
            event_type: 'vendor_response_received',
            timestamp: new Date().toISOString(),
            gateway_id: req.gatewayId,
            tenant_id: context.tenant_id,
            app_id: context.app_id,
            user_id: userId,
            payload: {
                provider: response.provider_id,
                model: response.model,
                status_code: 200,
                latency_ms: vendorLatency,
                prompt_tokens: response.usage?.prompt_tokens,
                completion_tokens: response.usage?.completion_tokens,
                total_tokens: response.usage?.total_tokens,
                finish_reason: response.finish_reason,
            },
        });
        // Apply output guardrails
        const outputContent = response.choices?.[0]?.message?.content || '';
        const outputGuardrailResult = (0, guardrailsEngine_1.evaluateOutputGuardrails)(outputContent, tenantGuardrails);
        // Log output guardrail evaluation if any rules were triggered
        if (outputGuardrailResult.triggered_rules.length > 0) {
            eventQueue_1.eventQueue.enqueue({
                event_id: (0, uuid_1.v4)(),
                correlation_id: correlationId,
                event_type: 'guardrail_evaluated',
                timestamp: new Date().toISOString(),
                gateway_id: req.gatewayId,
                tenant_id: context.tenant_id,
                app_id: context.app_id,
                user_id: userId,
                payload: {
                    type: 'output',
                    applied_rules: tenantGuardrails?.output_rules.map(r => r.rule_id) || [],
                    triggered_rules: outputGuardrailResult.triggered_rules.map(r => r.rule_id),
                    actions_taken: outputGuardrailResult.actions_taken,
                },
            });
        }
        // If output is blocked, return error instead of LLM response
        if (!outputGuardrailResult.allowed) {
            const blockedRule = outputGuardrailResult.triggered_rules.find(r => r.action === 'block');
            eventQueue_1.eventQueue.enqueue({
                event_id: (0, uuid_1.v4)(),
                correlation_id: correlationId,
                event_type: 'policy_violation',
                timestamp: new Date().toISOString(),
                gateway_id: req.gatewayId,
                tenant_id: context.tenant_id,
                app_id: context.app_id,
                user_id: userId,
                payload: {
                    violation_type: 'output_guardrail',
                    rule_id: blockedRule?.rule_id,
                    severity: 'high',
                    action_taken: 'blocked',
                },
            });
            res.status(400).json({
                error: {
                    code: 'OUTPUT_GUARDRAIL_BLOCKED',
                    message: 'Response blocked by output guardrail policy',
                    rule_id: blockedRule?.rule_id,
                },
            });
            return;
        }
        // Modify response content if guardrails applied mask/truncate
        if (outputGuardrailResult.modified_content !== outputGuardrailResult.original_content) {
            response.choices[0].message.content = outputGuardrailResult.modified_content || '';
        }
        // Update quota usage if tokens were consumed
        if (response.usage?.total_tokens && context.quota_profile) {
            (0, auth_middleware_1.updateQuotaUsage)(context.virtual_key.key_id, response.usage.total_tokens, context.quota_profile.window_seconds);
        }
        // Log request completed
        const totalLatency = Date.now() - startTime;
        // Calculate estimated cost based on token usage
        const estimatedCostCents = (0, pricing_1.calculateCostCents)(response.model, response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0);
        eventQueue_1.eventQueue.enqueue({
            event_id: (0, uuid_1.v4)(),
            correlation_id: correlationId,
            event_type: 'request_completed',
            timestamp: new Date().toISOString(),
            gateway_id: req.gatewayId,
            tenant_id: context.tenant_id,
            app_id: context.app_id,
            user_id: userId,
            payload: {
                // Core identifiers
                decision: 'allowed',
                route: route.route_id,
                provider: response.provider_id,
                model: response.model,
                // Timestamps
                request_timestamp: new Date(startTime).toISOString(),
                response_timestamp: new Date().toISOString(),
                // Performance
                latency_ms: totalLatency,
                // Token usage
                prompt_tokens: response.usage?.prompt_tokens,
                completion_tokens: response.usage?.completion_tokens,
                total_tokens: response.usage?.total_tokens,
                // Cost
                estimated_cost_cents: estimatedCostCents,
                // Status
                success: true,
                // Retry/Fallback tracking
                retry_count: retryCount,
                fallback_used: response.provider_id !== provider.provider_id,
                original_provider: response.provider_id !== provider.provider_id ? provider.provider_id : undefined,
                // Cache (not yet implemented)
                cache_hit: false,
            },
        });
        // Return response
        res.json({
            id: response.id,
            object: 'chat.completion',
            created: response.created,
            model: response.model,
            choices: response.choices,
            usage: response.usage,
        });
    }
    catch (error) {
        console.error('Chat endpoint error:', error);
        // Note: user_id not available in catch block (may not have parsed body yet)
        eventQueue_1.eventQueue.enqueue({
            event_id: (0, uuid_1.v4)(),
            correlation_id: correlationId,
            event_type: 'internal_error',
            timestamp: new Date().toISOString(),
            gateway_id: req.gatewayId,
            tenant_id: context.tenant_id,
            app_id: context.app_id,
            user_id: req.body?.metadata?.user_id,
            payload: {
                error_code: 'INTERNAL_ERROR',
                message: error.message,
            },
        });
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An internal error occurred',
            },
        });
    }
});
/**
 * Resolve the route to use for the request
 */
function resolveRoute(context, routeHint) {
    // If route hint provided, use it if allowed
    if (routeHint) {
        const route = configManager_1.configManager.getRoute(routeHint);
        if (route && context.virtual_key.allowed_routes.includes(routeHint)) {
            return route;
        }
    }
    // Use default route for tenant/app
    return configManager_1.configManager.getDefaultRoute(context.tenant_id, context.app_id);
}
//# sourceMappingURL=llm.routes.js.map