import { apiServices } from "../../infrastructure/api/networkServices";

/**
 * AI Trust Centre Overview data structure
 */
export interface AITrustCentreOverview {
  id?: number;
  company_name?: string;
  company_description?: string;
  logo_url?: string;
  [key: string]: unknown;
}

/**
 * AI Trust Centre Resource structure
 */
export interface AITrustCentreResource {
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
export interface AITrustCentreSubprocessor {
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
 * API response wrapper types that match actual backend responses.
 * The backend wraps data with STATUS_CODE which produces { message, data: { message, ...payload } }
 */
interface OverviewResponse {
  message: string;
  data: {
    message: string;
    overview: AITrustCentreOverview;
  };
}

interface ResourcesResponse {
  message: string;
  data: {
    message: string;
    resources: AITrustCentreResource[];
  };
}

interface ResourceResponse {
  message: string;
  data: {
    message: string;
    resource: AITrustCentreResource;
  };
}

interface SubprocessorsResponse {
  message: string;
  data: {
    message: string;
    subprocessors: AITrustCentreSubprocessor[];
  };
}

interface SubprocessorResponse {
  message: string;
  data: {
    message: string;
    subprocessor: AITrustCentreSubprocessor;
  };
}

interface LogoApiResponse {
  message: string;
  data: {
    message: string;
    logo?: LogoResponse;
  };
}

/**
 * Fetches the AI Trust Center overview data.
 *
 * @returns {Promise<AITrustCentreOverview>} The AI Trust Center overview data.
 */
export async function getAITrustCentreOverview(): Promise<AITrustCentreOverview> {
  try {
    const response = await apiServices.get<OverviewResponse>("/aiTrustCentre/overview");
    return response.data.data.overview;
  } catch (error: unknown) {
    console.error("Error fetching AI Trust Center overview:", error);
    throw error;
  }
}

/**
 * Updates the AI Trust Center overview.
 *
 * @param {Partial<AITrustCentreOverview>} data - The AI Trust Center overview data to be updated.
 * @returns {Promise<AITrustCentreOverview>} The response from the API.
 */
export async function updateAITrustCentreOverview(
  data: Partial<AITrustCentreOverview>
): Promise<AITrustCentreOverview> {
  try {
    const response = await apiServices.put<OverviewResponse>("/aiTrustCentre/overview", data);
    return response.data.data.overview;
  } catch (error: unknown) {
    console.error("Error updating AI Trust Center overview:", error);
    throw error;
  }
}

/**
 * Uploads the AI Trust Center logo.
 *
 * @param {File} logoFile - The logo file to upload.
 * @returns {Promise<LogoApiResponse>} The response from the API.
 */
export async function uploadAITrustCentreLogo(
  logoFile: File
): Promise<LogoApiResponse> {
  try {
    const formData = new FormData();
    formData.append('logo', logoFile);

    const response = await apiServices.post<LogoApiResponse>("/aiTrustCentre/logo", formData, {
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
 * @returns {Promise<ResourceResponse>} The response from the API.
 */
export async function createAITrustCentreResource(
  file: File,
  name: string,
  description: string,
  visible: boolean = true
): Promise<ResourceResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('visible', visible.toString());

    const response = await apiServices.post<ResourceResponse>("/aiTrustCentre/resources", formData, {
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
 * @returns {Promise<AITrustCentreResource[]>} The AI Trust Center resources.
 */
export async function getAITrustCentreResources(): Promise<AITrustCentreResource[]> {
  try {
    const response = await apiServices.get<ResourcesResponse>("/aiTrustCentre/resources");
    return response.data.data.resources;
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
 * @returns {Promise<ResourceResponse>} The response from the API.
 */
export async function updateAITrustCentreResource(
  resourceId: number,
  name: string,
  description: string,
  visible: boolean,
  file?: File,
  oldFileId?: number
): Promise<ResourceResponse> {
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

    const response = await apiServices.put<ResourceResponse>(`/aiTrustCentre/resources/${resourceId}`, formData, {
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
 * @returns {Promise<AITrustCentreSubprocessor[]>} The AI Trust Center subprocessors.
 */
export async function getAITrustCentreSubprocessors(): Promise<AITrustCentreSubprocessor[]> {
  try {
    const response = await apiServices.get<SubprocessorsResponse>("/aiTrustCentre/subprocessors");
    return response.data.data.subprocessors;
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
 * @returns {Promise<SubprocessorResponse>} The response from the API.
 */
export async function createAITrustCentreSubprocessor(
  name: string,
  purpose: string,
  location: string,
  url: string
): Promise<SubprocessorResponse> {
  try {
    const response = await apiServices.post<SubprocessorResponse>("/aiTrustCentre/subprocessors", {
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
 * @returns {Promise<SubprocessorResponse>} The response from the API.
 */
export async function updateAITrustCentreSubprocessor(
  subprocessorId: number,
  name: string,
  purpose: string,
  location: string,
  url: string
): Promise<SubprocessorResponse> {
  try {
    const response = await apiServices.put<SubprocessorResponse>(`/aiTrustCentre/subprocessors/${subprocessorId}`, {
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
 * @returns {Promise<LogoApiResponse>} The logo data from the API.
 */
export async function getAITrustCentreLogo(tenantId: string): Promise<LogoApiResponse> {
  try {
    const response = await apiServices.get<LogoApiResponse>(`/aiTrustCentre/${tenantId}/logo`, {
      responseType: "json",
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching AI Trust Center logo:", error);
    throw error;
  }
}