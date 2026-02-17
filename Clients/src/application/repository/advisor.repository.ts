import { apiServices } from "../../infrastructure/api/networkServices";
import { ApiResponse } from "../../domain/types/User";

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
