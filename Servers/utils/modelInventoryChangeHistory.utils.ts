import { ModelInventoryChangeHistoryModel } from "../domain.layer/models/modelInventoryChangeHistory/modelInventoryChangeHistory.model";
import { ModelInventoryModel } from "../domain.layer/models/modelInventory/modelInventory.model";
import { sequelize } from "../database/db";
import { Transaction, QueryTypes } from "sequelize";
import { UserModel } from "../domain.layer/models/user/user.model";

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
  try {
    await sequelize.query(
      `INSERT INTO "${tenant}".model_inventory_change_history
       (model_inventory_id, action, field_name, old_value, new_value, changed_by_user_id, changed_at, created_at)
       VALUES (:model_inventory_id, :action, :field_name, :old_value, :new_value, :changed_by_user_id, NOW(), NOW())`,
      {
        replacements: {
          model_inventory_id: modelInventoryId,
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
    console.error("Error recording model inventory change:", error);
    throw error;
  }
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
  for (const change of changes) {
    await recordModelInventoryChange(
      modelInventoryId,
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
 * Get change history for a specific model inventory
 */
export const getModelInventoryChangeHistory = async (
  modelInventoryId: number,
  tenant: string
): Promise<any[]> => {
  try {
    const history = await sequelize.query(
      `SELECT
        ch.*,
        u.name as user_name,
        u.surname as user_surname,
        u.email as user_email
       FROM "${tenant}".model_inventory_change_history ch
       LEFT JOIN public.users u ON ch.changed_by_user_id = u.id
       WHERE ch.model_inventory_id = :model_inventory_id
       ORDER BY ch.changed_at DESC`,
      {
        replacements: { model_inventory_id: modelInventoryId },
        type: QueryTypes.SELECT,
      }
    );

    return history;
  } catch (error) {
    console.error("Error fetching model inventory change history:", error);
    throw error;
  }
};

/**
 * Track changes between old and new model inventory data
 */
export const trackModelInventoryChanges = async (
  oldModel: ModelInventoryModel,
  newModel: Partial<ModelInventoryModel>
): Promise<Array<{ fieldName: string; oldValue: string; newValue: string }>> => {
  const changes: Array<{ fieldName: string; oldValue: string; newValue: string }> = [];

  const fieldsToTrack = [
    "provider",
    "model",
    "version",
    "approver",
    "capabilities",
    "security_assessment",
    "status",
    "status_date",
    "reference_link",
    "biases",
    "limitations",
    "hosting_provider",
  ];

  for (const field of fieldsToTrack) {
    const oldValue = (oldModel as any)[field];
    const newValue = (newModel as any)[field];

    // Skip if field is not being updated
    if (newValue === undefined) continue;

    // Compare values (handle different types)
    let oldValueStr = await formatFieldValue(field, oldValue);
    let newValueStr = await formatFieldValue(field, newValue);

    if (oldValueStr !== newValueStr) {
      changes.push({
        fieldName: formatFieldName(field),
        oldValue: oldValueStr,
        newValue: newValueStr,
      });
    }
  }

  return changes;
};

/**
 * Format field value for display
 */
const formatFieldValue = async (fieldName: string, value: any): Promise<string> => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (fieldName === "security_assessment") {
    return value ? "Yes" : "No";
  }

  if (fieldName === "status_date" && value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  if (fieldName === "status_date" && typeof value === "string") {
    return value.split("T")[0];
  }

  // Handle approver field - lookup user name
  if (fieldName === "approver" && typeof value === "number") {
    try {
      const users: any[] = await sequelize.query(
        `SELECT id, name, surname, email FROM public.users WHERE id = :userId`,
        {
          replacements: { userId: value },
          type: QueryTypes.SELECT,
        }
      );

      if (users && users.length > 0) {
        const user = users[0];
        if (user.name && user.surname) {
          return `${user.name} ${user.surname}`;
        } else if (user.email) {
          return user.email;
        }
      }
    } catch (error) {
      console.error("Error fetching user for approver ID", value, ":", error);
    }
    return `User #${value}`;
  }

  // Handle arrays (like capabilities) - normalize by sorting and joining consistently
  if (Array.isArray(value)) {
    if (value.length === 0) return "-";
    // Sort and join with comma+space for consistent comparison
    return value
      .map((item) => String(item).trim())
      .sort()
      .join(", ");
  }

  // Handle string representations of arrays
  if (typeof value === "string" && (value.startsWith("[") || value.includes(","))) {
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .sort()
          .join(", ");
      }
    } catch {
      // If not valid JSON, treat as comma-separated string
      const items = value.split(",").map((item) => item.trim()).filter(Boolean);
      if (items.length > 1) {
        return items.sort().join(", ");
      }
    }
  }

  return String(value);
};

/**
 * Format field name for display
 */
const formatFieldName = (fieldName: string): string => {
  const fieldNameMap: { [key: string]: string } = {
    provider: "Provider",
    model: "Model",
    version: "Version",
    approver: "Approver",
    capabilities: "Capabilities",
    security_assessment: "Security Assessment",
    status: "Status",
    status_date: "Status Date",
    reference_link: "Reference Link",
    biases: "Biases",
    limitations: "Limitations",
    hosting_provider: "Hosting Provider",
  };

  return fieldNameMap[fieldName] || fieldName;
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
  // Record initial field values as changes (no need for separate creation event)
  const fieldsToTrack = [
    "provider",
    "model",
    "version",
    "approver",
    "capabilities",
    "security_assessment",
    "status",
    "status_date",
    "reference_link",
    "biases",
    "limitations",
    "hosting_provider",
  ];

  for (const field of fieldsToTrack) {
    const value = (modelData as any)[field];
    if (value !== undefined && value !== null && value !== "") {
      await recordModelInventoryChange(
        modelInventoryId,
        "created",
        changedByUserId,
        tenant,
        formatFieldName(field),
        "-",
        await formatFieldValue(field, value),
        transaction
      );
    }
  }
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
  // Record a single deletion event with field name
  await recordModelInventoryChange(
    modelInventoryId,
    "deleted",
    changedByUserId,
    tenant,
    "Model Inventory",
    "Active",
    "Deleted",
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
  await recordModelInventoryChange(
    modelInventoryId,
    "updated",
    changedByUserId,
    tenant,
    "Evidence Added",
    "-",
    `${evidenceName} (${evidenceType})`,
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
  await recordModelInventoryChange(
    modelInventoryId,
    "updated",
    changedByUserId,
    tenant,
    "Evidence Removed",
    `${evidenceName} (${evidenceType})`,
    "-",
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
  await recordModelInventoryChange(
    modelInventoryId,
    "updated",
    changedByUserId,
    tenant,
    `Evidence: ${evidenceName} - ${fieldName}`,
    oldValue,
    newValue,
    transaction
  );
};
