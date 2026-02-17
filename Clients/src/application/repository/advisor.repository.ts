import { apiServices } from "../../infrastructure/api/networkServices";
import { ApiResponse } from "../../domain/types/User";
import { ENV_VARs } from "../../../env.vars";
import { store } from "../redux/store";

/**
 * Message structure for advisor conversations
 */
export interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  chartData?: unknown;
}

/**
 * Response structure for conversation endpoints
 */
export interface ConversationResponse {
  domain: string;
  messages: AdvisorMessage[];
}

export const runAdvisorAPI = async (
  data: { prompt: string },
  llmKeyId?: number
): Promise<ApiResponse<{ response: string | { markdown?: string; chartData?: unknown } }>> => {
  try {
    let url = `/advisor`;
    if (llmKeyId !== undefined) {
      url += `?llmKeyId=${llmKeyId}`;
    }
    const response = await apiServices.post(url, data);
    return response as ApiResponse<{ response: string | { markdown?: string; chartData?: unknown } }>;
  } catch (error: unknown) {
    // Re-throw the error with the response data intact
    const axiosError = error as { response?: { status: number; data: unknown } };
    if (axiosError.response) {
      throw {
        ...axiosError,
        status: axiosError.response.status,
        data: axiosError.response.data,
      };
    }
    throw error;
  }
}

/**
 * SSE event from the streaming advisor endpoint
 */
export interface AdvisorStreamEvent {
  type: 'text' | 'done' | 'error';
  content: string;
}

/**
 * Stream advisor response via SSE. Returns an AsyncGenerator that yields text chunks.
 */
export async function* streamAdvisorAPI(
  data: { prompt: string },
  llmKeyId?: number,
  abortSignal?: AbortSignal
): AsyncGenerator<AdvisorStreamEvent, void> {
  let url = `${ENV_VARs.URL}/api/advisor/stream`;
  if (llmKeyId !== undefined) {
    url += `?llmKeyId=${llmKeyId}`;
  }

  const token = store.getState().auth?.authToken;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
    signal: abortSignal,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Streaming request failed with status ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No readable stream available');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from the buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const event = JSON.parse(trimmed.slice(6)) as AdvisorStreamEvent;
            yield event;
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim().startsWith('data: ')) {
      try {
        const event = JSON.parse(buffer.trim().slice(6)) as AdvisorStreamEvent;
        yield event;
      } catch {
        // Skip
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Get conversation history for a specific domain
 */
export const getConversationAPI = async (
  domain: string
): Promise<ApiResponse<ConversationResponse>> => {
  try {
    const response = await apiServices.get(`/advisor/conversations/${domain}`);
    return response as ApiResponse<ConversationResponse>;
  } catch (error: unknown) {
    const axiosError = error as { response?: { status: number; data: unknown } };
    if (axiosError.response) {
      throw {
        ...axiosError,
        status: axiosError.response.status,
        data: axiosError.response.data,
      };
    }
    throw error;
  }
};

/**
 * Save conversation messages for a specific domain
 */
export const saveConversationAPI = async (
  domain: string,
  messages: AdvisorMessage[]
): Promise<ApiResponse<ConversationResponse>> => {
  try {
    const response = await apiServices.post(`/advisor/conversations/${domain}`, {
      messages,
    });
    return response as ApiResponse<ConversationResponse>;
  } catch (error: unknown) {
    const axiosError = error as { response?: { status: number; data: unknown } };
    if (axiosError.response) {
      throw {
        ...axiosError,
        status: axiosError.response.status,
        data: axiosError.response.data,
      };
    }
    throw error;
  }
};