import { apiServices } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * AI Trust Centre Overview data structure
 */
interface AITrustCentreOverview {
  id?: number;
  company_name?: string;
  company_description?: string;
  logo_url?: string;
  [key: string]: unknown;
}

/**
 * AI Trust Centre Resource structure
 */
interface AITrustCentreResource {
  id: number;
  name: string;
  description: string;
  visible: boolean;
  file_id?: number;
  file_url?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * AI Trust Centre Subprocessor structure
 */
interface AITrustCentreSubprocessor {
  id: number;
  name: string;
  purpose: string;
  location: string;
  url: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Logo response structure
 */
interface LogoResponse {
  logo_url?: string;
  [key: string]: unknown;
}

/**
 * Fetches the AI Trust Center overview data.
 *
 * @returns {Promise<BackendResponse<AITrustCentreOverview>>} The AI Trust Center overview data.
 */
export async function getAITrustCentreOverview(): Promise<BackendResponse<AITrustCentreOverview>> {
  try {
    const response = await apiServices.get<BackendResponse<AITrustCentreOverview>>("/aiTrustCentre/overview");
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching AI Trust Center overview:", error);
    throw error;
  }
}

/**
 * Updates the AI Trust Center overview.
 *
 * @param {Partial<AITrustCentreOverview>} data - The AI Trust Center overview data to be updated.
 * @returns {Promise<BackendResponse<AITrustCentreOverview>>} The response from the API.
 */
export async function updateAITrustCentreOverview(
  data: Partial<AITrustCentreOverview>
): Promise<BackendResponse<AITrustCentreOverview>> {
  try {
    const response = await apiServices.put<BackendResponse<AITrustCentreOverview>>("/aiTrustCentre/overview", data);
    return response.data;
  } catch (error: unknown) {
    console.error("Error updating AI Trust Center overview:", error);
    throw error;
  }
}

/**
 * Uploads the AI Trust Center logo.
 *
 * @param {File} logoFile - The logo file to upload.
 * @returns {Promise<BackendResponse<LogoResponse>>} The response from the API.
 */
export async function uploadAITrustCentreLogo(
  logoFile: File
): Promise<BackendResponse<LogoResponse>> {
  try {
    const formData = new FormData();
    formData.append('logo', logoFile);

    const response = await apiServices.post<BackendResponse<LogoResponse>>("/aiTrustCentre/logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error uploading AI Trust Center logo:", error);
    throw error;
  }
}

/**
 * Deletes the AI Trust Center logo.
 *
 * @returns {Promise<null>} The response from the API (already unwrapped by apiServices.delete).
 */
export async function deleteAITrustCentreLogo(): Promise<null> {
  try {
    const response = await apiServices.delete<null>("/aiTrustCentre/logo");
    return response.data;
  } catch (error: unknown) {
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
 * @returns {Promise<BackendResponse<AITrustCentreResource>>} The response from the API.
 */
export async function createAITrustCentreResource(
  file: File,
  name: string,
  description: string,
  visible: boolean = true
): Promise<BackendResponse<AITrustCentreResource>> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('visible', visible.toString());

    const response = await apiServices.post<BackendResponse<AITrustCentreResource>>("/aiTrustCentre/resources", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating AI Trust Center resource:", error);
    throw error;
  }
}

/**
 * Fetches AI Trust Center resources.
 *
 * @returns {Promise<BackendResponse<AITrustCentreResource[]>>} The AI Trust Center resources.
 */
export async function getAITrustCentreResources(): Promise<BackendResponse<AITrustCentreResource[]>> {
  try {
    const response = await apiServices.get<BackendResponse<AITrustCentreResource[]>>("/aiTrustCentre/resources");
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching AI Trust Center resources:", error);
    throw error;
  }
}

/**
 * Deletes an AI Trust Center resource.
 *
 * @param {number} resourceId - The ID of the resource to delete.
 * @returns {Promise<null>} The response from the API (already unwrapped by apiServices.delete).
 */
export async function deleteAITrustCentreResource(
  resourceId: number
): Promise<null> {
  try {
    const response = await apiServices.delete<null>(`/aiTrustCentre/resources/${resourceId}`);
    return response.data;
  } catch (error: unknown) {
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
 * @returns {Promise<BackendResponse<AITrustCentreResource>>} The response from the API.
 */
export async function updateAITrustCentreResource(
  resourceId: number,
  name: string,
  description: string,
  visible: boolean,
  file?: File,
  oldFileId?: number
): Promise<BackendResponse<AITrustCentreResource>> {
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

    const response = await apiServices.put<BackendResponse<AITrustCentreResource>>(`/aiTrustCentre/resources/${resourceId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error updating AI Trust Center resource:", error);
    throw error;
  }
}

/**
 * Fetches AI Trust Center subprocessors.
 *
 * @returns {Promise<BackendResponse<AITrustCentreSubprocessor[]>>} The AI Trust Center subprocessors.
 */
export async function getAITrustCentreSubprocessors(): Promise<BackendResponse<AITrustCentreSubprocessor[]>> {
  try {
    const response = await apiServices.get<BackendResponse<AITrustCentreSubprocessor[]>>("/aiTrustCentre/subprocessors");
    return response.data;
  } catch (error: unknown) {
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
 * @returns {Promise<BackendResponse<AITrustCentreSubprocessor>>} The response from the API.
 */
export async function createAITrustCentreSubprocessor(
  name: string,
  purpose: string,
  location: string,
  url: string
): Promise<BackendResponse<AITrustCentreSubprocessor>> {
  try {
    const response = await apiServices.post<BackendResponse<AITrustCentreSubprocessor>>("/aiTrustCentre/subprocessors", {
      name,
      purpose,
      location,
      url,
    }, {
      headers: {
        "Content-Type": "application/json"
      },
    });
    return response.data;
  } catch (error: unknown) {
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
 * @returns {Promise<BackendResponse<AITrustCentreSubprocessor>>} The response from the API.
 */
export async function updateAITrustCentreSubprocessor(
  subprocessorId: number,
  name: string,
  purpose: string,
  location: string,
  url: string
): Promise<BackendResponse<AITrustCentreSubprocessor>> {
  try {
    const response = await apiServices.put<BackendResponse<AITrustCentreSubprocessor>>(`/aiTrustCentre/subprocessors/${subprocessorId}`, {
      name,
      purpose,
      location,
      url,
    }, {
      headers: {
        "Content-Type": "application/json"
      },
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error updating AI Trust Center subprocessor:", error);
    throw error;
  }
}

/**
 * Deletes an AI Trust Center subprocessor.
 *
 * @param {number} subprocessorId - The ID of the subprocessor to delete.
 * @returns {Promise<null>} The response from the API (already unwrapped by apiServices.delete).
 */
export async function deleteAITrustCentreSubprocessor(
  subprocessorId: number
): Promise<null> {
  try {
    const response = await apiServices.delete<null>(`/aiTrustCentre/subprocessors/${subprocessorId}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error deleting AI Trust Center subprocessor:", error);
    throw error;
  }
}

/**
 * Fetches the AI Trust Center logo for a specific tenant.
 *
 * @param {string} tenantId - The tenant ID to fetch the logo for.
 * @returns {Promise<BackendResponse<LogoResponse>>} The logo data from the API.
 */
export async function getAITrustCentreLogo(tenantId: string): Promise<BackendResponse<LogoResponse>> {
  try {
    const response = await apiServices.get<BackendResponse<LogoResponse>>(`/aiTrustCentre/${tenantId}/logo`, {
      responseType: "json",
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching AI Trust Center logo:", error);
    throw error;
  }
}