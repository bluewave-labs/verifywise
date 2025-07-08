import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/getAuthToken";

/**
 * Fetches the AI Trust Center overview data.
 *
 * @param {string} [authToken=getAuthToken()] - Optional auth token.
 * @returns {Promise<any>} The AI Trust Center overview data.
 */
export async function getAITrustCentreOverview(
  authToken = getAuthToken()
): Promise<any> {
  try {
    const response = await apiServices.get("/aiTrustCentre/overview", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching AI Trust Center overview:", error);
    throw error;
  }
}

/**
 * Creates a new AI Trust Center overview.
 *
 * @param {any} data - The AI Trust Center overview data to be created.
 * @param {string} [authToken=getAuthToken()] - Optional auth token.
 * @returns {Promise<any>} The response from the API.
 */
export async function createAITrustCentreOverview(
  data: any,
  authToken = getAuthToken()
): Promise<any> {
  try {
    const response = await apiServices.post("/aiTrustCentre/overview", data, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating AI Trust Center overview:", error);
    throw error;
  }
}

/**
 * Updates the AI Trust Center overview.
 *
 * @param {any} data - The AI Trust Center overview data to be updated.
 * @param {string} [authToken=getAuthToken()] - Optional auth token.
 * @returns {Promise<any>} The response from the API.
 */
export async function updateAITrustCentreOverview(
  data: any,
  authToken = getAuthToken()
): Promise<any> {
  try {
    const response = await apiServices.put("/aiTrustCentre/overview", data, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating AI Trust Center overview:", error);
    throw error;
  }
} 