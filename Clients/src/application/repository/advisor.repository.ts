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

export const runAdvisorAPI = async (
  data: any,
  llmKeyId?: number
): Promise<ApiResponse<any>> => {
  try {
    let url = `/advisor`;
    if (llmKeyId !== undefined) {
      url += `?llmKeyId=${llmKeyId}`;
    }
    const response = await apiServices.post(url, data);
    return response;
  } catch (error: any) {
    // Re-throw the error with the response data intact
    if (error.response) {
      throw {
        ...error,
        status: error.response.status,
        data: error.response.data,
      };
    }
    throw error;
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
    return response;
  } catch (error: any) {
    if (error.response) {
      throw {
        ...error,
        status: error.response.status,
        data: error.response.data,
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
    return response;
  } catch (error: any) {
    if (error.response) {
      throw {
        ...error,
        status: error.response.status,
        data: error.response.data,
      };
    }
    throw error;
  }
};