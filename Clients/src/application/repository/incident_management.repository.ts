import { apiServices } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Incident management entry structure
 */
interface IncidentManagement {
  id: number;
  title?: string;
  description?: string;
  status?: string;
  severity?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Incident management input for create
 */
interface IncidentManagementInput {
  title?: string;
  description?: string;
  status?: string;
  severity?: string;
  [key: string]: unknown;
}

/**
 * Creates a new incident management entry in the database.
 *
 * @param {string} routeUrl - The API route URL.
 * @param {IncidentManagementInput} data - The incident management data to be saved.
 * @returns {Promise<BackendResponse<IncidentManagement>>} The response from the API.
 */
export async function createIncidentManagement(
    routeUrl: string,
    data: IncidentManagementInput
): Promise<BackendResponse<IncidentManagement>> {
    try {
        const response = await apiServices.post<BackendResponse<IncidentManagement>>(routeUrl, data);
        return response.data;
    } catch (error) {
        console.error("Error creating incident management:", error);
        throw error;
    }
}
