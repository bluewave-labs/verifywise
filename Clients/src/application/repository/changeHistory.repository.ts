/**
 * Generic Change History Repository
 *
 * API functions for fetching change history for any entity type.
 */

import { httpClient } from "../config/axios.config";
import { AxiosResponse } from "axios";
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
): Promise<AxiosResponse> => {
  // Convert entity_type to route format (e.g., "model_inventory" -> "model-inventory")
  const routeType = entityType.replace(/_/g, "-");
  return httpClient.get(`/api/${routeType}-change-history/${entityId}`);
};
