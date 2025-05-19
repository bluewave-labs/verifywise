import { GetRequestParams } from "../../domain/interfaces/iRequestParams";
import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/getAuthToken";

export async function GetSubClausesById({
  routeUrl,
  signal,
  authToken = getAuthToken(),
  responseType = "json",
}: GetRequestParams): Promise<any> {
  const response = await apiServices.get(routeUrl, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return response.data;
}

// Update subclause by ID (with file upload)
export async function UpdateSubClauseById({
  routeUrl,
  body,
  authToken = getAuthToken(),
  headers = {},
}: {
  routeUrl: string;
  body: FormData;
  authToken?: string;
  headers?: Record<string, string>;
}): Promise<any> {
  try {
    const response = await apiServices.patch(routeUrl, body, {
      headers: {
        Authorization: `Bearer ${authToken}`,
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
