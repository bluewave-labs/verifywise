import { apiServices } from "../../infrastructure/api/networkServices";

/**
 * Get change history for a specific model inventory
 */
export async function getModelInventoryChangeHistory(modelInventoryId: number): Promise<any> {
  return await apiServices.get(`/modelInventoryChangeHistory/${modelInventoryId}`);
}
