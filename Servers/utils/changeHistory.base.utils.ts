/**
 * Generic Change History Utilities
 *
 * Base utilities for tracking entity changes across all entity types.
 * These functions are entity-agnostic and work with any entity that has
 * a configuration defined in changeHistory.config.ts
 */

import { sequelize } from "../database/db";
import { Transaction, QueryTypes } from "sequelize";
import {
  EntityType,
  getEntityConfig,
  GENERIC_FORMATTERS,
} from "../config/changeHistory.config";

/**
 * Check if a change history table exists for a given tenant
 */
const checkTableExists = async (
  tenant: string,
  tableName: string,
  transaction?: Transaction
): Promise<boolean> => {
  try {
    const result: any[] = await sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = :tenant
        AND table_name = :tableName
      );`,
      {
        replacements: { tenant, tableName },
        type: QueryTypes.SELECT,
        transaction,
      }
    );
    return result[0]?.exists === true;
  } catch (error) {
    console.warn(`Error checking table existence for ${tenant}.${tableName}:`, error);
    return false;
  }
};

/**
 * Record a single change for any entity type
 */
export const recordEntityChange = async (
  entityType: EntityType,
  entityId: number,
  action: "created" | "updated" | "deleted",
  changedByUserId: number,
  tenant: string,
  fieldName?: string,
  oldValue?: string,
  newValue?: string,
  transaction?: Transaction
): Promise<void> => {
  try {
    const config = getEntityConfig(entityType);

    // Check if the change history table exists before inserting
    const tableExists = await checkTableExists(tenant, config.tableName, transaction);
    if (!tableExists) {
      console.warn(
        `Change history table "${tenant}".${config.tableName} does not exist. ` +
        `Skipping change history recording. Run migrations to enable change history tracking.`
      );
      return;
    }

    await sequelize.query(
      `INSERT INTO "${tenant}".${config.tableName}
       (${config.foreignKeyField}, action, field_name, old_value, new_value, changed_by_user_id, changed_at, created_at)
       VALUES (:entity_id, :action, :field_name, :old_value, :new_value, :changed_by_user_id, NOW(), NOW())`,
      {
        replacements: {
          entity_id: entityId,
          action,
          field_name: fieldName || null,
          old_value: oldValue || null,
          new_value: newValue || null,
          changed_by_user_id: changedByUserId,
        },
        transaction,
      }
    );
  } catch (error) {
    console.error(`Error recording ${entityType} change:`, error);
    throw error;
  }
};

/**
 * Record multiple field changes for an entity
 */
export const recordMultipleFieldChanges = async (
  entityType: EntityType,
  entityId: number,
  changedByUserId: number,
  tenant: string,
  changes: Array<{ fieldName: string; oldValue: string; newValue: string }>,
  transaction?: Transaction
): Promise<void> => {
  for (const change of changes) {
    await recordEntityChange(
      entityType,
      entityId,
      "updated",
      changedByUserId,
      tenant,
      change.fieldName,
      change.oldValue,
      change.newValue,
      transaction
    );
  }
};

/**
 * Get change history for a specific entity with pagination support
 */
export const getEntityChangeHistory = async (
  entityType: EntityType,
  entityId: number,
  tenant: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ data: any[]; hasMore: boolean; total: number }> => {
  try {
    const config = getEntityConfig(entityType);

    // Check if the change history table exists
    const tableExists = await checkTableExists(tenant, config.tableName);
    if (!tableExists) {
      console.warn(
        `Change history table "${tenant}".${config.tableName} does not exist. ` +
        `Returning empty history. Run migrations to enable change history tracking.`
      );
      return { data: [], hasMore: false, total: 0 };
    }

    // Get total count
    const countResult: any[] = await sequelize.query(
      `SELECT COUNT(*) as count
       FROM "${tenant}".${config.tableName}
       WHERE ${config.foreignKeyField} = :entity_id`,
      {
        replacements: { entity_id: entityId },
        type: QueryTypes.SELECT,
      }
    );
    const total = parseInt(countResult[0]?.count || "0", 10);

    // Get paginated history
    const history = await sequelize.query(
      `SELECT
        ch.*,
        u.name as user_name,
        u.surname as user_surname,
        u.email as user_email
       FROM "${tenant}".${config.tableName} ch
       LEFT JOIN public.users u ON ch.changed_by_user_id = u.id
       WHERE ch.${config.foreignKeyField} = :entity_id
       ORDER BY ch.changed_at DESC
       LIMIT :limit OFFSET :offset`,
      {
        replacements: { entity_id: entityId, limit, offset },
        type: QueryTypes.SELECT,
      }
    );

    return {
      data: history,
      hasMore: offset + history.length < total,
      total,
    };
  } catch (error) {
    console.error(`Error fetching ${entityType} change history:`, error);
    throw error;
  }
};

/**
 * Format field value for display using entity-specific formatters
 * Includes error handling - if formatter fails, falls back to raw value
 */
export const formatFieldValue = async (
  entityType: EntityType,
  fieldName: string,
  value: any
): Promise<string> => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  try {
    const config = getEntityConfig(entityType);

    // Check if entity has a custom formatter for this field
    if (config.fieldFormatters && config.fieldFormatters[fieldName]) {
      return await config.fieldFormatters[fieldName](value);
    }

    // Default to text formatter
    return await GENERIC_FORMATTERS.text(value);
  } catch (error) {
    // If formatter fails, log error and return raw value as fallback
    console.error(
      `Error formatting field "${fieldName}" for ${entityType}:`,
      error,
      `Value: ${JSON.stringify(value)}`
    );
    // Return stringified raw value as safe fallback
    return String(value);
  }
};

/**
 * Get formatted field name (from config or auto-format)
 */
export const getFieldLabel = (
  entityType: EntityType,
  fieldName: string
): string => {
  const config = getEntityConfig(entityType);
  return config.fieldLabels[fieldName] || fieldName;
};

/**
 * Track changes between old and new entity data
 */
export const trackEntityChanges = async (
  entityType: EntityType,
  oldData: any,
  newData: any
): Promise<
  Array<{ fieldName: string; oldValue: string; newValue: string }>
> => {
  const changes: Array<{
    fieldName: string;
    oldValue: string;
    newValue: string;
  }> = [];
  const config = getEntityConfig(entityType);

  for (const field of config.fieldsToTrack) {
    const oldValue = oldData[field];
    const newValue = newData[field];

    // Skip if field is not being updated
    if (newValue === undefined) continue;

    // Format values for comparison
    const oldValueStr = await formatFieldValue(entityType, field, oldValue);
    const newValueStr = await formatFieldValue(entityType, field, newValue);

    // Record change if values differ
    if (oldValueStr !== newValueStr) {
      changes.push({
        fieldName: getFieldLabel(entityType, field),
        oldValue: oldValueStr,
        newValue: newValueStr,
      });
    }
  }

  return changes;
};

/**
 * Record entity creation with initial field values
 */
export const recordEntityCreation = async (
  entityType: EntityType,
  entityId: number,
  changedByUserId: number,
  tenant: string,
  entityData: any,
  transaction?: Transaction
): Promise<void> => {
  const config = getEntityConfig(entityType);

  // Record initial field values as changes
  for (const field of config.fieldsToTrack) {
    const value = entityData[field];
    if (value !== undefined && value !== null && value !== "") {
      await recordEntityChange(
        entityType,
        entityId,
        "created",
        changedByUserId,
        tenant,
        getFieldLabel(entityType, field),
        "-",
        await formatFieldValue(entityType, field, value),
        transaction
      );
    }
  }
};

/**
 * Record entity deletion
 */
export const recordEntityDeletion = async (
  entityType: EntityType,
  entityId: number,
  changedByUserId: number,
  tenant: string,
  transaction?: Transaction
): Promise<void> => {
  // Get the entity name from the config or use a default
  const entityName = entityType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  await recordEntityChange(
    entityType,
    entityId,
    "deleted",
    changedByUserId,
    tenant,
    entityName,
    "Active",
    "Deleted",
    transaction
  );
};

/**
 * Record evidence being added to an entity
 * Note: This is specific to entities that can have evidence mapped
 */
export const recordEvidenceAddedToEntity = async (
  entityType: EntityType,
  entityId: number,
  changedByUserId: number,
  tenant: string,
  evidenceName: string,
  evidenceType: string,
  transaction?: Transaction
): Promise<void> => {
  await recordEntityChange(
    entityType,
    entityId,
    "updated",
    changedByUserId,
    tenant,
    "Evidence added",
    "-",
    `${evidenceName} (${evidenceType})`,
    transaction
  );
};

/**
 * Record evidence being removed from an entity
 * Note: This is specific to entities that can have evidence mapped
 */
export const recordEvidenceRemovedFromEntity = async (
  entityType: EntityType,
  entityId: number,
  changedByUserId: number,
  tenant: string,
  evidenceName: string,
  evidenceType: string,
  transaction?: Transaction
): Promise<void> => {
  await recordEntityChange(
    entityType,
    entityId,
    "updated",
    changedByUserId,
    tenant,
    "Evidence removed",
    `${evidenceName} (${evidenceType})`,
    "-",
    transaction
  );
};

/**
 * Record evidence field changes for a specific entity
 * Note: This is specific to entities that can have evidence mapped
 */
export const recordEvidenceFieldChangeForEntity = async (
  entityType: EntityType,
  entityId: number,
  changedByUserId: number,
  tenant: string,
  evidenceName: string,
  fieldName: string,
  oldValue: string,
  newValue: string,
  transaction?: Transaction
): Promise<void> => {
  await recordEntityChange(
    entityType,
    entityId,
    "updated",
    changedByUserId,
    tenant,
    `Evidence: ${evidenceName} - ${fieldName}`,
    oldValue,
    newValue,
    transaction
  );
};
