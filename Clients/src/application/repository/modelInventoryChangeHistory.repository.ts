import apiServices from "./api.services";

/**
 * Get change history for a specific model inventory
 */
export async function getModelInventoryChangeHistory(modelInventoryId: number): Promise<any> {
  return await apiServices.get(`/modelInventoryChangeHistory/${modelInventoryId}`);
}
