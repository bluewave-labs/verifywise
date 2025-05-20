import { GetRequestParams } from "../../domain/interfaces/iRequestParams";
import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/getAuthToken";

export async function GetAnnexCategoriesById({
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
    console.error("Error updating annex category by ID:", error);
    throw error;
  }
}
