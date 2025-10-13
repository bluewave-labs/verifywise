import { RequestParams } from "../../domain/interfaces/iRequestParams";
import { apiServices } from "../../infrastructure/api/networkServices";

export async function createApiToken({
  routeUrl,
  body,
}: RequestParams): Promise<any> {
  try {
    const response = await apiServices.post(routeUrl, body);
    return response;
  } catch (error) {
    console.error("Error creating API token:", error);
    throw error;
  }
}

export async function getApiTokens({
  routeUrl,
}: RequestParams): Promise<any> {
  try {
    const response = await apiServices.get(routeUrl);
    return response;
  } catch (error) {
    console.error("Error fetching API tokens:", error);
    throw error;
  }
}

export async function deleteApiToken({
  routeUrl,
}: RequestParams): Promise<any> {
  try {
    const response = await apiServices.delete(routeUrl);
    return response;
  } catch (error) {
    console.error("Error deleting API token:", error);
    throw error;
  }
}
