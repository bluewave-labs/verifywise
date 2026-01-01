import { apiServices } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Training registry entry structure
 */
interface TrainingRegistry {
  id: number;
  title?: string;
  description?: string;
  date?: string;
  attendees?: string[];
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Training registry input for create
 */
interface TrainingRegistryInput {
  title?: string;
  description?: string;
  date?: string;
  attendees?: string[];
  status?: string;
  [key: string]: unknown;
}

//Add training registry data to the database by sending a "POST" request to "/training"
/**
 * Adds a new training registry entry to the database.
 *
 * @param {string} routeUrl - The API route URL.
 * @param {TrainingRegistryInput} data - The training data to be saved.
 * @returns {Promise<BackendResponse<TrainingRegistry>>} The response from the API.
 */
export async function createTraining(
  routeUrl: string,
  data: TrainingRegistryInput,
): Promise<BackendResponse<TrainingRegistry>> {
  try {
    const response = await apiServices.post<BackendResponse<TrainingRegistry>>(routeUrl, data);
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating training:", error);
    throw error;
  }
}
