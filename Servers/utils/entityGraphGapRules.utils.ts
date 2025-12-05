/**
 * @fileoverview Entity Graph Gap Rules Utility Functions
 *
 * Data access layer for Entity Graph gap detection rules operations.
 * Uses raw SQL queries with tenant-specific schema isolation.
 * All queries are prefixed with tenant schema hash for multi-tenancy.
 *
 * Functions:
 * - ensureGapRulesTableExists: Create table if missing
 * - createGapRulesQuery: Create and persist new gap rules
 * - getGapRulesByUserQuery: Fetch gap rules for a user
 * - updateGapRulesQuery: Update gap rules
 * - deleteGapRulesQuery: Delete gap rules
 *
 * @module utils/entityGraphGapRules
 */

import {
  EntityGraphGapRulesModel,
  GapRule,
} from "../domain.layer/models/entityGraphGapRules/entityGraphGapRules.model";
import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";
import { isValidSchemaName } from "./entityGraphSecurity.utils";

/**
 * Validates schema name for security (defense-in-depth).
 * Schema names should be alphanumeric from getTenantHash.
 *
 * @param {string} schemaName - Schema name to validate
 * @throws {Error} If schema name is invalid
 */
function validateSchema(schemaName: string): void {
  if (!isValidSchemaName(schemaName)) {
    throw new Error("Invalid schema name");
  }
}

/**
 * Ensure entity_graph_gap_rules table exists in tenant schema
 *
 * Creates the table and indexes if they don't exist.
 * Useful for existing tenants created before this feature was added.
 *
 * @async
 * @param {string} tenantSchema - Tenant schema name for multi-tenancy
 * @returns {Promise<void>}
 * @throws {Error} If database operation fails
 */
export async function ensureGapRulesTableExists(
  tenantSchema: string
): Promise<void> {
  validateSchema(tenantSchema);
  try {
    // Check if table exists
    const tableExists = await sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = :schema
        AND table_name = 'entity_graph_gap_rules'
      )`,
      {
        replacements: { schema: tenantSchema },
        type: QueryTypes.SELECT,
      }
    );

    if ((tableExists as any[])[0]?.exists) {
      return; // Table already exists
    }

    // Create entity_graph_gap_rules table
    await sequelize.query(
      `CREATE TABLE "${tenantSchema}".entity_graph_gap_rules (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        organization_id INTEGER NOT NULL,
        rules JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
      )`
    );

    // Create index for fetching by organization
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_gap_rules_org_${tenantSchema.replace(/[^a-z0-9]/g, "_")}
       ON "${tenantSchema}".entity_graph_gap_rules(organization_id)`
    );
  } catch (error) {
    throw new Error(
      `Failed to ensure entity_graph_gap_rules table exists: ${(error as Error).message}`
    );
  }
}

/**
 * Create and persist new gap rules to the database
 *
 * @async
 * @param {EntityGraphGapRulesModel} gapRules - Model instance to save
 * @param {string} tenantSchema - Tenant schema name for multi-tenancy
 * @returns {Promise<EntityGraphGapRulesModel>} Saved gap rules instance
 * @throws {Error} If database operation fails
 */
export async function createGapRulesQuery(
  gapRules: EntityGraphGapRulesModel,
  tenantSchema: string
): Promise<EntityGraphGapRulesModel> {
  validateSchema(tenantSchema);
  try {
    const result = await sequelize.query(
      `INSERT INTO "${tenantSchema}".entity_graph_gap_rules
        (user_id, organization_id, rules, created_at, updated_at)
       VALUES (:user_id, :organization_id, :rules, :created_at, :updated_at)
       RETURNING id, user_id, organization_id, rules, created_at, updated_at`,
      {
        replacements: {
          user_id: gapRules.user_id,
          organization_id: gapRules.organization_id,
          rules: JSON.stringify(gapRules.rules),
          created_at: new Date(),
          updated_at: new Date(),
        },
        type: QueryTypes.INSERT,
      }
    );

    if (
      result &&
      Array.isArray(result) &&
      result[0] &&
      Array.isArray(result[0]) &&
      result[0][0]
    ) {
      const row = result[0][0];
      gapRules.id = row.id;
      gapRules.created_at = row.created_at;
      gapRules.updated_at = row.updated_at;
    }

    return gapRules;
  } catch (error) {
    throw new Error(`Failed to create gap rules: ${(error as Error).message}`);
  }
}

/**
 * Fetch gap rules for a user
 *
 * Since each user can only have one set of rules (UNIQUE constraint on user_id),
 * this returns a single record or null.
 *
 * @async
 * @param {number} userId - User ID
 * @param {string} tenantSchema - Tenant schema name
 * @returns {Promise<EntityGraphGapRulesModel | null>} Gap rules or null
 * @throws {Error} If database operation fails
 */
export async function getGapRulesByUserQuery(
  userId: number,
  tenantSchema: string
): Promise<EntityGraphGapRulesModel | null> {
  validateSchema(tenantSchema);
  try {
    const result = await sequelize.query(
      `SELECT id, user_id, organization_id, rules, created_at, updated_at
       FROM "${tenantSchema}".entity_graph_gap_rules
       WHERE user_id = :user_id
       LIMIT 1`,
      {
        replacements: { user_id: userId },
        type: QueryTypes.SELECT,
      }
    );

    if (result && (result as any[]).length > 0) {
      const row = (result as any[])[0];
      return new EntityGraphGapRulesModel({
        id: row.id,
        user_id: row.user_id,
        organization_id: row.organization_id,
        rules:
          typeof row.rules === "string" ? JSON.parse(row.rules) : row.rules,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }

    return null;
  } catch (error) {
    throw new Error(`Failed to fetch gap rules: ${(error as Error).message}`);
  }
}

/**
 * Fetch gap rules by ID
 *
 * @async
 * @param {number} gapRulesId - Gap rules ID
 * @param {string} tenantSchema - Tenant schema name
 * @returns {Promise<EntityGraphGapRulesModel | null>} Gap rules or null
 * @throws {Error} If database operation fails
 */
export async function getGapRulesByIdQuery(
  gapRulesId: number,
  tenantSchema: string
): Promise<EntityGraphGapRulesModel | null> {
  validateSchema(tenantSchema);
  try {
    const result = await sequelize.query(
      `SELECT id, user_id, organization_id, rules, created_at, updated_at
       FROM "${tenantSchema}".entity_graph_gap_rules
       WHERE id = :id
       LIMIT 1`,
      {
        replacements: { id: gapRulesId },
        type: QueryTypes.SELECT,
      }
    );

    if (result && (result as any[]).length > 0) {
      const row = (result as any[])[0];
      return new EntityGraphGapRulesModel({
        id: row.id,
        user_id: row.user_id,
        organization_id: row.organization_id,
        rules:
          typeof row.rules === "string" ? JSON.parse(row.rules) : row.rules,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }

    return null;
  } catch (error) {
    throw new Error(`Failed to fetch gap rules: ${(error as Error).message}`);
  }
}

/**
 * Update gap rules in the database
 *
 * @async
 * @param {number} gapRulesId - Gap rules ID
 * @param {GapRule[]} rules - New rules array
 * @param {string} tenantSchema - Tenant schema name
 * @returns {Promise<EntityGraphGapRulesModel | null>} Updated gap rules
 * @throws {Error} If database operation fails
 */
export async function updateGapRulesQuery(
  gapRulesId: number,
  rules: GapRule[],
  tenantSchema: string
): Promise<EntityGraphGapRulesModel | null> {
  validateSchema(tenantSchema);
  try {
    const updatedAt = new Date();

    await sequelize.query(
      `UPDATE "${tenantSchema}".entity_graph_gap_rules
       SET rules = :rules, updated_at = :updated_at
       WHERE id = :id`,
      {
        replacements: {
          id: gapRulesId,
          rules: JSON.stringify(rules),
          updated_at: updatedAt,
        },
        type: QueryTypes.UPDATE,
      }
    );

    // Fetch the updated gap rules
    return getGapRulesByIdQuery(gapRulesId, tenantSchema);
  } catch (error) {
    throw new Error(`Failed to update gap rules: ${(error as Error).message}`);
  }
}

/**
 * Upsert gap rules - create or update
 *
 * Since we have a unique constraint on user_id, this function will
 * update if exists or create if not.
 *
 * @async
 * @param {EntityGraphGapRulesModel} gapRules - Gap rules to upsert
 * @param {string} tenantSchema - Tenant schema name
 * @returns {Promise<EntityGraphGapRulesModel>} Upserted gap rules
 * @throws {Error} If database operation fails
 */
export async function upsertGapRulesQuery(
  gapRules: EntityGraphGapRulesModel,
  tenantSchema: string
): Promise<EntityGraphGapRulesModel> {
  validateSchema(tenantSchema);
  try {
    const result = await sequelize.query(
      `INSERT INTO "${tenantSchema}".entity_graph_gap_rules
        (user_id, organization_id, rules, created_at, updated_at)
       VALUES (:user_id, :organization_id, :rules, :created_at, :updated_at)
       ON CONFLICT (user_id)
       DO UPDATE SET rules = EXCLUDED.rules, updated_at = EXCLUDED.updated_at
       RETURNING id, user_id, organization_id, rules, created_at, updated_at`,
      {
        replacements: {
          user_id: gapRules.user_id,
          organization_id: gapRules.organization_id,
          rules: JSON.stringify(gapRules.rules),
          created_at: new Date(),
          updated_at: new Date(),
        },
        type: QueryTypes.INSERT,
      }
    );

    if (
      result &&
      Array.isArray(result) &&
      result[0] &&
      Array.isArray(result[0]) &&
      result[0][0]
    ) {
      const row = result[0][0];
      return new EntityGraphGapRulesModel({
        id: row.id,
        user_id: row.user_id,
        organization_id: row.organization_id,
        rules:
          typeof row.rules === "string" ? JSON.parse(row.rules) : row.rules,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }

    return gapRules;
  } catch (error) {
    throw new Error(`Failed to upsert gap rules: ${(error as Error).message}`);
  }
}

/**
 * Delete gap rules from the database
 *
 * @async
 * @param {number} gapRulesId - Gap rules ID
 * @param {string} tenantSchema - Tenant schema name
 * @returns {Promise<number>} Number of rows affected (0 or 1)
 * @throws {Error} If database operation fails
 */
export async function deleteGapRulesQuery(
  gapRulesId: number,
  tenantSchema: string
): Promise<number> {
  validateSchema(tenantSchema);
  try {
    const result = await sequelize.query(
      `DELETE FROM "${tenantSchema}".entity_graph_gap_rules WHERE id = :id RETURNING id`,
      {
        replacements: { id: gapRulesId },
        type: QueryTypes.SELECT,
      }
    );

    return Array.isArray(result) && result.length > 0 ? 1 : 0;
  } catch (error) {
    throw new Error(`Failed to delete gap rules: ${(error as Error).message}`);
  }
}

/**
 * Delete gap rules by user ID
 *
 * @async
 * @param {number} userId - User ID
 * @param {string} tenantSchema - Tenant schema name
 * @returns {Promise<number>} Number of rows affected
 * @throws {Error} If database operation fails
 */
export async function deleteGapRulesByUserQuery(
  userId: number,
  tenantSchema: string
): Promise<number> {
  validateSchema(tenantSchema);
  try {
    const result = await sequelize.query(
      `DELETE FROM "${tenantSchema}".entity_graph_gap_rules WHERE user_id = :user_id RETURNING id`,
      {
        replacements: { user_id: userId },
        type: QueryTypes.SELECT,
      }
    );

    return Array.isArray(result) && result.length > 0 ? 1 : 0;
  } catch (error) {
    throw new Error(
      `Failed to delete gap rules by user: ${(error as Error).message}`
    );
  }
}

/**
 * Get default gap rules
 *
 * Returns a set of default gap detection rules that can be used
 * as a starting point for users.
 *
 * @returns {GapRule[]} Default gap rules
 */
export function getDefaultGapRules(): GapRule[] {
  return [
    {
      entityType: "model",
      requirement: "has_risk",
      severity: "warning",
      enabled: true,
    },
    {
      entityType: "model",
      requirement: "has_control",
      severity: "warning",
      enabled: true,
    },
    {
      entityType: "model",
      requirement: "has_owner",
      severity: "info",
      enabled: true,
    },
    {
      entityType: "risk",
      requirement: "has_control",
      severity: "critical",
      enabled: true,
    },
    {
      entityType: "risk",
      requirement: "has_owner",
      severity: "warning",
      enabled: true,
    },
    {
      entityType: "control",
      requirement: "has_evidence",
      severity: "warning",
      enabled: true,
    },
    {
      entityType: "vendor",
      requirement: "has_risk",
      severity: "info",
      enabled: true,
    },
    {
      entityType: "useCase",
      requirement: "has_model",
      severity: "warning",
      enabled: true,
    },
  ];
}
