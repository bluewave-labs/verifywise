/**
 * Vendor Change History Utilities
 *
 * Wrapper functions that use the generic change history system.
 * These functions maintain backward compatibility while leveraging
 * the new generic utilities.
 */

import { VendorModel } from "../domain.layer/models/vendor/vendor.model";
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
 * Record a change in vendor
 */
export const recordVendorChange = async (
  vendorId: number,
  action: "created" | "updated" | "deleted",
  changedByUserId: number,
  tenant: string,
  fieldName?: string,
  oldValue?: string,
  newValue?: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityChange(
    "vendor",
    vendorId,
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
 * Record multiple field changes for a vendor
 */
export const recordMultipleFieldChanges = async (
  vendorId: number,
  changedByUserId: number,
  tenant: string,
  changes: Array<{ fieldName: string; oldValue: string; newValue: string }>,
  transaction?: Transaction
): Promise<void> => {
  return recordMultipleFieldChangesGeneric(
    "vendor",
    vendorId,
    changedByUserId,
    tenant,
    changes,
    transaction
  );
};

/**
 * Get change history for a specific vendor with pagination support
 */
export const getVendorChangeHistory = async (
  vendorId: number,
  tenant: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ data: any[]; hasMore: boolean; total: number }> => {
  return getEntityChangeHistory(
    "vendor",
    vendorId,
    tenant,
    limit,
    offset
  );
};

/**
 * Track changes between old and new vendor data
 */
export const trackVendorChanges = async (
  oldVendor: VendorModel,
  newVendor: Partial<VendorModel>
): Promise<Array<{ fieldName: string; oldValue: string; newValue: string }>> => {
  return trackEntityChanges("vendor", oldVendor, newVendor);
};

/**
 * Record creation of a vendor
 */
export const recordVendorCreation = async (
  vendorId: number,
  changedByUserId: number,
  tenant: string,
  vendorData: Partial<VendorModel>,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityCreation(
    "vendor",
    vendorId,
    changedByUserId,
    tenant,
    vendorData,
    transaction
  );
};

/**
 * Record deletion of a vendor
 */
export const recordVendorDeletion = async (
  vendorId: number,
  changedByUserId: number,
  tenant: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityDeletion(
    "vendor",
    vendorId,
    changedByUserId,
    tenant,
    transaction
  );
};
