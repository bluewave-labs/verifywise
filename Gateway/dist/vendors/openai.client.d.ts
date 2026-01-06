/**
 * OpenAI Vendor Client - Handles requests to OpenAI-compatible APIs
 * Based on spec: docs/SPEC.md Section 5, 6
 */
import { Provider } from '../types/config.types';
interface ChatMessage {
    role: string;
    content: string;
}
interface ChatRequest {
    provider: Provider;
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    timeout_ms?: number;
}
interface ChatResponse {
    id: string;
    provider_id: string;
    model: string;
    created: number;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    finish_reason?: string;
}
export declare class OpenAIClient {
    /**
     * Send chat completion request to OpenAI-compatible provider
     */
    chat(request: ChatRequest): Promise<ChatResponse>;
    /**
     * Build request URL, headers, and body based on provider type
     */
    private buildRequest;
    /**
     * Convert messages to Anthropic format
     */
    private convertToAnthropicFormat;
    /**
     * Parse response based on provider type
     */
    private parseResponse;
    /**
     * Handle errors from provider
     */
    private handleError;
}
export declare const openaiClient: OpenAIClient;
export {};
//# sourceMappingURL=openai.client.d.ts.map