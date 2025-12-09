/**
 * Use Case Change History Utilities
 *
 * Wrapper functions that use the generic change history system.
 * These functions maintain backward compatibility while leveraging
 * the new generic utilities.
 */

import { IProjectAttributes } from "../domain.layer/interfaces/i.project";
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
 * Record a change in use case
 */
export const recordUseCaseChange = async (
  useCaseId: number,
  action: "created" | "updated" | "deleted",
  changedByUserId: number,
  tenant: string,
  fieldName?: string,
  oldValue?: string,
  newValue?: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityChange(
    "use_case",
    useCaseId,
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
 * Record multiple field changes for a use case
 */
export const recordMultipleFieldChanges = async (
  useCaseId: number,
  changedByUserId: number,
  tenant: string,
  changes: Array<{ fieldName: string; oldValue: string; newValue: string }>,
  transaction?: Transaction
): Promise<void> => {
  return recordMultipleFieldChangesGeneric(
    "use_case",
    useCaseId,
    changedByUserId,
    tenant,
    changes,
    transaction
  );
};

/**
 * Get change history for a specific use case with pagination support
 */
export const getUseCaseChangeHistory = async (
  useCaseId: number,
  tenant: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ data: any[]; hasMore: boolean; total: number }> => {
  return getEntityChangeHistory(
    "use_case",
    useCaseId,
    tenant,
    limit,
    offset
  );
};

/**
 * Track changes between old and new use case data
 */
export const trackUseCaseChanges = async (
  oldModel: IProjectAttributes,
  newModel: Partial<IProjectAttributes>
): Promise<Array<{ fieldName: string; oldValue: string; newValue: string }>> => {
  return trackEntityChanges("use_case", oldModel, newModel);
};

/**
 * Record creation of a use case
 */
export const recordUseCaseCreation = async (
  useCaseId: number,
  changedByUserId: number,
  tenant: string,
  useCaseData: Partial<IProjectAttributes>,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityCreation(
    "use_case",
    useCaseId,
    changedByUserId,
    tenant,
    useCaseData,
    transaction
  );
};

/**
 * Record deletion of a use case
 */
export const recordUseCaseDeletion = async (
  useCaseId: number,
  changedByUserId: number,
  tenant: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityDeletion(
    "use_case",
    useCaseId,
    changedByUserId,
    tenant,
    transaction
  );
};
