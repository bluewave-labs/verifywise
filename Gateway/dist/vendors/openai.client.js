"use strict";
/**
 * OpenAI Vendor Client - Handles requests to OpenAI-compatible APIs
 * Based on spec: docs/SPEC.md Section 5, 6
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiClient = exports.OpenAIClient = void 0;
const axios_1 = __importDefault(require("axios"));
class OpenAIClient {
    /**
     * Send chat completion request to OpenAI-compatible provider
     */
    async chat(request) {
        const { provider, model, messages, temperature, max_tokens, timeout_ms } = request;
        // Build request based on provider type
        const { url, headers, body } = this.buildRequest(provider, model, messages, temperature, max_tokens);
        try {
            const response = await axios_1.default.post(url, body, {
                headers,
                timeout: timeout_ms || 10000, // Default 10s timeout
            });
            return this.parseResponse(provider, response.data);
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    /**
     * Build request URL, headers, and body based on provider type
     */
    buildRequest(provider, model, messages, temperature, max_tokens) {
        switch (provider.type) {
            case 'openai':
                return {
                    url: `${provider.base_url}/chat/completions`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${provider.api_key}`,
                    },
                    body: {
                        model,
                        messages,
                        temperature,
                        max_tokens,
                    },
                };
            case 'azure_openai':
                return {
                    url: `${provider.base_url}/openai/deployments/${provider.deployment_name}/chat/completions?api-version=${provider.api_version}`,
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': provider.api_key,
                    },
                    body: {
                        messages,
                        temperature,
                        max_tokens,
                    },
                };
            case 'anthropic': {
                // Extract system message for Anthropic's separate system parameter
                const systemMessage = messages.find(m => m.role === 'system');
                const anthropicMessages = this.convertToAnthropicFormat(messages);
                const body = {
                    model,
                    messages: anthropicMessages,
                    max_tokens: max_tokens || 4096,
                };
                // Add system message if present
                if (systemMessage) {
                    body.system = systemMessage.content;
                }
                // Only add temperature if defined
                if (temperature !== undefined) {
                    body.temperature = temperature;
                }
                return {
                    url: `${provider.base_url}/messages`,
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': provider.api_key,
                        'anthropic-version': provider.version || '2023-06-01',
                    },
                    body,
                };
            }
            case 'custom_http':
                return {
                    url: provider.base_url,
                    headers: {
                        'Content-Type': 'application/json',
                        ...(provider.auth_header && provider.auth_value
                            ? { [provider.auth_header]: provider.auth_value }
                            : {}),
                    },
                    body: {
                        model,
                        messages,
                        temperature,
                        max_tokens,
                    },
                };
            default:
                throw new Error(`Unsupported provider type: ${provider.type}`);
        }
    }
    /**
     * Convert messages to Anthropic format
     */
    convertToAnthropicFormat(messages) {
        // Anthropic doesn't use 'system' role in messages array
        // System message should be extracted and passed separately
        return messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
        }));
    }
    /**
     * Parse response based on provider type
     */
    parseResponse(provider, data) {
        switch (provider.type) {
            case 'openai':
            case 'azure_openai':
            case 'custom_http':
                return {
                    id: data.id,
                    provider_id: provider.provider_id,
                    model: data.model,
                    created: data.created,
                    choices: data.choices,
                    usage: data.usage,
                    finish_reason: data.choices?.[0]?.finish_reason,
                };
            case 'anthropic':
                return {
                    id: data.id,
                    provider_id: provider.provider_id,
                    model: data.model,
                    created: Math.floor(Date.now() / 1000),
                    choices: [
                        {
                            index: 0,
                            message: {
                                role: 'assistant',
                                content: data.content?.[0]?.text || '',
                            },
                            finish_reason: data.stop_reason || 'stop',
                        },
                    ],
                    usage: {
                        prompt_tokens: data.usage?.input_tokens || 0,
                        completion_tokens: data.usage?.output_tokens || 0,
                        total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
                    },
                    finish_reason: data.stop_reason,
                };
            default:
                throw new Error(`Unsupported provider type: ${provider.type}`);
        }
    }
    /**
     * Handle errors from provider
     */
    handleError(error) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            // Rate limit
            if (status === 429) {
                const err = new Error('Provider rate limit exceeded');
                err.code = 'RATE_LIMIT';
                err.retryable = true;
                return err;
            }
            // Authentication error
            if (status === 401) {
                const err = new Error('Provider authentication failed');
                err.code = 'AUTH_ERROR';
                err.retryable = false;
                return err;
            }
            // Server error (retryable)
            if (status >= 500) {
                const err = new Error(`Provider server error: ${status}`);
                err.code = 'SERVER_ERROR';
                err.retryable = true;
                return err;
            }
            // Other errors
            const err = new Error(data?.error?.message || `Provider error: ${status}`);
            err.code = 'PROVIDER_ERROR';
            err.status = status;
            return err;
        }
        // Timeout
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            const err = new Error('Provider request timeout');
            err.code = 'TIMEOUT';
            err.retryable = true;
            return err;
        }
        // Network error
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            const err = new Error('Provider connection failed');
            err.code = 'CONNECTION_ERROR';
            err.retryable = true;
            return err;
        }
        return error;
    }
}
exports.OpenAIClient = OpenAIClient;
// Singleton instance
exports.openaiClient = new OpenAIClient();
//# sourceMappingURL=openai.client.js.map