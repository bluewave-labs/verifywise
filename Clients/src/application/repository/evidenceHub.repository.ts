import { apiServices } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Evidence hub entry structure
 */
interface EvidenceHubEntry {
  id: number;
  title?: string;
  description?: string;
  file_id?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Evidence hub input for create
 */
interface EvidenceHubInput {
  title?: string;
  description?: string;
  file_id?: number;
  [key: string]: unknown;
}

/**
 * Creates a new evidence hub entry in the database.
 *
 * @param {string} routeUrl - The API route URL.
 * @param {EvidenceHubInput} data - The evidence hub data to be saved.
 * @returns {Promise<BackendResponse<EvidenceHubEntry>>} The response from the API.
 */
export async function createEvidenceHub(
    routeUrl: string,
    data: EvidenceHubInput
): Promise<BackendResponse<EvidenceHubEntry>> {
    try {
        const response = await apiServices.post<BackendResponse<EvidenceHubEntry>>(routeUrl, data);
        return response.data;
    } catch (error) {
        console.error("Error creating evidence hub:", error);
        throw error;
    }
}
