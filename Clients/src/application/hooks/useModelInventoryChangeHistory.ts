/**
 * Model Inventory Change History Hook
 *
 * Backward compatibility wrapper around the generic useEntityChangeHistory hook.
 * This maintains the same interface for existing code.
 */

import { useEntityChangeHistory, EntityChangeHistoryEntry } from "./useEntityChangeHistory";

export interface ModelInventoryChangeHistoryEntry extends EntityChangeHistoryEntry {
  model_inventory_id?: number; // Legacy field for backward compatibility
}

/**
 * Hook to fetch model inventory change history
 * @deprecated Use useEntityChangeHistory("model_inventory", id) instead
 */
export const useModelInventoryChangeHistory = (modelInventoryId: number | undefined) => {
  return useEntityChangeHistory("model_inventory", modelInventoryId);
};
