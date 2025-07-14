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

/**
 * Uploads the AI Trust Center logo.
 *
 * @param {File} logoFile - The logo file to upload.
 * @param {string} [authToken=getAuthToken()] - Optional auth token.
 * @returns {Promise<any>} The response from the API.
 */
export async function uploadAITrustCentreLogo(
  logoFile: File,
  authToken = getAuthToken()
): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('logo', logoFile);

    const response = await apiServices.post("/aiTrustCentre/logo", formData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "multipart/form-data"
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading AI Trust Center logo:", error);
    throw error;
  }
}