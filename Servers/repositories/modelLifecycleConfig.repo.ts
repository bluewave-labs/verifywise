/**
 * @fileoverview Model Lifecycle Config Repository
 *
 * Handles CRUD operations for lifecycle phases and items (admin configuration).
 * Follows existing repository pattern with raw SQL and tenant isolation.
 */

import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";
import {
  LifecyclePhase,
  LifecycleItem,
  CreatePhaseInput,
  UpdatePhaseInput,
  CreateItemInput,
  UpdateItemInput,
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
// Phase CRUD
// ============================================================================

export async function getAllPhases(
  tenant: string,
  includeInactive = false,
  transaction?: Transaction
): Promise<LifecyclePhase[]> {
  const schema = escapePgIdentifier(tenant);
  const activeFilter = includeInactive ? "" : "WHERE is_active = true";

  const results = await sequelize.query(
    `SELECT id, name, description, display_order, is_active, created_at, updated_at
     FROM ${schema}.model_lifecycle_phases
     ${activeFilter}
     ORDER BY display_order ASC;`,
    {
      type: QueryTypes.SELECT,
      ...(transaction && { transaction }),
    }
  );

  return results as LifecyclePhase[];
}

export async function getPhaseById(
  phaseId: number,
  tenant: string,
  transaction?: Transaction
): Promise<LifecyclePhase | null> {
  const schema = escapePgIdentifier(tenant);

  const results = await sequelize.query(
    `SELECT id, name, description, display_order, is_active, created_at, updated_at
     FROM ${schema}.model_lifecycle_phases
     WHERE id = :phaseId;`,
    {
      type: QueryTypes.SELECT,
      replacements: { phaseId },
      ...(transaction && { transaction }),
    }
  );

  return (results[0] as LifecyclePhase) || null;
}

export async function createPhase(
  data: CreatePhaseInput,
  tenant: string,
  transaction?: Transaction
): Promise<LifecyclePhase> {
  const schema = escapePgIdentifier(tenant);

  // If no display_order, put it at the end
  let displayOrder = data.display_order;
  if (displayOrder === undefined) {
    const maxResult = await sequelize.query(
      `SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order
       FROM ${schema}.model_lifecycle_phases;`,
      {
        type: QueryTypes.SELECT,
        ...(transaction && { transaction }),
      }
    );
    displayOrder = (maxResult[0] as any).next_order;
  }

  const results = await sequelize.query(
    `INSERT INTO ${schema}.model_lifecycle_phases (name, description, display_order)
     VALUES (:name, :description, :display_order)
     RETURNING *;`,
    {
      type: QueryTypes.SELECT,
      replacements: {
        name: data.name,
        description: data.description || null,
        display_order: displayOrder,
      },
      ...(transaction && { transaction }),
    }
  );

  return results[0] as LifecyclePhase;
}

export async function updatePhase(
  phaseId: number,
  data: UpdatePhaseInput,
  tenant: string,
  transaction?: Transaction
): Promise<LifecyclePhase | null> {
  const schema = escapePgIdentifier(tenant);

  const setClauses: string[] = [];
  const replacements: Record<string, unknown> = { phaseId };

  if (data.name !== undefined) {
    setClauses.push("name = :name");
    replacements.name = data.name;
  }
  if (data.description !== undefined) {
    setClauses.push("description = :description");
    replacements.description = data.description;
  }
  if (data.display_order !== undefined) {
    setClauses.push("display_order = :display_order");
    replacements.display_order = data.display_order;
  }
  if (data.is_active !== undefined) {
    setClauses.push("is_active = :is_active");
    replacements.is_active = data.is_active;
  }

  if (setClauses.length === 0) return getPhaseById(phaseId, tenant, transaction);

  setClauses.push("updated_at = NOW()");

  const results = await sequelize.query(
    `UPDATE ${schema}.model_lifecycle_phases
     SET ${setClauses.join(", ")}
     WHERE id = :phaseId
     RETURNING *;`,
    {
      type: QueryTypes.SELECT,
      replacements,
      ...(transaction && { transaction }),
    }
  );

  return (results[0] as LifecyclePhase) || null;
}

export async function deletePhase(
  phaseId: number,
  tenant: string,
  transaction?: Transaction
): Promise<boolean> {
  const schema = escapePgIdentifier(tenant);

  const result = await sequelize.query(
    `DELETE FROM ${schema}.model_lifecycle_phases WHERE id = :phaseId;`,
    {
      replacements: { phaseId },
      ...(transaction && { transaction }),
    }
  );

  return (result[1] as any) > 0;
}

export async function reorderPhases(
  orderedIds: number[],
  tenant: string,
  transaction?: Transaction
): Promise<void> {
  const schema = escapePgIdentifier(tenant);

  for (let i = 0; i < orderedIds.length; i++) {
    await sequelize.query(
      `UPDATE ${schema}.model_lifecycle_phases
       SET display_order = :order, updated_at = NOW()
       WHERE id = :id;`,
      {
        replacements: { order: i + 1, id: orderedIds[i] },
        ...(transaction && { transaction }),
      }
    );
  }
}

// ============================================================================
// Item CRUD
// ============================================================================

export async function getItemsByPhase(
  phaseId: number,
  tenant: string,
  includeInactive = false,
  transaction?: Transaction
): Promise<LifecycleItem[]> {
  const schema = escapePgIdentifier(tenant);
  const activeFilter = includeInactive ? "" : "AND is_active = true";

  const results = await sequelize.query(
    `SELECT id, phase_id, name, description, item_type, is_required,
            display_order, config, is_active, created_at, updated_at
     FROM ${schema}.model_lifecycle_items
     WHERE phase_id = :phaseId ${activeFilter}
     ORDER BY display_order ASC;`,
    {
      type: QueryTypes.SELECT,
      replacements: { phaseId },
      ...(transaction && { transaction }),
    }
  );

  return results as LifecycleItem[];
}

export async function createItem(
  data: CreateItemInput,
  tenant: string,
  transaction?: Transaction
): Promise<LifecycleItem> {
  const schema = escapePgIdentifier(tenant);

  let displayOrder = data.display_order;
  if (displayOrder === undefined) {
    const maxResult = await sequelize.query(
      `SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order
       FROM ${schema}.model_lifecycle_items
       WHERE phase_id = :phaseId;`,
      {
        type: QueryTypes.SELECT,
        replacements: { phaseId: data.phase_id },
        ...(transaction && { transaction }),
      }
    );
    displayOrder = (maxResult[0] as any).next_order;
  }

  const results = await sequelize.query(
    `INSERT INTO ${schema}.model_lifecycle_items
       (phase_id, name, description, item_type, is_required, display_order, config)
     VALUES (:phase_id, :name, :description, :item_type, :is_required, :display_order, :config)
     RETURNING *;`,
    {
      type: QueryTypes.SELECT,
      replacements: {
        phase_id: data.phase_id,
        name: data.name,
        description: data.description || null,
        item_type: data.item_type,
        is_required: data.is_required ?? false,
        display_order: displayOrder,
        config: JSON.stringify(data.config || {}),
      },
      ...(transaction && { transaction }),
    }
  );

  return results[0] as LifecycleItem;
}

export async function updateItem(
  itemId: number,
  data: UpdateItemInput,
  tenant: string,
  transaction?: Transaction
): Promise<LifecycleItem | null> {
  const schema = escapePgIdentifier(tenant);

  const setClauses: string[] = [];
  const replacements: Record<string, unknown> = { itemId };

  if (data.name !== undefined) {
    setClauses.push("name = :name");
    replacements.name = data.name;
  }
  if (data.description !== undefined) {
    setClauses.push("description = :description");
    replacements.description = data.description;
  }
  if (data.item_type !== undefined) {
    setClauses.push("item_type = :item_type");
    replacements.item_type = data.item_type;
  }
  if (data.is_required !== undefined) {
    setClauses.push("is_required = :is_required");
    replacements.is_required = data.is_required;
  }
  if (data.display_order !== undefined) {
    setClauses.push("display_order = :display_order");
    replacements.display_order = data.display_order;
  }
  if (data.config !== undefined) {
    setClauses.push("config = :config");
    replacements.config = JSON.stringify(data.config);
  }
  if (data.is_active !== undefined) {
    setClauses.push("is_active = :is_active");
    replacements.is_active = data.is_active;
  }

  if (setClauses.length === 0) return null;

  setClauses.push("updated_at = NOW()");

  const results = await sequelize.query(
    `UPDATE ${schema}.model_lifecycle_items
     SET ${setClauses.join(", ")}
     WHERE id = :itemId
     RETURNING *;`,
    {
      type: QueryTypes.SELECT,
      replacements,
      ...(transaction && { transaction }),
    }
  );

  return (results[0] as LifecycleItem) || null;
}

export async function deleteItem(
  itemId: number,
  tenant: string,
  transaction?: Transaction
): Promise<boolean> {
  const schema = escapePgIdentifier(tenant);

  const result = await sequelize.query(
    `DELETE FROM ${schema}.model_lifecycle_items WHERE id = :itemId;`,
    {
      replacements: { itemId },
      ...(transaction && { transaction }),
    }
  );

  return (result[1] as any) > 0;
}

export async function reorderItems(
  phaseId: number,
  orderedIds: number[],
  tenant: string,
  transaction?: Transaction
): Promise<void> {
  const schema = escapePgIdentifier(tenant);

  for (let i = 0; i < orderedIds.length; i++) {
    await sequelize.query(
      `UPDATE ${schema}.model_lifecycle_items
       SET display_order = :order, updated_at = NOW()
       WHERE id = :id AND phase_id = :phaseId;`,
      {
        replacements: { order: i + 1, id: orderedIds[i], phaseId },
        ...(transaction && { transaction }),
      }
    );
  }
}

// ============================================================================
// Full config retrieval (phases + items)
// ============================================================================

export async function getFullConfig(
  tenant: string,
  includeInactive = false,
  transaction?: Transaction
): Promise<LifecyclePhase[]> {
  const phases = await getAllPhases(tenant, includeInactive, transaction);

  for (const phase of phases) {
    phase.items = await getItemsByPhase(phase.id, tenant, includeInactive, transaction);
  }

  return phases;
}
