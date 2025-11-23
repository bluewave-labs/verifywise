/**
 * Generic Entity Change History Hook
 *
 * A reusable hook for fetching change history for any entity type.
 * Works with the generic change history repository.
 */

import { useQuery } from "@tanstack/react-query";
import { EntityType } from "../../config/changeHistory.config";
import { getEntityChangeHistory } from "../repository/changeHistory.repository";

export interface EntityChangeHistoryEntry {
  id: number;
  action: "created" | "updated" | "deleted";
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_by_user_id: number;
  changed_at: string;
  user_name?: string;
  user_surname?: string;
  user_email?: string;
}

/**
 * Hook for fetching entity change history
 *
 * @param entityType - The type of entity (e.g., "model_inventory", "vendor")
 * @param entityId - The ID of the entity
 * @returns Query result with change history data
 */
export const useEntityChangeHistory = (
  entityType: EntityType,
  entityId: number | undefined
) => {
  return useQuery<EntityChangeHistoryEntry[]>({
    queryKey: ["changeHistory", entityType, entityId],
    queryFn: async () => {
      if (!entityId) {
        return [];
      }
      const response = await getEntityChangeHistory(entityType, entityId);
      return response.data;
    },
    enabled: !!entityId,
    staleTime: 30000, // Cache for 30 seconds
  });
};
