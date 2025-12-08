/**
 * Policy Change History Hook
 *
 * Wrapper around the generic useEntityChangeHistory hook for policies.
 */

import { useEntityChangeHistory, EntityChangeHistoryEntry } from "./useEntityChangeHistory";

export interface PolicyChangeHistoryEntry extends EntityChangeHistoryEntry {
  policy_id?: number;
}

/**
 * Hook to fetch policy change history
 */
export const usePolicyChangeHistory = (policyId: number | undefined) => {
  return useEntityChangeHistory("policy", policyId);
};
