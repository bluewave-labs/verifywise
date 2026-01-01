import { GetRequestParams } from "../../domain/interfaces/i.requestParams";
import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Annex Category structure
 */
interface AnnexCategory {
  id: number;
  title: string;
  description?: string;
  order_id?: number;
  annex_id?: number;
  [key: string]: unknown;
}

export async function GetAnnexCategoriesById({
  routeUrl,
  signal,
  responseType = "json",
}: GetRequestParams): Promise<BackendResponse<AnnexCategory>> {
  try {
    const response = await apiServices.get<BackendResponse<AnnexCategory>>(routeUrl, {
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
  headers = {},
}: {
  routeUrl: string;
  body: FormData;
  headers?: Record<string, string>;
}): Promise<ApiResponse<BackendResponse<AnnexCategory>>> {
  try {
    const response = await apiServices.patch<BackendResponse<AnnexCategory>>(routeUrl, body, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...headers,
      },
    });
    return response;
  } catch (error: unknown) {
    console.error("Error updating annex category by ID:", error);
    const axiosError = error as { response?: unknown; request?: unknown };
    if (axiosError.response) {
      // Handle specific HTTP error responses
      throw error;
    } else if (axiosError.request) {
      // Handle network errors
      console.error("Network error - no response received");
      throw new Error("Network error - unable to reach the server");
    } else {
      // Handle other errors
      throw error;
    }
  }
}
