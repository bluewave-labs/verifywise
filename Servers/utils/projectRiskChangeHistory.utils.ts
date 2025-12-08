/**
 * Project Risk Change History Utilities
 *
 * Wrapper functions that use the generic change history system.
 * These functions maintain backward compatibility while leveraging
 * the new generic utilities.
 */

import { RiskModel } from "../domain.layer/models/risks/risk.model";
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
 * Record a change in project risk
 */
export const recordProjectRiskChange = async (
  projectRiskId: number,
  action: "created" | "updated" | "deleted",
  changedByUserId: number,
  tenant: string,
  fieldName?: string,
  oldValue?: string,
  newValue?: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityChange(
    "risk",
    projectRiskId,
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
 * Record multiple field changes for a project risk
 */
export const recordMultipleFieldChanges = async (
  projectRiskId: number,
  changedByUserId: number,
  tenant: string,
  changes: Array<{ fieldName: string; oldValue: string; newValue: string }>,
  transaction?: Transaction
): Promise<void> => {
  return recordMultipleFieldChangesGeneric(
    "risk",
    projectRiskId,
    changedByUserId,
    tenant,
    changes,
    transaction
  );
};

/**
 * Get change history for a specific project risk with pagination support
 */
export const getProjectRiskChangeHistory = async (
  projectRiskId: number,
  tenant: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ data: any[]; hasMore: boolean; total: number }> => {
  return getEntityChangeHistory(
    "risk",
    projectRiskId,
    tenant,
    limit,
    offset
  );
};

/**
 * Track changes between old and new project risk data
 */
export const trackProjectRiskChanges = async (
  oldProjectRisk: RiskModel,
  newProjectRisk: Partial<RiskModel>
): Promise<Array<{ fieldName: string; oldValue: string; newValue: string }>> => {
  return trackEntityChanges("risk", oldProjectRisk, newProjectRisk);
};

/**
 * Record creation of a project risk
 */
export const recordProjectRiskCreation = async (
  projectRiskId: number,
  changedByUserId: number,
  tenant: string,
  projectRiskData: Partial<RiskModel>,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityCreation(
    "risk",
    projectRiskId,
    changedByUserId,
    tenant,
    projectRiskData,
    transaction
  );
};

/**
 * Record deletion of a project risk
 */
export const recordProjectRiskDeletion = async (
  projectRiskId: number,
  changedByUserId: number,
  tenant: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityDeletion(
    "risk",
    projectRiskId,
    changedByUserId,
    tenant,
    transaction
  );
};
