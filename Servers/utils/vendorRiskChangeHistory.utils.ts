/**
 * Vendor Risk Change History Utilities
 *
 * Wrapper functions that use the generic change history system.
 * These functions maintain backward compatibility while leveraging
 * the new generic utilities.
 */

import { VendorRiskModel } from "../domain.layer/models/vendorRisk/vendorRisk.model";
import { Transaction } from "sequelize";
import {
  recordEntityChange,
  recordMultipleFieldChanges as recordMultipleFieldChangesGeneric,
  getEntityChangeHistory,
  trackEntityChanges,
  recordEntityCreation,
  recordEntityDeletion,
} from "./changeHistory.base.utils";

/**
 * Record a change in vendor risk
 */
export const recordVendorRiskChange = async (
  vendorRiskId: number,
  action: "created" | "updated" | "deleted",
  changedByUserId: number,
  tenant: string,
  fieldName?: string,
  oldValue?: string,
  newValue?: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityChange(
    "vendor_risk",
    vendorRiskId,
    action,
    changedByUserId,
    tenant,
    fieldName,
    oldValue,
    newValue,
    transaction
  );
};

/**
 * Record multiple field changes for a vendor risk
 */
export const recordMultipleFieldChanges = async (
  vendorRiskId: number,
  changedByUserId: number,
  tenant: string,
  changes: Array<{ fieldName: string; oldValue: string; newValue: string }>,
  transaction?: Transaction
): Promise<void> => {
  return recordMultipleFieldChangesGeneric(
    "vendor_risk",
    vendorRiskId,
    changedByUserId,
    tenant,
    changes,
    transaction
  );
};

/**
 * Get change history for a specific vendor risk with pagination support
 */
export const getVendorRiskChangeHistory = async (
  vendorRiskId: number,
  tenant: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ data: any[]; hasMore: boolean; total: number }> => {
  return getEntityChangeHistory(
    "vendor_risk",
    vendorRiskId,
    tenant,
    limit,
    offset
  );
};

/**
 * Track changes between old and new vendor risk data
 */
export const trackVendorRiskChanges = async (
  oldModel: VendorRiskModel,
  newModel: Partial<VendorRiskModel>
): Promise<Array<{ fieldName: string; oldValue: string; newValue: string }>> => {
  return trackEntityChanges("vendor_risk", oldModel, newModel);
};

/**
 * Record creation of a vendor risk
 */
export const recordVendorRiskCreation = async (
  vendorRiskId: number,
  changedByUserId: number,
  tenant: string,
  riskData: Partial<VendorRiskModel>,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityCreation(
    "vendor_risk",
    vendorRiskId,
    changedByUserId,
    tenant,
    riskData,
    transaction
  );
};

/**
 * Record deletion of a vendor risk
 */
export const recordVendorRiskDeletion = async (
  vendorRiskId: number,
  changedByUserId: number,
  tenant: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityDeletion(
    "vendor_risk",
    vendorRiskId,
    changedByUserId,
    tenant,
    transaction
  );
};
