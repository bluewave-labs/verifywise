/**
 * Generic Change History Repository
 *
 * API functions for fetching change history for any entity type.
 */

import { apiServices } from "../../infrastructure/api/networkServices";
import { EntityType } from "../../config/changeHistory.config";

/**
 * Get change history for a specific entity
 *
 * @param entityType - The type of entity
 * @param entityId - The ID of the entity
 * @returns Promise with change history data
 */
export const getEntityChangeHistory = async (
  entityType: EntityType,
  entityId: number
): Promise<any> => {
  try {
    // Convert entity_type to route format (e.g., "model_inventory" -> "model-inventory")
    const routeType = entityType.replace(/_/g, "-");
    const response = await apiServices.get(`/${routeType}-change-history/${entityId}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting ${entityType} change history:`, error);
    throw error;
  }
};
