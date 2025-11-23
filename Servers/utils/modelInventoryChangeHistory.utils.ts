/**
 * Model Inventory Change History Utilities
 *
 * Wrapper functions that use the generic change history system.
 * These functions maintain backward compatibility while leveraging
 * the new generic utilities.
 */

import { ModelInventoryModel } from "../domain.layer/models/modelInventory/modelInventory.model";
import { Transaction } from "sequelize";
import {
  recordEntityChange,
  recordMultipleFieldChanges as recordMultipleFieldChangesGeneric,
  getEntityChangeHistory,
  trackEntityChanges,
  recordEntityCreation,
  recordEntityDeletion,
  recordEvidenceAddedToEntity,
  recordEvidenceRemovedFromEntity,
  recordEvidenceFieldChangeForEntity,
} from "./changeHistory.base.utils";

/**
 * Record a change in model inventory
 */
export const recordModelInventoryChange = async (
  modelInventoryId: number,
  action: "created" | "updated" | "deleted",
  changedByUserId: number,
  tenant: string,
  fieldName?: string,
  oldValue?: string,
  newValue?: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityChange(
    "model_inventory",
    modelInventoryId,
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
 * Record multiple field changes for a model inventory
 */
export const recordMultipleFieldChanges = async (
  modelInventoryId: number,
  changedByUserId: number,
  tenant: string,
  changes: Array<{ fieldName: string; oldValue: string; newValue: string }>,
  transaction?: Transaction
): Promise<void> => {
  return recordMultipleFieldChangesGeneric(
    "model_inventory",
    modelInventoryId,
    changedByUserId,
    tenant,
    changes,
    transaction
  );
};

/**
 * Get change history for a specific model inventory
 */
export const getModelInventoryChangeHistory = async (
  modelInventoryId: number,
  tenant: string
): Promise<any[]> => {
  return getEntityChangeHistory("model_inventory", modelInventoryId, tenant);
};

/**
 * Track changes between old and new model inventory data
 */
export const trackModelInventoryChanges = async (
  oldModel: ModelInventoryModel,
  newModel: Partial<ModelInventoryModel>
): Promise<Array<{ fieldName: string; oldValue: string; newValue: string }>> => {
  return trackEntityChanges("model_inventory", oldModel, newModel);
};

/**
 * Record creation of a model inventory
 */
export const recordModelInventoryCreation = async (
  modelInventoryId: number,
  changedByUserId: number,
  tenant: string,
  modelData: Partial<ModelInventoryModel>,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityCreation(
    "model_inventory",
    modelInventoryId,
    changedByUserId,
    tenant,
    modelData,
    transaction
  );
};

/**
 * Record deletion of a model inventory
 */
export const recordModelInventoryDeletion = async (
  modelInventoryId: number,
  changedByUserId: number,
  tenant: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityDeletion(
    "model_inventory",
    modelInventoryId,
    changedByUserId,
    tenant,
    transaction
  );
};

/**
 * Record evidence being added to a model
 */
export const recordEvidenceAddedToModel = async (
  modelInventoryId: number,
  changedByUserId: number,
  tenant: string,
  evidenceName: string,
  evidenceType: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEvidenceAddedToEntity(
    "model_inventory",
    modelInventoryId,
    changedByUserId,
    tenant,
    evidenceName,
    evidenceType,
    transaction
  );
};

/**
 * Record evidence being removed from a model
 */
export const recordEvidenceRemovedFromModel = async (
  modelInventoryId: number,
  changedByUserId: number,
  tenant: string,
  evidenceName: string,
  evidenceType: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEvidenceRemovedFromEntity(
    "model_inventory",
    modelInventoryId,
    changedByUserId,
    tenant,
    evidenceName,
    evidenceType,
    transaction
  );
};

/**
 * Record evidence field changes for a specific model
 */
export const recordEvidenceFieldChangeForModel = async (
  modelInventoryId: number,
  changedByUserId: number,
  tenant: string,
  evidenceName: string,
  fieldName: string,
  oldValue: string,
  newValue: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEvidenceFieldChangeForEntity(
    "model_inventory",
    modelInventoryId,
    changedByUserId,
    tenant,
    evidenceName,
    fieldName,
    oldValue,
    newValue,
    transaction
  );
};
