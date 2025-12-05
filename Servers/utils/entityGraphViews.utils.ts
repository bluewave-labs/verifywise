/**
 * @fileoverview Entity Graph Views Utility Functions
 *
 * Data access layer for Entity Graph saved views operations.
 * Uses raw SQL queries with tenant-specific schema isolation.
 * All queries are prefixed with tenant schema hash for multi-tenancy.
 *
 * Functions:
 * - ensureViewsTableExists: Create table if missing
 * - createViewQuery: Create and persist a new view
 * - getViewsByUserQuery: Fetch all views for a user
 * - getViewByIdQuery: Fetch a single view by ID
 * - updateViewQuery: Update view name and/or config
 * - deleteViewByIdQuery: Delete a view
 *
 * @module utils/entityGraphViews
 */

import {
  EntityGraphViewsModel,
  EntityGraphViewConfig,
} from "../domain.layer/models/entityGraphViews/entityGraphViews.model";
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
 * Ensure entity_graph_views table exists in tenant schema
 *
 * Creates the table and indexes if they don't exist.
 * Useful for existing tenants created before this feature was added.
 *
 * @async
 * @param {string} tenantSchema - Tenant schema name for multi-tenancy
 * @returns {Promise<void>}
 * @throws {Error} If database operation fails
 */
export async function ensureViewsTableExists(
  tenantSchema: string
): Promise<void> {
  validateSchema(tenantSchema);
  try {
    // Check if table exists
    const tableExists = await sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = :schema
        AND table_name = 'entity_graph_views'
      )`,
      {
        replacements: { schema: tenantSchema },
        type: QueryTypes.SELECT,
      }
    );

    if ((tableExists as any[])[0]?.exists) {
      return; // Table already exists
    }

    // Create entity_graph_views table
    await sequelize.query(
      `CREATE TABLE "${tenantSchema}".entity_graph_views (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        user_id INTEGER NOT NULL,
        organization_id INTEGER NOT NULL,
        config JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
      )`
    );

    // Create index for fetching user's views
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_views_user_${tenantSchema.replace(/[^a-z0-9]/g, "_")}
       ON "${tenantSchema}".entity_graph_views(user_id, organization_id)`
    );
  } catch (error) {
    throw new Error(
      `Failed to ensure entity_graph_views table exists: ${(error as Error).message}`
    );
  }
}

/**
 * Create and persist a new view to the database
 *
 * @async
 * @param {EntityGraphViewsModel} view - Model instance to save
 * @param {string} tenantSchema - Tenant schema name for multi-tenancy
 * @returns {Promise<EntityGraphViewsModel>} Saved view instance
 * @throws {Error} If database operation fails
 */
export async function createViewQuery(
  view: EntityGraphViewsModel,
  tenantSchema: string
): Promise<EntityGraphViewsModel> {
  validateSchema(tenantSchema);
  try {
    const result = await sequelize.query(
      `INSERT INTO "${tenantSchema}".entity_graph_views
        (name, user_id, organization_id, config, created_at, updated_at)
       VALUES (:name, :user_id, :organization_id, :config, :created_at, :updated_at)
       RETURNING id, name, user_id, organization_id, config, created_at, updated_at`,
      {
        replacements: {
          name: view.name,
          user_id: view.user_id,
          organization_id: view.organization_id,
          config: JSON.stringify(view.config),
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
      view.id = row.id;
      view.created_at = row.created_at;
      view.updated_at = row.updated_at;
    }

    return view;
  } catch (error) {
    throw new Error(`Failed to create view: ${(error as Error).message}`);
  }
}

/**
 * Fetch all views for a user in an organization
 *
 * @async
 * @param {number} userId - User ID
 * @param {number} organizationId - Organization ID
 * @param {string} tenantSchema - Tenant schema name
 * @returns {Promise<EntityGraphViewsModel[]>} Array of views
 * @throws {Error} If database operation fails
 */
export async function getViewsByUserQuery(
  userId: number,
  organizationId: number,
  tenantSchema: string
): Promise<EntityGraphViewsModel[]> {
  validateSchema(tenantSchema);
  try {
    const views = await sequelize.query(
      `SELECT id, name, user_id, organization_id, config, created_at, updated_at
       FROM "${tenantSchema}".entity_graph_views
       WHERE user_id = :user_id AND organization_id = :organization_id
       ORDER BY updated_at DESC`,
      {
        replacements: {
          user_id: userId,
          organization_id: organizationId,
        },
        type: QueryTypes.SELECT,
      }
    );

    return (views as any[]).map((row) => {
      return new EntityGraphViewsModel({
        id: row.id,
        name: row.name,
        user_id: row.user_id,
        organization_id: row.organization_id,
        config:
          typeof row.config === "string" ? JSON.parse(row.config) : row.config,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    });
  } catch (error) {
    throw new Error(`Failed to fetch views: ${(error as Error).message}`);
  }
}

/**
 * Fetch a single view by ID
 *
 * @async
 * @param {number} viewId - View ID
 * @param {string} tenantSchema - Tenant schema name
 * @returns {Promise<EntityGraphViewsModel | null>} View or null
 * @throws {Error} If database operation fails
 */
export async function getViewByIdQuery(
  viewId: number,
  tenantSchema: string
): Promise<EntityGraphViewsModel | null> {
  validateSchema(tenantSchema);
  try {
    const result = await sequelize.query(
      `SELECT id, name, user_id, organization_id, config, created_at, updated_at
       FROM "${tenantSchema}".entity_graph_views
       WHERE id = :id
       LIMIT 1`,
      {
        replacements: { id: viewId },
        type: QueryTypes.SELECT,
      }
    );

    if (result && (result as any[]).length > 0) {
      const row = (result as any[])[0];
      return new EntityGraphViewsModel({
        id: row.id,
        name: row.name,
        user_id: row.user_id,
        organization_id: row.organization_id,
        config:
          typeof row.config === "string" ? JSON.parse(row.config) : row.config,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
    }

    return null;
  } catch (error) {
    throw new Error(`Failed to fetch view: ${(error as Error).message}`);
  }
}

/**
 * Update view name and/or config in the database
 *
 * @async
 * @param {number} viewId - View ID
 * @param {string | undefined} name - New name (optional)
 * @param {EntityGraphViewConfig | undefined} config - New config (optional)
 * @param {string} tenantSchema - Tenant schema name
 * @returns {Promise<EntityGraphViewsModel | null>} Updated view
 * @throws {Error} If database operation fails
 */
export async function updateViewQuery(
  viewId: number,
  name: string | undefined,
  config: EntityGraphViewConfig | undefined,
  tenantSchema: string
): Promise<EntityGraphViewsModel | null> {
  validateSchema(tenantSchema);
  try {
    const updatedAt = new Date();

    // Build dynamic update query based on what's provided
    const updates: string[] = ["updated_at = :updated_at"];
    const replacements: any = { id: viewId, updated_at: updatedAt };

    if (name !== undefined) {
      updates.push("name = :name");
      replacements.name = name;
    }

    if (config !== undefined) {
      updates.push("config = :config");
      replacements.config = JSON.stringify(config);
    }

    await sequelize.query(
      `UPDATE "${tenantSchema}".entity_graph_views
       SET ${updates.join(", ")}
       WHERE id = :id`,
      {
        replacements,
        type: QueryTypes.UPDATE,
      }
    );

    // Fetch the updated view
    return getViewByIdQuery(viewId, tenantSchema);
  } catch (error) {
    throw new Error(`Failed to update view: ${(error as Error).message}`);
  }
}

/**
 * Delete a view from the database
 *
 * @async
 * @param {number} viewId - View ID
 * @param {string} tenantSchema - Tenant schema name
 * @returns {Promise<number>} Number of rows affected (0 or 1)
 * @throws {Error} If database operation fails
 */
export async function deleteViewByIdQuery(
  viewId: number,
  tenantSchema: string
): Promise<number> {
  validateSchema(tenantSchema);
  try {
    const result = await sequelize.query(
      `DELETE FROM "${tenantSchema}".entity_graph_views WHERE id = :id RETURNING id`,
      {
        replacements: { id: viewId },
        type: QueryTypes.SELECT,
      }
    );

    return Array.isArray(result) && result.length > 0 ? 1 : 0;
  } catch (error) {
    throw new Error(`Failed to delete view: ${(error as Error).message}`);
  }
}

/**
 * Get view count for a user
 *
 * @async
 * @param {number} userId - User ID
 * @param {number} organizationId - Organization ID
 * @param {string} tenantSchema - Tenant schema name
 * @returns {Promise<number>} Count of views
 * @throws {Error} If database operation fails
 */
export async function getViewCountByUserQuery(
  userId: number,
  organizationId: number,
  tenantSchema: string
): Promise<number> {
  validateSchema(tenantSchema);
  try {
    const result = await sequelize.query(
      `SELECT COUNT(*) as count
       FROM "${tenantSchema}".entity_graph_views
       WHERE user_id = :user_id AND organization_id = :organization_id`,
      {
        replacements: {
          user_id: userId,
          organization_id: organizationId,
        },
        type: QueryTypes.SELECT,
      }
    );

    return parseInt((result as any[])[0].count, 10) || 0;
  } catch (error) {
    throw new Error(`Failed to count views: ${(error as Error).message}`);
  }
}
