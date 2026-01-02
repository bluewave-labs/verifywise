import { GetRequestParams } from "../../domain/interfaces/i.requestParams";
import { apiServices } from "../../infrastructure/api/networkServices";
import { RequestParams } from "../../domain/interfaces/i.requestParams";

/**
 * Organization structure
 */
export interface Organization {
  id: number;
  name: string;
  logo?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Organization exists response
 */
interface OrganizationExistsResponse {
  exists: boolean;
}

/**
 * Backend response wrapper for type-safe API calls
 */
interface BackendResponse<T> {
  message: string;
  data: T;
}

/**
 * Retrieves the current user's organization details.
 *
 * @param {GetRequestParams} params - The parameters for the request.
 * @returns {Promise<Organization>} The organization data retrieved from the API.
 * @throws Will throw an error if the request fails.
 */
export async function GetMyOrganization({
  routeUrl,
  signal,
  responseType = "json",
}: GetRequestParams): Promise<Organization> {
  try {
    const response = await apiServices.get<BackendResponse<Organization>>(routeUrl, {
      signal,
      responseType,
    });
    return response.data.data;
  } catch (error: unknown) {
    throw error;
  }
}

/**
 * Creates a new organization for the current user.
 *
 * @param {RequestParams} params - The parameters for creating a new organization.
 * @returns {Promise<Organization>} A promise that resolves to the created organization.
 * @throws Will throw an error if the organization creation fails.
 */
export async function CreateMyOrganization({
  routeUrl = "/organizations",
  body,
}: RequestParams): Promise<Organization> {
  try {
    const response = await apiServices.post<BackendResponse<Organization>>(routeUrl, body);
    return response.data.data;
  } catch (error: unknown) {
    throw error;
  }
}

/**
 * Updates the current user's organization details.
 *
 * @param {RequestParams} params - The parameters for updating the organization.
 * @returns {Promise<Organization>} A promise that resolves to the updated organization data.
 * @throws Will throw an error if the update operation fails.
 */
export async function UpdateMyOrganization({
  routeUrl = "/organizations",
  body,
  headers,
}: RequestParams): Promise<Organization> {
  try {
    const response = await apiServices.patch<BackendResponse<Organization>>(routeUrl, body, {
      headers: { ...headers },
    });
    return response.data.data;
  } catch (error: unknown) {
    throw error;
  }
}

/**
 * Checks if any organization exists in the system.
 *
 * @returns {Promise<boolean>} True if at least one organization exists.
 * @throws Will throw an error if the request fails.
 */
export async function checkOrganizationExists(): Promise<boolean> {
  try {
    const response = await apiServices.get<BackendResponse<OrganizationExistsResponse>>("/organizations/exists");
    return response.data?.data?.exists ?? false;
  } catch (error: unknown) {
    throw error;
  }
}
