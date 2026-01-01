import { apiServices } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Model inventory change history entry structure
 */
interface ModelInventoryChangeHistoryEntry {
  id: number;
  model_inventory_id: number;
  field_name: string;
  old_value?: string;
  new_value?: string;
  changed_by: number;
  changed_at: string;
  [key: string]: unknown;
}

/**
 * Get change history for a specific model inventory
 */
export async function getModelInventoryChangeHistory(modelInventoryId: number): Promise<BackendResponse<ModelInventoryChangeHistoryEntry[]>> {
  try {
    const response = await apiServices.get<BackendResponse<ModelInventoryChangeHistoryEntry[]>>(`/modelInventoryChangeHistory/${modelInventoryId}`);
    return response.data;
  } catch (error) {
    console.error("Error getting model inventory change history:", error);
    throw error;
  }
}
