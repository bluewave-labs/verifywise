import { useQuery } from "@tanstack/react-query";
import { getModelInventoryChangeHistory } from "../repository/modelInventoryChangeHistory.repository";

export interface ModelInventoryChangeHistoryEntry {
  id: number;
  model_inventory_id: number;
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
 * Hook to fetch model inventory change history
 */
export const useModelInventoryChangeHistory = (modelInventoryId: number | undefined) => {
  return useQuery({
    queryKey: ["modelInventoryChangeHistory", modelInventoryId],
    queryFn: async () => {
      if (!modelInventoryId) return [];
      const response = await getModelInventoryChangeHistory(modelInventoryId);
      // response is STATUS_CODE wrapped: { message: "OK", data: [...] }
      if (response?.data) {
        return response.data as ModelInventoryChangeHistoryEntry[];
      }
      return [] as ModelInventoryChangeHistoryEntry[];
    },
    enabled: !!modelInventoryId,
    staleTime: 30000, // 30 seconds
  });
};
