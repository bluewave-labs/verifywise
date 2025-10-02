import { GetRequestParams, RequestParams } from "../../domain/interfaces/iRequestParams";
import { apiServices } from "../../infrastructure/api/networkServices";

/**
 * Retrieves SSO configuration for an organization.
 *
 * @param {GetRequestParams} params - The parameters for the request.
 * @returns {Promise<any>} The SSO configuration data retrieved from the API.
 * @throws Will throw an error if the request fails.
 */
export async function GetSsoConfig({
  routeUrl,
  signal,
  responseType = "json",
}: GetRequestParams): Promise<any> {
  try {
    const response = await apiServices.get(routeUrl, {
      signal,
      responseType,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Updates SSO configuration for an organization.
 *
 * @param {RequestParams} params - The parameters for updating the SSO configuration.
 * @returns {Promise<any>} A promise that resolves to the updated SSO configuration data.
 * @throws Will throw an error if the update operation fails.
 */
export async function UpdateSsoConfig({
  routeUrl,
  body,
}: RequestParams): Promise<any> {
  try {
    const response = await apiServices.put(routeUrl, body);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Enables or disables SSO for an organization.
 *
 * @param {RequestParams} params - The parameters for enabling/disabling SSO.
 * @returns {Promise<any>} A promise that resolves to the response data.
 * @throws Will throw an error if the operation fails.
 */
export async function ToggleSsoStatus({
  routeUrl,
  body,
}: RequestParams): Promise<any> {
  try {
    const response = await apiServices.put(routeUrl, body);
    return response.data;
  } catch (error) {
    throw error;
  }
}
