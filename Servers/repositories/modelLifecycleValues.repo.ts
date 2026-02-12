/**
 * @fileoverview Model Lifecycle Values Repository
 *
 * Handles per-model lifecycle data: value storage, file attachments,
 * and progress tracking. Follows existing repository pattern.
 */

import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";
import {
  LifecycleValue,
  LifecycleItemFile,
  LifecycleProgress,
  LifecyclePhaseProgress,
  UpsertValueInput,
  LifecyclePhase,
  LifecycleItem,
} from "../domain.layer/interfaces/i.modelLifecycle";

// ============================================================================
// Validation Helpers
// ============================================================================

function validateTenant(tenant: string): void {
  if (!/^[A-Za-z0-9_]{1,30}$/.test(tenant)) {
    throw new ValidationException("Invalid tenant identifier");
  }
}

function escapePgIdentifier(ident: string): string {
  validateTenant(ident);
  return '"' + ident.replace(/"/g, '""') + '"';
}

// ============================================================================
// Value CRUD
// ============================================================================

/**
 * Gets all lifecycle data for a model, organized by phases with items and values.
 */
export async function getValuesByModel(
  modelId: number,
  tenant: string,
  transaction?: Transaction
): Promise<LifecyclePhase[]> {
  const schema = escapePgIdentifier(tenant);

  // Get all active phases with their items
  const phases = await sequelize.query(
    `SELECT id, name, description, display_order, is_active
     FROM ${schema}.model_lifecycle_phases
     WHERE is_active = true
     ORDER BY display_order ASC;`,
    {
      type: QueryTypes.SELECT,
      ...(transaction && { transaction }),
    }
  ) as LifecyclePhase[];

  for (const phase of phases) {
    // Get items for this phase
    const items = await sequelize.query(
      `SELECT i.id, i.phase_id, i.name, i.description, i.item_type, i.is_required,
              i.display_order, i.config, i.is_active
       FROM ${schema}.model_lifecycle_items i
       WHERE i.phase_id = :phaseId AND i.is_active = true
       ORDER BY i.display_order ASC;`,
      {
        type: QueryTypes.SELECT,
        replacements: { phaseId: phase.id },
        ...(transaction && { transaction }),
      }
    ) as (LifecycleItem & { value?: LifecycleValue | null })[];

    // Get values for all items in this phase for the given model
    const values = await sequelize.query(
      `SELECT v.id, v.model_inventory_id, v.item_id, v.value_text, v.value_json,
              v.updated_by, v.created_at, v.updated_at
       FROM ${schema}.model_lifecycle_values v
       INNER JOIN ${schema}.model_lifecycle_items i ON v.item_id = i.id
       WHERE v.model_inventory_id = :modelId AND i.phase_id = :phaseId;`,
      {
        type: QueryTypes.SELECT,
        replacements: { modelId, phaseId: phase.id },
        ...(transaction && { transaction }),
      }
    ) as LifecycleValue[];

    // Get files for document-type values
    const valueIds = values.map((v) => v.id).filter(Boolean);
    let filesByValue: Record<number, LifecycleItemFile[]> = {};

    if (valueIds.length > 0) {
      const files = await sequelize.query(
        `SELECT lf.id, lf.value_id, lf.file_id, lf.created_at,
                f.filename, f.type AS mimetype
         FROM ${schema}.model_lifecycle_item_files lf
         INNER JOIN ${schema}.files f ON lf.file_id = f.id
         WHERE lf.value_id IN (:valueIds);`,
        {
          type: QueryTypes.SELECT,
          replacements: { valueIds },
          ...(transaction && { transaction }),
        }
      ) as (LifecycleItemFile & { value_id: number })[];

      for (const file of files) {
        if (!filesByValue[file.value_id]) filesByValue[file.value_id] = [];
        filesByValue[file.value_id].push(file);
      }
    }

    // Map values onto items
    const valueByItemId: Record<number, LifecycleValue> = {};
    for (const v of values) {
      v.files = filesByValue[v.id] || [];
      valueByItemId[v.item_id] = v;
    }

    for (const item of items) {
      (item as any).value = valueByItemId[item.id] || null;
    }

    phase.items = items;
  }

  return phases;
}

/**
 * Upserts a lifecycle value for a specific item on a model.
 * Uses INSERT ON CONFLICT UPDATE for atomicity.
 */
export async function upsertValue(
  modelId: number,
  itemId: number,
  data: UpsertValueInput,
  userId: number,
  tenant: string,
  transaction?: Transaction
): Promise<LifecycleValue> {
  const schema = escapePgIdentifier(tenant);

  const results = await sequelize.query(
    `INSERT INTO ${schema}.model_lifecycle_values
       (model_inventory_id, item_id, value_text, value_json, updated_by)
     VALUES (:modelId, :itemId, :value_text, :value_json, :userId)
     ON CONFLICT (model_inventory_id, item_id)
     DO UPDATE SET
       value_text = :value_text,
       value_json = :value_json,
       updated_by = :userId,
       updated_at = NOW()
     RETURNING *;`,
    {
      type: QueryTypes.SELECT,
      replacements: {
        modelId,
        itemId,
        value_text: data.value_text ?? null,
        value_json: data.value_json ? JSON.stringify(data.value_json) : null,
        userId,
      },
      ...(transaction && { transaction }),
    }
  );

  return results[0] as LifecycleValue;
}

/**
 * Gets a single value by model and item IDs.
 */
export async function getValue(
  modelId: number,
  itemId: number,
  tenant: string,
  transaction?: Transaction
): Promise<LifecycleValue | null> {
  const schema = escapePgIdentifier(tenant);

  const results = await sequelize.query(
    `SELECT id, model_inventory_id, item_id, value_text, value_json,
            updated_by, created_at, updated_at
     FROM ${schema}.model_lifecycle_values
     WHERE model_inventory_id = :modelId AND item_id = :itemId;`,
    {
      type: QueryTypes.SELECT,
      replacements: { modelId, itemId },
      ...(transaction && { transaction }),
    }
  );

  return (results[0] as LifecycleValue) || null;
}

// ============================================================================
// File management for document-type items
// ============================================================================

/**
 * Adds a file to a lifecycle value (document-type item).
 * Creates the value row if it doesn't exist yet.
 */
export async function addFileToItem(
  modelId: number,
  itemId: number,
  fileId: number,
  userId: number,
  tenant: string,
  transaction?: Transaction
): Promise<LifecycleItemFile> {
  const schema = escapePgIdentifier(tenant);

  // Ensure a value row exists
  await sequelize.query(
    `INSERT INTO ${schema}.model_lifecycle_values
       (model_inventory_id, item_id, updated_by)
     VALUES (:modelId, :itemId, :userId)
     ON CONFLICT (model_inventory_id, item_id) DO NOTHING;`,
    {
      replacements: { modelId, itemId, userId },
      ...(transaction && { transaction }),
    }
  );

  // Get the value ID
  const valueResult = await sequelize.query(
    `SELECT id FROM ${schema}.model_lifecycle_values
     WHERE model_inventory_id = :modelId AND item_id = :itemId;`,
    {
      type: QueryTypes.SELECT,
      replacements: { modelId, itemId },
      ...(transaction && { transaction }),
    }
  );

  const valueId = (valueResult[0] as any).id;

  // Add the file link
  const results = await sequelize.query(
    `INSERT INTO ${schema}.model_lifecycle_item_files (value_id, file_id)
     VALUES (:valueId, :fileId)
     ON CONFLICT (value_id, file_id) DO NOTHING
     RETURNING *;`,
    {
      type: QueryTypes.SELECT,
      replacements: { valueId, fileId },
      ...(transaction && { transaction }),
    }
  );

  return results[0] as LifecycleItemFile;
}

/**
 * Removes a file from a lifecycle value.
 */
export async function removeFileFromItem(
  modelId: number,
  itemId: number,
  fileId: number,
  tenant: string,
  transaction?: Transaction
): Promise<boolean> {
  const schema = escapePgIdentifier(tenant);

  const result = await sequelize.query(
    `DELETE FROM ${schema}.model_lifecycle_item_files
     WHERE file_id = :fileId
     AND value_id = (
       SELECT id FROM ${schema}.model_lifecycle_values
       WHERE model_inventory_id = :modelId AND item_id = :itemId
     );`,
    {
      replacements: { fileId, modelId, itemId },
      ...(transaction && { transaction }),
    }
  );

  return (result[1] as any) > 0;
}

// ============================================================================
// Progress tracking
// ============================================================================

/**
 * Computes lifecycle completion progress for a model.
 */
export async function getLifecycleProgress(
  modelId: number,
  tenant: string,
  transaction?: Transaction
): Promise<LifecycleProgress> {
  const schema = escapePgIdentifier(tenant);

  const phaseProgress = await sequelize.query(
    `SELECT
       p.id AS phase_id,
       p.name AS phase_name,
       COUNT(i.id)::int AS total_items,
       COUNT(v.id)::int AS filled_items,
       COUNT(CASE WHEN i.is_required = true THEN 1 END)::int AS required_items,
       COUNT(CASE WHEN i.is_required = true AND v.id IS NOT NULL THEN 1 END)::int AS filled_required_items
     FROM ${schema}.model_lifecycle_phases p
     INNER JOIN ${schema}.model_lifecycle_items i
       ON i.phase_id = p.id AND i.is_active = true
     LEFT JOIN ${schema}.model_lifecycle_values v
       ON v.item_id = i.id AND v.model_inventory_id = :modelId
       AND (v.value_text IS NOT NULL OR v.value_json IS NOT NULL
            OR EXISTS (
              SELECT 1 FROM ${schema}.model_lifecycle_item_files lf
              WHERE lf.value_id = v.id
            ))
     WHERE p.is_active = true
     GROUP BY p.id, p.name, p.display_order
     ORDER BY p.display_order ASC;`,
    {
      type: QueryTypes.SELECT,
      replacements: { modelId },
      ...(transaction && { transaction }),
    }
  ) as LifecyclePhaseProgress[];

  const totals = phaseProgress.reduce(
    (acc, p) => ({
      total_items: acc.total_items + p.total_items,
      filled_items: acc.filled_items + p.filled_items,
      total_required: acc.total_required + p.required_items,
      filled_required: acc.filled_required + p.filled_required_items,
    }),
    { total_items: 0, filled_items: 0, total_required: 0, filled_required: 0 }
  );

  return {
    phases: phaseProgress,
    ...totals,
    completion_percentage:
      totals.total_items > 0
        ? Math.round((totals.filled_items / totals.total_items) * 100)
        : 0,
  };
}
