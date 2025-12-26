/**
 * Unified Change History Utilities
 *
 * Provides type-safe factory functions for entity-specific change history tracking.
 * This consolidates the individual *ChangeHistory.utils.ts files into a single module.
 *
 * Usage:
 *   import { changeHistory } from "./changeHistory.utils";
 *   await changeHistory.vendor.record(vendorId, "updated", userId, tenant, ...);
 *   await changeHistory.policy.getHistory(policyId, tenant);
 */

import { Transaction } from "sequelize";
import {
  EntityType,
} from "../config/changeHistory.config";
import {
  recordEntityChange,
  recordMultipleFieldChanges,
  getEntityChangeHistory,
  trackEntityChanges,
  recordEntityCreation,
  recordEntityDeletion,
} from "./changeHistory.base.utils";

// ============================================================================
// Types
// ============================================================================

export type ChangeAction = "created" | "updated" | "deleted";

export interface FieldChange {
  fieldName: string;
  oldValue: string;
  newValue: string;
}

export interface ChangeHistoryResult {
  data: ChangeHistoryRecord[];
  hasMore: boolean;
  total: number;
}

export interface ChangeHistoryRecord {
  id: number;
  action: ChangeAction;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_by_user_id: number;
  changed_at: Date;
  user_name?: string;
  user_surname?: string;
  user_email?: string;
}

// ============================================================================
// Entity Change History Factory
// ============================================================================

/**
 * Creates a type-safe change history API for a specific entity type.
 */
function createEntityChangeHistory<TEntity>(entityType: EntityType) {
  return {
    /**
     * Record a single change for this entity
     */
    record: (
      entityId: number,
      action: ChangeAction,
      userId: number,
      tenant: string,
      fieldName?: string,
      oldValue?: string,
      newValue?: string,
      transaction?: Transaction
    ): Promise<void> =>
      recordEntityChange(
        entityType,
        entityId,
        action,
        userId,
        tenant,
        fieldName,
        oldValue,
        newValue,
        transaction
      ),

    /**
     * Record multiple field changes for this entity
     */
    recordMultiple: (
      entityId: number,
      userId: number,
      tenant: string,
      changes: FieldChange[],
      transaction?: Transaction
    ): Promise<void> =>
      recordMultipleFieldChanges(
        entityType,
        entityId,
        userId,
        tenant,
        changes,
        transaction
      ),

    /**
     * Get change history for this entity
     */
    getHistory: (
      entityId: number,
      tenant: string,
      limit?: number,
      offset?: number
    ): Promise<ChangeHistoryResult> =>
      getEntityChangeHistory(
        entityType,
        entityId,
        tenant,
        limit,
        offset
      ) as Promise<ChangeHistoryResult>,

    /**
     * Track changes between old and new entity data
     */
    trackChanges: (
      oldData: TEntity,
      newData: Partial<TEntity>
    ): Promise<FieldChange[]> =>
      trackEntityChanges(entityType, oldData, newData),

    /**
     * Record entity creation with initial values
     */
    recordCreation: (
      entityId: number,
      userId: number,
      tenant: string,
      entityData: Partial<TEntity>,
      transaction?: Transaction
    ): Promise<void> =>
      recordEntityCreation(
        entityType,
        entityId,
        userId,
        tenant,
        entityData,
        transaction
      ),

    /**
     * Record entity deletion
     */
    recordDeletion: (
      entityId: number,
      userId: number,
      tenant: string,
      transaction?: Transaction
    ): Promise<void> =>
      recordEntityDeletion(entityType, entityId, userId, tenant, transaction),
  };
}

// ============================================================================
// Pre-built Entity APIs
// ============================================================================

// Import entity interfaces for type safety
import { VendorModel } from "../domain.layer/models/vendor/vendor.model";
import { IPolicy } from "../domain.layer/interfaces/i.policy";
import { IAIIncidentManagement } from "../domain.layer/interfaces/i.aiIncidentManagement";

/**
 * Unified change history API for all entity types.
 *
 * @example
 * // Vendor change history
 * await changeHistory.vendor.record(vendorId, "updated", userId, tenant, "name", "Old", "New");
 *
 * // Policy change history
 * const history = await changeHistory.policy.getHistory(policyId, tenant);
 *
 * // Track changes automatically
 * const changes = await changeHistory.vendor.trackChanges(oldVendor, newVendor);
 * await changeHistory.vendor.recordMultiple(vendorId, userId, tenant, changes);
 */
export const changeHistory = {
  vendor: createEntityChangeHistory<VendorModel>("vendor"),
  policy: createEntityChangeHistory<IPolicy>("policy"),
  incident: createEntityChangeHistory<IAIIncidentManagement>("incident"),
  modelInventory: createEntityChangeHistory<Record<string, unknown>>("model_inventory"),
  useCase: createEntityChangeHistory<Record<string, unknown>>("use_case"),
  project: createEntityChangeHistory<Record<string, unknown>>("project"),
  framework: createEntityChangeHistory<Record<string, unknown>>("framework"),
  evidenceHub: createEntityChangeHistory<Record<string, unknown>>("evidence_hub"),
  risk: createEntityChangeHistory<Record<string, unknown>>("risk"),
  vendorRisk: createEntityChangeHistory<Record<string, unknown>>("vendor_risk"),
} as const;

// ============================================================================
// Re-exports for backward compatibility
// ============================================================================

// Re-export base functions for direct access when needed
export {
  recordEntityChange,
  recordMultipleFieldChanges,
  getEntityChangeHistory,
  trackEntityChanges,
  recordEntityCreation,
  recordEntityDeletion,
  recordEvidenceAddedToEntity,
  recordEvidenceRemovedFromEntity,
  recordEvidenceFieldChangeForEntity,
} from "./changeHistory.base.utils";
