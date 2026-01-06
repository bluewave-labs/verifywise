/**
 * @file workspace.utils.ts
 * @description Utility functions for performing CRUD operations on the 'workspaces' table.
 *
 * Functions included:
 * - `getAllWorkspacesQuery`: Fetches all workspaces from the database.
 * - `getWorkspaceByIdQuery`: Fetches a workspace by its ID.
 * - `getWorkspaceBySlugQuery`: Fetches a workspace by its slug.
 * - `getWorkspacesByOrgIdQuery`: Fetches all workspaces for an organization.
 * - `createWorkspaceQuery`: Creates a new workspace in the database.
 * - `updateWorkspaceByIdQuery`: Updates workspace details by its ID.
 * - `archiveWorkspaceByIdQuery`: Soft deletes a workspace by setting is_active to false.
 * - `getWorkspaceSchemaQuery`: Gets the schema_name for a workspace.
 * - `checkSlugExistsQuery`: Checks if a slug already exists.
 * - `checkSchemaExistsQuery`: Checks if a PostgreSQL schema exists.
 *
 * @module utils/workspace.utils
 */

import { WorkspaceModel } from "../domain.layer/models/workspace/workspace.model";
import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";

/**
 * Retrieves all workspaces from the database.
 *
 * @param {boolean} includeInactive - Whether to include inactive (archived) workspaces.
 * @param {Transaction | null} transaction - Optional transaction for database operations.
 * @returns {Promise<WorkspaceModel[]>} Array of workspace objects.
 */
export const getAllWorkspacesQuery = async (
  includeInactive: boolean = false,
  transaction: Transaction | null = null
): Promise<WorkspaceModel[]> => {
  const whereClause = includeInactive ? "" : "WHERE is_active = true";
  const workspaces = await sequelize.query(
    `SELECT * FROM workspaces ${whereClause} ORDER BY created_at DESC, id ASC`,
    {
      mapToModel: true,
      model: WorkspaceModel,
      ...(transaction && { transaction }),
    }
  );
  return workspaces;
};

/**
 * Retrieves a workspace by its unique identifier.
 *
 * @param {number} id - The unique identifier of the workspace.
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<WorkspaceModel | null>} The workspace object or null if not found.
 */
export const getWorkspaceByIdQuery = async (
  id: number,
  transaction: Transaction | null = null
): Promise<WorkspaceModel | null> => {
  const result = await sequelize.query(
    "SELECT * FROM workspaces WHERE id = :id",
    {
      replacements: { id },
      mapToModel: true,
      model: WorkspaceModel,
      ...(transaction && { transaction }),
    }
  );
  return result[0] || null;
};

/**
 * Retrieves a workspace by its slug.
 *
 * @param {string} slug - The unique slug of the workspace.
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<WorkspaceModel | null>} The workspace object or null if not found.
 */
export const getWorkspaceBySlugQuery = async (
  slug: string,
  transaction: Transaction | null = null
): Promise<WorkspaceModel | null> => {
  const result = await sequelize.query(
    "SELECT * FROM workspaces WHERE slug = :slug",
    {
      replacements: { slug },
      mapToModel: true,
      model: WorkspaceModel,
      ...(transaction && { transaction }),
    }
  );
  return result[0] || null;
};

/**
 * Retrieves all workspaces for a specific organization.
 *
 * @param {number} orgId - The organization ID.
 * @param {boolean} includeInactive - Whether to include inactive workspaces.
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<WorkspaceModel[]>} Array of workspace objects.
 */
export const getWorkspacesByOrgIdQuery = async (
  orgId: number,
  includeInactive: boolean = false,
  transaction: Transaction | null = null
): Promise<WorkspaceModel[]> => {
  const activeClause = includeInactive ? "" : "AND is_active = true";
  const workspaces = await sequelize.query(
    `SELECT * FROM workspaces WHERE org_id = :orgId ${activeClause} ORDER BY created_at DESC`,
    {
      replacements: { orgId },
      mapToModel: true,
      model: WorkspaceModel,
      ...(transaction && { transaction }),
    }
  );
  return workspaces;
};

/**
 * Creates a new workspace in the database.
 *
 * @param {Partial<WorkspaceModel>} workspace - The workspace data to create.
 * @param {Transaction} transaction - The transaction for database operations.
 * @returns {Promise<WorkspaceModel>} The newly created workspace object.
 */
export const createWorkspaceQuery = async (
  workspace: Partial<WorkspaceModel>,
  transaction: Transaction
): Promise<WorkspaceModel> => {
  const result = await sequelize.query(
    `INSERT INTO workspaces(
      org_id, name, slug, schema_name,
      oidc_enabled, oidc_issuer, oidc_client_id, oidc_client_secret_encrypted,
      is_active, created_at, updated_at
    ) VALUES (
      :org_id, :name, :slug, :schema_name,
      :oidc_enabled, :oidc_issuer, :oidc_client_id, :oidc_client_secret_encrypted,
      :is_active, :created_at, :updated_at
    ) RETURNING *`,
    {
      replacements: {
        org_id: workspace.org_id,
        name: workspace.name,
        slug: workspace.slug,
        schema_name: workspace.schema_name,
        oidc_enabled: workspace.oidc_enabled || false,
        oidc_issuer: workspace.oidc_issuer || null,
        oidc_client_id: workspace.oidc_client_id || null,
        oidc_client_secret_encrypted: workspace.oidc_client_secret_encrypted || null,
        is_active: workspace.is_active !== undefined ? workspace.is_active : true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      mapToModel: true,
      model: WorkspaceModel,
      transaction,
    }
  );
  return result[0];
};

/**
 * Updates a workspace by its ID.
 *
 * @param {number} id - The ID of the workspace to update.
 * @param {Partial<WorkspaceModel>} workspace - The workspace data to update.
 * @param {Transaction} transaction - The transaction for database operations.
 * @returns {Promise<WorkspaceModel | null>} The updated workspace or null if not found.
 */
export const updateWorkspaceByIdQuery = async (
  id: number,
  workspace: Partial<WorkspaceModel>,
  transaction: Transaction
): Promise<WorkspaceModel | null> => {
  const updateFields: Partial<Record<keyof WorkspaceModel, any>> = {};
  const allowedFields = [
    "name",
    "slug",
    "oidc_enabled",
    "oidc_issuer",
    "oidc_client_id",
    "oidc_client_secret_encrypted",
    "is_active",
  ];

  const setClause = allowedFields
    .filter((field) => {
      if (workspace[field as keyof WorkspaceModel] !== undefined) {
        updateFields[field as keyof WorkspaceModel] =
          workspace[field as keyof WorkspaceModel];
        return true;
      }
      return false;
    })
    .map((field) => `${field} = :${field}`)
    .join(", ");

  if (!setClause) {
    return getWorkspaceByIdQuery(id, transaction);
  }

  updateFields.id = id;
  updateFields.updated_at = new Date();

  const query = `UPDATE workspaces SET ${setClause}, updated_at = :updated_at WHERE id = :id RETURNING *`;

  const result = await sequelize.query(query, {
    replacements: updateFields,
    mapToModel: true,
    model: WorkspaceModel,
    transaction,
  });

  return result[0] || null;
};

/**
 * Archives (soft deletes) a workspace by setting is_active to false.
 *
 * @param {number} id - The ID of the workspace to archive.
 * @param {Transaction} transaction - The transaction for database operations.
 * @returns {Promise<WorkspaceModel | null>} The archived workspace or null if not found.
 */
export const archiveWorkspaceByIdQuery = async (
  id: number,
  transaction: Transaction
): Promise<WorkspaceModel | null> => {
  const result = await sequelize.query(
    `UPDATE workspaces SET is_active = false, updated_at = :updated_at WHERE id = :id RETURNING *`,
    {
      replacements: { id, updated_at: new Date() },
      mapToModel: true,
      model: WorkspaceModel,
      transaction,
    }
  );
  return result[0] || null;
};

/**
 * Gets the schema name for a workspace by its ID.
 *
 * @param {number} workspaceId - The workspace ID.
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<string | null>} The schema name or null if not found.
 */
export const getWorkspaceSchemaQuery = async (
  workspaceId: number,
  transaction: Transaction | null = null
): Promise<string | null> => {
  const result = await sequelize.query(
    "SELECT schema_name FROM workspaces WHERE id = :workspaceId AND is_active = true",
    {
      replacements: { workspaceId },
      type: QueryTypes.SELECT,
      ...(transaction && { transaction }),
    }
  ) as { schema_name: string }[];

  return result[0]?.schema_name || null;
};

/**
 * Checks if a slug already exists in the database.
 *
 * @param {string} slug - The slug to check.
 * @param {number | null} excludeId - Optional workspace ID to exclude from check (for updates).
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<boolean>} True if slug exists, false otherwise.
 */
export const checkSlugExistsQuery = async (
  slug: string,
  excludeId: number | null = null,
  transaction: Transaction | null = null
): Promise<boolean> => {
  const excludeClause = excludeId ? "AND id != :excludeId" : "";
  const result = await sequelize.query(
    `SELECT COUNT(*) as count FROM workspaces WHERE slug = :slug ${excludeClause}`,
    {
      replacements: { slug, excludeId },
      type: QueryTypes.SELECT,
      ...(transaction && { transaction }),
    }
  ) as { count: string }[];

  return parseInt(result[0].count, 10) > 0;
};

/**
 * Checks if a PostgreSQL schema already exists.
 *
 * @param {string} schemaName - The schema name to check.
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<boolean>} True if schema exists, false otherwise.
 */
export const checkSchemaExistsQuery = async (
  schemaName: string,
  transaction: Transaction | null = null
): Promise<boolean> => {
  const result = await sequelize.query(
    `SELECT COUNT(*) as count FROM information_schema.schemata WHERE schema_name = :schemaName`,
    {
      replacements: { schemaName },
      type: QueryTypes.SELECT,
      ...(transaction && { transaction }),
    }
  ) as { count: string }[];

  return parseInt(result[0].count, 10) > 0;
};

/**
 * Gets active workspaces count for an organization.
 *
 * @param {number} orgId - The organization ID.
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<number>} Count of active workspaces.
 */
export const getWorkspaceCountByOrgQuery = async (
  orgId: number,
  transaction: Transaction | null = null
): Promise<number> => {
  const result = await sequelize.query(
    `SELECT COUNT(*) as count FROM workspaces WHERE org_id = :orgId AND is_active = true`,
    {
      replacements: { orgId },
      type: QueryTypes.SELECT,
      ...(transaction && { transaction }),
    }
  ) as { count: string }[];

  return parseInt(result[0].count, 10);
};
