import { GetRequestParams } from "../../domain/interfaces/i.requestParams";
import { apiServices } from "../../infrastructure/api/networkServices";

export async function GetSubClausesById({
  routeUrl,
  signal,
  responseType = "json",
}: GetRequestParams): Promise<any> {
  const response = await apiServices.get(routeUrl, {
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
}): Promise<any> {
  try {
    const response = await apiServices.patch(routeUrl, body, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...headers,
      },
    });
    return response;
  } catch (error) {
    console.error("Error updating subclause by ID:", error);
    throw error;
  }
}

export async function ISO27001GetSubClauseByClauseId({
  routeUrl, // Example: /api/iso27001/subClauses/byClauseId/1
  signal,
  responseType = "json",
}: GetRequestParams): Promise<any> {
  const response = await apiServices.get(routeUrl, {
    signal,
    responseType,
  });
  return response.data;
}

export async function ISO27001GetSubClauseById({
  routeUrl,
  signal,
  responseType = "json",
}: GetRequestParams): Promise<any> {
  try {
    const response = await apiServices.get(routeUrl, {
      signal,
      responseType,
    });
    return response.data;
  } catch (error) {
    console.error("Error getting subclause by ID:", error);
    throw error;
  }
}
