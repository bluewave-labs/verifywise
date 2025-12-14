/**
 * Vendor Risk Change History Hook
 *
 * Wrapper around the generic useEntityChangeHistory hook for vendor risks.
 */

import { useEntityChangeHistory, EntityChangeHistoryEntry } from "./useEntityChangeHistory";

export interface VendorRiskChangeHistoryEntry extends EntityChangeHistoryEntry {
  vendor_risk_id?: number;
}

/**
 * Hook to fetch vendor risk change history
 */
export const useVendorRiskChangeHistory = (vendorRiskId: number | undefined) => {
  return useEntityChangeHistory("vendor_risk", vendorRiskId);
};
