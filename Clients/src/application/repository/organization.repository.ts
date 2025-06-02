import { GetRequestParams } from "../../domain/interfaces/iRequestParams";
import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/getAuthToken";

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
    console.log("response", response);
    return response.data;
  } catch (error) {
    console.error("Error getting organization details:", error);
    throw error;
  }
}
