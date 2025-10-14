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
    throw error;
  }
}
