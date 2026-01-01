import { RequestParams } from "../../domain/interfaces/i.requestParams";
import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * API token structure
 */
interface ApiToken {
  id: number;
  name: string;
  token?: string;
  created_at: string;
  expires_at?: string;
  [key: string]: unknown;
}

export async function createApiToken({
  routeUrl,
  body,
}: RequestParams): Promise<ApiResponse<BackendResponse<ApiToken>>> {
  const response = await apiServices.post<BackendResponse<ApiToken>>(routeUrl, body);
  return response;
}

export async function getApiTokens({
  routeUrl,
}: RequestParams): Promise<ApiResponse<BackendResponse<ApiToken[]>>> {
  const response = await apiServices.get<BackendResponse<ApiToken[]>>(routeUrl);
  return response;
}

export async function deleteApiToken({
  routeUrl,
}: RequestParams): Promise<ApiResponse<BackendResponse<null>>> {
  const response = await apiServices.delete<BackendResponse<null>>(routeUrl);
  return response;
}
