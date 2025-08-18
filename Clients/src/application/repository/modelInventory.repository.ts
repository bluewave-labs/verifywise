import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

/**
 * Creates a new model inventory entry in the database.
 *
 * @param {string} routeUrl - The API route URL.
 * @param {any} data - The model inventory data to be saved.
 * @param {string} [authToken=getAuthToken()] - Optional auth token.
 * @returns {Promise<any>} The response from the API.
 */
export async function createModelInventory(
  routeUrl: string,
  data: any,
  authToken = getAuthToken()
): Promise<any> {
  try {
    const response = await apiServices.post(routeUrl, data, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating model inventory:", error);
    throw error;
  }
}
