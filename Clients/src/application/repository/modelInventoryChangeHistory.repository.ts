import { apiServices } from "../../infrastructure/api/networkServices";

/**
 * Get change history for a specific model inventory
 */
export async function getModelInventoryChangeHistory(modelInventoryId: number): Promise<any> {
  try {
    const response = await apiServices.get(`/modelInventoryChangeHistory/${modelInventoryId}`);
    return response.data;
  } catch (error) {
    console.error("Error getting model inventory change history:", error);
    throw error;
  }
}
