import { GetRequestParams } from "../../domain/interfaces/iRequestParams";
import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/getAuthToken";
import { RequestParams } from "../../domain/interfaces/iRequestParams";

/**
 * Retrieves the current user's organization details.
 *
 * @param {GetRequestParams} params - The parameters for the request.
 * @returns {Promise<any>} The organization data retrieved from the API.
 * @throws Will throw an error if the request fails.
 */
export async function GetMyOrganization({
  routeUrl = "/organizations",
  signal,
  authToken = getAuthToken(),
  responseType = "json",
}: GetRequestParams): Promise<any> {
  try {
    const response = await apiServices.get(routeUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
      responseType,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Creates a new organization for the current user.
 *
 * @param {RequestParams} params - The parameters for creating a new organization.
 * @returns {Promise<any>} A promise that resolves to the response data of the created organization.
 * @throws Will throw an error if the organization creation fails.
 */
export async function CreateMyOrganization({
  routeUrl = "/organizations",
  body,
  authToken = getAuthToken(),
}: RequestParams): Promise<any> {
  try {
    const response = await apiServices.post(routeUrl, body, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Updates the current user's organization details.
 *
 * @param {RequestParams} params - The parameters for updating the organization.
 * @returns {Promise<any>} A promise that resolves to the updated organization data.
 * @throws Will throw an error if the update operation fails.
 */
export async function UpdateMyOrganization({
  routeUrl = "/organizations",
  body,
  authToken = getAuthToken(),
  headers,
}: RequestParams): Promise<any> {
  try {
    const response = await apiServices.patch(routeUrl, body, {
      headers: { Authorization: `Bearer ${authToken}`, ...headers },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
