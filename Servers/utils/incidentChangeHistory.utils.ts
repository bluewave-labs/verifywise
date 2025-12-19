/**
 * Incident Change History Utilities
 *
 * Wrapper functions that use the generic change history system.
 * These functions maintain backward compatibility while leveraging
 * the new generic utilities.
 */

import { IAIIncidentManagement } from "../domain.layer/interfaces/i.aiIncidentManagement";
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
 * Record a change in incident
 */
export const recordIncidentChange = async (
  incidentId: number,
  action: "created" | "updated" | "deleted",
  changedByUserId: number,
  tenant: string,
  fieldName?: string,
  oldValue?: string,
  newValue?: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityChange(
    "incident",
    incidentId,
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
 * Record multiple field changes for an incident
 */
export const recordMultipleFieldChanges = async (
  incidentId: number,
  changedByUserId: number,
  tenant: string,
  changes: Array<{ fieldName: string; oldValue: string; newValue: string }>,
  transaction?: Transaction
): Promise<void> => {
  return recordMultipleFieldChangesGeneric(
    "incident",
    incidentId,
    changedByUserId,
    tenant,
    changes,
    transaction
  );
};

/**
 * Get change history for a specific incident with pagination support
 */
export const getIncidentChangeHistory = async (
  incidentId: number,
  tenant: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ data: any[]; hasMore: boolean; total: number }> => {
  return getEntityChangeHistory(
    "incident",
    incidentId,
    tenant,
    limit,
    offset
  );
};

/**
 * Track changes between old and new incident data
 */
export const trackIncidentChanges = async (
  oldModel: IAIIncidentManagement,
  newModel: Partial<IAIIncidentManagement>
): Promise<Array<{ fieldName: string; oldValue: string; newValue: string }>> => {
  return trackEntityChanges("incident", oldModel, newModel);
};

/**
 * Record creation of an incident
 */
export const recordIncidentCreation = async (
  incidentId: number,
  changedByUserId: number,
  tenant: string,
  incidentData: Partial<IAIIncidentManagement>,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityCreation(
    "incident",
    incidentId,
    changedByUserId,
    tenant,
    incidentData,
    transaction
  );
};

/**
 * Record deletion of an incident
 */
export const recordIncidentDeletion = async (
  incidentId: number,
  changedByUserId: number,
  tenant: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityDeletion(
    "incident",
    incidentId,
    changedByUserId,
    tenant,
    transaction
  );
};
