import { GetRequestParams } from "../../domain/interfaces/iRequestParams";
import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/getAuthToken";

export async function GetAnnexCategoriesById({
  routeUrl,
  signal,
  authToken = getAuthToken(),
  responseType = "json",
}: GetRequestParams) {
  try {
    const response = await apiServices.get(routeUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
      responseType,
    });
    return response.data;
  } catch (error) {
    console.error("Error getting annex categories by ID:", error);
    throw error;
  }
}

// Update annex category by ID (with file upload)
export async function UpdateAnnexCategoryById({
  routeUrl,
  body,
  authToken = getAuthToken(),
  headers = {},
}: {
  routeUrl: string;
  body: FormData;
  authToken?: string;
  headers?: Record<string, string>;
}) {
  try {
    const response = await apiServices.patch(routeUrl, body, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "multipart/form-data",
        ...headers,
      },
    });
    return response;
  } catch (error: any) {
    console.error("Error updating annex category by ID:", error);
    if (error instanceof Error && "response" in error && error.response) {
      // Handle specific HTTP error responses
      throw error;
    } else if (error instanceof Error && "request" in error) {
      // Handle network errors
      console.error("Network error - no response received");
      throw new Error("Network error - unable to reach the server");
    } else {
      // Handle other errors
      throw error;
    }
  }
}
