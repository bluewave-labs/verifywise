"use strict";
/**
 * Token pricing for LLM models
 * Prices in USD cents per 1000 tokens (millicents per token)
 * Source: Provider pricing pages as of December 2024
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCostCents = calculateCostCents;
exports.getModelPricing = getModelPricing;
// Pricing in cents per 1000 tokens
const MODEL_PRICING = {
    // OpenAI models
    'gpt-4o': { input: 0.25, output: 1.0 },
    'gpt-4o-mini': { input: 0.015, output: 0.06 },
    'gpt-4-turbo': { input: 1.0, output: 3.0 },
    'gpt-4-turbo-preview': { input: 1.0, output: 3.0 },
    'gpt-4': { input: 3.0, output: 6.0 },
    'gpt-4-32k': { input: 6.0, output: 12.0 },
    'gpt-3.5-turbo': { input: 0.05, output: 0.15 },
    'gpt-3.5-turbo-16k': { input: 0.3, output: 0.4 },
    // Anthropic models
    'claude-3-opus-20240229': { input: 1.5, output: 7.5 },
    'claude-3-sonnet-20240229': { input: 0.3, output: 1.5 },
    'claude-3-haiku-20240307': { input: 0.025, output: 0.125 },
    'claude-3-5-sonnet-20240620': { input: 0.3, output: 1.5 },
    'claude-3-5-sonnet-20241022': { input: 0.3, output: 1.5 },
    'claude-3-5-haiku-20241022': { input: 0.08, output: 0.4 },
    // Google models
    'gemini-1.5-pro': { input: 0.125, output: 0.5 },
    'gemini-1.5-flash': { input: 0.0075, output: 0.03 },
    'gemini-pro': { input: 0.05, output: 0.15 },
    // Default fallback for unknown models
    'default': { input: 0.1, output: 0.3 },
};
/**
 * Calculate estimated cost in cents for a request
 * @param model The model name/ID
 * @param promptTokens Number of input tokens
 * @param completionTokens Number of output tokens
 * @returns Estimated cost in USD cents (with 4 decimal precision)
 */
function calculateCostCents(model, promptTokens = 0, completionTokens = 0) {
    // Find pricing - try exact match first, then prefix match
    let pricing = MODEL_PRICING[model];
    if (!pricing) {
        // Try prefix matching for versioned models
        const modelLower = model.toLowerCase();
        for (const [key, value] of Object.entries(MODEL_PRICING)) {
            if (modelLower.startsWith(key.toLowerCase())) {
                pricing = value;
                break;
            }
        }
    }
    // Use default if no match found
    if (!pricing) {
        pricing = MODEL_PRICING['default'];
    }
    // Calculate cost: (tokens / 1000) * (cents per 1000 tokens)
    const inputCost = (promptTokens / 1000) * pricing.input;
    const outputCost = (completionTokens / 1000) * pricing.output;
    // Return with 4 decimal precision
    return Math.round((inputCost + outputCost) * 10000) / 10000;
}
/**
 * Get pricing info for a model (for display purposes)
 */
function getModelPricing(model) {
    return MODEL_PRICING[model] || null;
}
//# sourceMappingURL=pricing.js.map