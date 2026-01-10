import { GetRequestParams, RequestParams } from "../../domain/interfaces/i.requestParams";
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

/**
 * Check SSO status for a specific organization (public endpoint for login).
 *
 * @param {number} organizationId - The ID of the organization.
 * @param {string} provider - The SSO provider (e.g., 'AzureAD').
 * @returns {Promise<any>} A promise that resolves to SSO status data.
 * @throws Will throw an error if the operation fails.
 */
export async function CheckSsoStatusByOrgId({
  organizationId,
  provider = 'AzureAD',
}: {
  organizationId: number;
  provider?: string;
}): Promise<any> {
  try {
    const response = await apiServices.get(
      `ssoConfig/check-status?organizationId=${organizationId}&provider=${provider}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}
