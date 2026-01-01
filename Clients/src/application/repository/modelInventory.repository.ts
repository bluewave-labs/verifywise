import { apiServices } from "../../infrastructure/api/networkServices";

interface ModelInventoryData {
  name?: string;
  version?: string;
  status?: string;
  [key: string]: unknown;
}

interface ModelInventoryResponse {
  id: number;
  name: string;
  version: string;
  status: string;
  created_at: string;
}

/**
 * Creates a new model inventory entry in the database.
 *
 * @param {string} routeUrl - The API route URL.
 * @param {ModelInventoryData} data - The model inventory data to be saved.
 * @returns {Promise<ModelInventoryResponse>} The response from the API.
 */
export async function createModelInventory(
  routeUrl: string,
  data: ModelInventoryData,
): Promise<ModelInventoryResponse> {
  try {
    const response = await apiServices.post<ModelInventoryResponse>(routeUrl, data);
    return response.data;
  } catch (error) {
    console.error("Error creating model inventory:", error);
    // Re-throw the error with proper structure to preserve validation details
    throw error;
  }
}

