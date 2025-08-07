import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

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

/**
 * Deletes the AI Trust Center logo.
 *
 * @param {string} [authToken=getAuthToken()] - Optional auth token.
 * @returns {Promise<any>} The response from the API.
 */
export async function deleteAITrustCentreLogo(
  authToken = getAuthToken()
): Promise<any> {
  try {
    const response = await apiServices.delete("/aiTrustCentre/logo", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting AI Trust Center logo:", error);
    throw error;
  }
}

/**
 * Creates a new AI Trust Center resource with file upload.
 *
 * @param {File} file - The file to upload.
 * @param {string} name - The name of the resource.
 * @param {string} description - The description of the resource.
 * @param {boolean} [visible=true] - Whether the resource is visible (defaults to true).
 * @param {string} [authToken=getAuthToken()] - Optional auth token.
 * @returns {Promise<any>} The response from the API.
 */
export async function createAITrustCentreResource(
  file: File,
  name: string,
  description: string,
  visible: boolean = true,
  authToken = getAuthToken()
): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('visible', visible.toString());

    const response = await apiServices.post("/aiTrustCentre/resources", formData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "multipart/form-data"
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating AI Trust Center resource:", error);
    throw error;
  }
}

/**
 * Fetches AI Trust Center resources.
 *
 * @param {string} [authToken=getAuthToken()] - Optional auth token.
 * @returns {Promise<any>} The AI Trust Center resources.
 */
export async function getAITrustCentreResources(
  authToken = getAuthToken()
): Promise<any> {
  try {
    const response = await apiServices.get("/aiTrustCentre/resources", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching AI Trust Center resources:", error);
    throw error;
  }
}

/**
 * Deletes an AI Trust Center resource.
 *
 * @param {number} resourceId - The ID of the resource to delete.
 * @param {string} [authToken=getAuthToken()] - Optional auth token.
 * @returns {Promise<any>} The response from the API.
 */
export async function deleteAITrustCentreResource(
  resourceId: number,
  authToken = getAuthToken()
): Promise<any> {
  try {
    const response = await apiServices.delete(`/aiTrustCentre/resources/${resourceId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting AI Trust Center resource:", error);
    throw error;
  }
}

/**
 * Updates an AI Trust Center resource.
 *
 * @param {number} resourceId - The ID of the resource to update.
 * @param {string} name - The name of the resource.
 * @param {string} description - The description of the resource.
 * @param {boolean} visible - Whether the resource is visible.
 * @param {File} [file] - Optional file to replace the existing one.
 * @param {number} [oldFileId] - The ID of the old file to delete when replacing.
 * @param {string} [authToken=getAuthToken()] - Optional auth token.
 * @returns {Promise<any>} The response from the API.
 */
export async function updateAITrustCentreResource(
  resourceId: number,
  name: string,
  description: string,
  visible: boolean,
  file?: File,
  oldFileId?: number,
  authToken = getAuthToken()
): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('visible', visible.toString());
    
    // Only append file if it's provided
    if (file) {
      formData.append('file', file);
    }
    
    // Append old file ID for deletion if provided
    if (oldFileId) {
      formData.append('delete', oldFileId.toString());
    }

    const response = await apiServices.put(`/aiTrustCentre/resources/${resourceId}`, formData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "multipart/form-data"
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating AI Trust Center resource:", error);
    throw error;
  }
}

/**
 * Fetches AI Trust Center subprocessors.
 *
 * @param {string} [authToken=getAuthToken()] - Optional auth token.
 * @returns {Promise<any>} The AI Trust Center subprocessors.
 */
export async function getAITrustCentreSubprocessors(
  authToken = getAuthToken()
): Promise<any> {
  try {
    const response = await apiServices.get("/aiTrustCentre/subprocessors", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching AI Trust Center subprocessors:", error);
    throw error;
  }
}

/**
 * Creates a new AI Trust Center subprocessor.
 *
 * @param {string} name - The name of the subprocessor.
 * @param {string} purpose - The purpose of the subprocessor.
 * @param {string} location - The location of the subprocessor.
 * @param {string} url - The URL of the subprocessor.
 * @param {string} [authToken=getAuthToken()] - Optional auth token.
 * @returns {Promise<any>} The response from the API.
 */
export async function createAITrustCentreSubprocessor(
  name: string,
  purpose: string,
  location: string,
  url: string,
  authToken = getAuthToken()
): Promise<any> {
  try {
    const response = await apiServices.post("/aiTrustCentre/subprocessors", {
      name,
      purpose,
      location,
      url,
    }, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json"
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating AI Trust Center subprocessor:", error);
    throw error;
  }
}

/**
 * Updates an AI Trust Center subprocessor.
 *
 * @param {number} subprocessorId - The ID of the subprocessor to update.
 * @param {string} name - The name of the subprocessor.
 * @param {string} purpose - The purpose of the subprocessor.
 * @param {string} location - The location of the subprocessor.
 * @param {string} url - The URL of the subprocessor.
 * @param {string} [authToken=getAuthToken()] - Optional auth token.
 * @returns {Promise<any>} The response from the API.
 */
export async function updateAITrustCentreSubprocessor(
  subprocessorId: number,
  name: string,
  purpose: string,
  location: string,
  url: string,
  authToken = getAuthToken()
): Promise<any> {
  try {
    const response = await apiServices.put(`/aiTrustCentre/subprocessors/${subprocessorId}`, {
      name,
      purpose,
      location,
      url,
    }, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json"
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating AI Trust Center subprocessor:", error);
    throw error;
  }
}

/**
 * Deletes an AI Trust Center subprocessor.
 *
 * @param {number} subprocessorId - The ID of the subprocessor to delete.
 * @param {string} [authToken=getAuthToken()] - Optional auth token.
 * @returns {Promise<any>} The response from the API.
 */
export async function deleteAITrustCentreSubprocessor(
  subprocessorId: number,
  authToken = getAuthToken()
): Promise<any> {
  try {
    const response = await apiServices.delete(`/aiTrustCentre/subprocessors/${subprocessorId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting AI Trust Center subprocessor:", error);
    throw error;
  }
}