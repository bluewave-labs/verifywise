import { apiServices } from "../../infrastructure/api/networkServices";
import { ApiResponse } from "../../domain/types/User";

export const runAdvisorAPI = async (
  data: any,
  type: string,
  llmKeyId?: number
): Promise<ApiResponse<any>> => {
  try {
    let url = `/advisor?type=${type}`;
    if (llmKeyId !== undefined) {
      url += `&llmKeyId=${llmKeyId}`;
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