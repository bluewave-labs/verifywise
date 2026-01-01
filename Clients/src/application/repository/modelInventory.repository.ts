import { apiServices } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Model inventory entry structure
 */
interface ModelInventory {
  id: number;
  name: string;
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Model inventory input for create
 */
interface ModelInventoryInput {
  name?: string;
  description?: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * Creates a new model inventory entry in the database.
 *
 * @param {string} routeUrl - The API route URL.
 * @param {ModelInventoryInput} data - The model inventory data to be saved.
 * @returns {Promise<BackendResponse<ModelInventory>>} The response from the API.
 */
export async function createModelInventory(
  routeUrl: string,
  data: ModelInventoryInput,
): Promise<BackendResponse<ModelInventory>> {
  try {
    const response = await apiServices.post<BackendResponse<ModelInventory>>(routeUrl, data);
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating model inventory:", error);
    // Re-throw the error with proper structure to preserve validation details
    throw error;
  }
}

