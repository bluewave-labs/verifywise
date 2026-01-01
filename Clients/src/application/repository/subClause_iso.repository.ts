import { GetRequestParams } from "../../domain/interfaces/i.requestParams";
import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * SubClause structure
 */
interface SubClause {
  id: number;
  clause_id: number;
  title?: string;
  description?: string;
  content?: string;
  order?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export async function GetSubClausesById({
  routeUrl,
  signal,
  responseType = "json",
}: GetRequestParams): Promise<BackendResponse<SubClause[]>> {
  const response = await apiServices.get<BackendResponse<SubClause[]>>(routeUrl, {
    signal,
    responseType,
  });
  return response.data;
}

// Update subclause by ID (with file upload)
export async function UpdateSubClauseById({
  routeUrl,
  body,
  headers = {},
}: {
  routeUrl: string;
  body: FormData;
  headers?: Record<string, string>;
}): Promise<ApiResponse<BackendResponse<SubClause>>> {
  try {
    const response = await apiServices.patch<BackendResponse<SubClause>>(routeUrl, body, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...headers,
      },
    });
    return response;
  } catch (error: unknown) {
    console.error("Error updating subclause by ID:", error);
    throw error;
  }
}

export async function ISO27001GetSubClauseByClauseId({
  routeUrl, // Example: /api/iso27001/subClauses/byClauseId/1
  signal,
  responseType = "json",
}: GetRequestParams): Promise<BackendResponse<SubClause[]>> {
  const response = await apiServices.get<BackendResponse<SubClause[]>>(routeUrl, {
    signal,
    responseType,
  });
  return response.data;
}

export async function ISO27001GetSubClauseById({
  routeUrl,
  signal,
  responseType = "json",
}: GetRequestParams): Promise<BackendResponse<SubClause>> {
  try {
    const response = await apiServices.get<BackendResponse<SubClause>>(routeUrl, {
      signal,
      responseType,
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error getting subclause by ID:", error);
    throw error;
  }
}
