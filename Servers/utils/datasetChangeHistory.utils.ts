import { sequelize } from "../database/db";
import { Transaction } from "sequelize";
import { DatasetChangeHistoryModel } from "../domain.layer/models/dataset/datasetChangeHistory.model";
import { DatasetModel } from "../domain.layer/models/dataset/dataset.model";

/**
 * Record dataset creation in change history
 */
export const recordDatasetCreation = async (
  datasetId: number,
  userId: number | undefined,
  tenant: string,
  transaction?: Transaction
) => {
  try {
    await sequelize.query(
      `INSERT INTO "${tenant}".dataset_change_histories
        (dataset_id, action, changed_by_user_id, changed_at)
       VALUES (:dataset_id, 'created', :user_id, NOW())`,
      {
        replacements: {
          dataset_id: datasetId,
          user_id: userId || null,
        },
        transaction,
      }
    );
  } catch (error) {
    console.error("Error recording dataset creation:", error);
    throw error;
  }
};

/**
 * Record dataset deletion in change history
 */
export const recordDatasetDeletion = async (
  datasetId: number,
  userId: number | undefined,
  tenant: string,
  transaction?: Transaction
) => {
  try {
    await sequelize.query(
      `INSERT INTO "${tenant}".dataset_change_histories
        (dataset_id, action, changed_by_user_id, changed_at)
       VALUES (:dataset_id, 'deleted', :user_id, NOW())`,
      {
        replacements: {
          dataset_id: datasetId,
          user_id: userId || null,
        },
        transaction,
      }
    );
  } catch (error) {
    console.error("Error recording dataset deletion:", error);
    throw error;
  }
};

/**
 * Track changes between old and new dataset values
 */
export const trackDatasetChanges = (
  oldDataset: DatasetModel,
  newData: Partial<DatasetModel>
): { field: string; oldValue: string; newValue: string }[] => {
  const changes: { field: string; oldValue: string; newValue: string }[] = [];

  const fieldsToTrack = [
    "name",
    "description",
    "version",
    "owner",
    "type",
    "function",
    "source",
    "license",
    "format",
    "classification",
    "contains_pii",
    "pii_types",
    "status",
    "known_biases",
    "bias_mitigation",
    "collection_method",
    "preprocessing_steps",
    "is_demo",
  ];

  for (const field of fieldsToTrack) {
    const oldValue = (oldDataset as any)[field];
    const newValue = (newData as any)[field];

    if (newValue !== undefined && String(oldValue) !== String(newValue)) {
      changes.push({
        field,
        oldValue: oldValue !== null && oldValue !== undefined ? String(oldValue) : "",
        newValue: newValue !== null && newValue !== undefined ? String(newValue) : "",
      });
    }
  }

  return changes;
};

/**
 * Record multiple field changes in change history
 */
export const recordDatasetFieldChanges = async (
  datasetId: number,
  changes: { field: string; oldValue: string; newValue: string }[],
  userId: number | undefined,
  tenant: string,
  transaction?: Transaction
) => {
  try {
    for (const change of changes) {
      await sequelize.query(
        `INSERT INTO "${tenant}".dataset_change_histories
          (dataset_id, action, field_name, old_value, new_value, changed_by_user_id, changed_at)
         VALUES (:dataset_id, 'updated', :field_name, :old_value, :new_value, :user_id, NOW())`,
        {
          replacements: {
            dataset_id: datasetId,
            field_name: change.field,
            old_value: change.oldValue,
            new_value: change.newValue,
            user_id: userId || null,
          },
          transaction,
        }
      );
    }
  } catch (error) {
    console.error("Error recording dataset field changes:", error);
    throw error;
  }
};

/**
 * Get change history for a dataset
 */
export const getDatasetChangeHistory = async (
  datasetId: number,
  tenant: string
) => {
  try {
    const history = await sequelize.query(
      `SELECT dch.*, u.name as changed_by_name
       FROM "${tenant}".dataset_change_histories dch
       LEFT JOIN public.users u ON dch.changed_by_user_id = u.id
       WHERE dch.dataset_id = :dataset_id
       ORDER BY dch.changed_at DESC`,
      {
        replacements: { dataset_id: datasetId },
        mapToModel: true,
        model: DatasetChangeHistoryModel,
      }
    );
    return history;
  } catch (error) {
    console.error("Error getting dataset change history:", error);
    throw error;
  }
};
