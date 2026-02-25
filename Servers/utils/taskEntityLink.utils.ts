import { QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../database/db";

/**
 * Valid entity types for task entity links
 */
export const VALID_ENTITY_TYPES = [
  "vendor",
  "model",
  "policy",
  "nist_subcategory",
  "iso42001_subclause",
  "iso42001_annexcategory",
  "iso27001_subclause",
  "iso27001_annexcontrol",
  "eu_control",
  "eu_subcontrol",
] as const;

export type EntityType = (typeof VALID_ENTITY_TYPES)[number];

export interface ITaskEntityLink {
  id?: number;
  task_id: number;
  entity_id: number;
  entity_type: EntityType;
  created_at?: Date;
  updated_at?: Date;
}

export interface ITaskEntityLinkWithDetails extends ITaskEntityLink {
  entity_name?: string;
  entity_title?: string;
}

/**
 * Validate that an entity type is valid
 */
export function isValidEntityType(type: string): type is EntityType {
  return VALID_ENTITY_TYPES.includes(type as EntityType);
}

/**
 * Get the table name for an entity type
 */
function getEntityTableName(entityType: EntityType): string {
  const tableMap: Record<EntityType, string> = {
    vendor: "vendors",
    model: "model_inventories",
    policy: "policy_manager",
    nist_subcategory: "nist_ai_rmf_subcategories",
    iso42001_subclause: "subclauses_iso",
    iso42001_annexcategory: "annexcategories_iso",
    iso27001_subclause: "subclauses_iso27001",
    iso27001_annexcontrol: "annexcontrols_iso27001",
    eu_control: "controls_eu",
    eu_subcontrol: "subcontrols_eu",
  };
  return tableMap[entityType];
}

/**
 * Get the name/title column for an entity type
 */
function getEntityNameColumn(entityType: EntityType): string {
  const columnMap: Record<EntityType, string> = {
    vendor: "vendor_name",
    model: "model",
    policy: "title",
    nist_subcategory: "title",
    iso42001_subclause: "implementation_description",
    iso42001_annexcategory: "implementation_description",
    iso27001_subclause: "implementation_description",
    iso27001_annexcontrol: "implementation_description",
    eu_control: "implementation_details",
    eu_subcontrol: "implementation_details",
  };
  return columnMap[entityType];
}

/**
 * Check if an entity exists
 */
export async function entityExistsQuery(
  entityId: number,
  entityType: EntityType,
  tenantHash: string,
  transaction?: Transaction
): Promise<boolean> {
  const tableName = getEntityTableName(entityType);

  const result = await sequelize.query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM "${tenantHash}".${tableName} WHERE id = :entityId) as exists`,
    {
      replacements: { entityId },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return result[0]?.exists ?? false;
}

/**
 * Create a task entity link
 */
export async function createTaskEntityLinkQuery(
  link: Omit<ITaskEntityLink, "id" | "created_at" | "updated_at"> & { entity_name?: string },
  tenantHash: string,
  transaction?: Transaction
): Promise<ITaskEntityLink> {
  const result = await sequelize.query<ITaskEntityLink>(
    `INSERT INTO "${tenantHash}".task_entity_links (task_id, entity_id, entity_type, entity_name, created_at, updated_at)
     VALUES (:task_id, :entity_id, :entity_type, :entity_name, NOW(), NOW())
     RETURNING *`,
    {
      replacements: {
        task_id: link.task_id,
        entity_id: link.entity_id,
        entity_type: link.entity_type,
        entity_name: link.entity_name || null,
      },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return result[0];
}

/**
 * Get all entity links for a task
 */
export async function getTaskEntityLinksQuery(
  taskId: number,
  tenantHash: string,
  transaction?: Transaction
): Promise<ITaskEntityLinkWithDetails[]> {
  const links = await sequelize.query<ITaskEntityLink & { entity_name?: string }>(
    `SELECT * FROM "${tenantHash}".task_entity_links
     WHERE task_id = :taskId
     ORDER BY created_at DESC`,
    {
      replacements: { taskId },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  // Enrich each link with entity details (only if entity_name not already stored)
  const enrichedLinks: ITaskEntityLinkWithDetails[] = [];
  for (const link of links) {
    // If entity_name is already stored, use it
    if (link.entity_name) {
      enrichedLinks.push({
        ...link,
        entity_name: link.entity_name,
      });
      continue;
    }

    // Otherwise, fetch from entity table with special handling for complex types
    try {
      let entityName: string | null = null;

      // Special handling for NIST subcategories to build detailed name
      if (link.entity_type === "nist_subcategory") {
        // Functions and categories are in public schema, subcategories in tenant schema
        const nistResult = await sequelize.query<{
          sub_title: string;
          sub_index: number;
          cat_index: number;
          func_type: string;
        }>(
          `SELECT
            s.title as sub_title,
            s.index as sub_index,
            c.index as cat_index,
            f.type as func_type
          FROM "${tenantHash}".nist_ai_rmf_subcategories s
          JOIN public.nist_ai_rmf_categories c ON s.category_id = c.id
          JOIN public.nist_ai_rmf_functions f ON c.function_id = f.id
          WHERE s.id = :entityId`,
          {
            replacements: { entityId: link.entity_id },
            type: QueryTypes.SELECT,
            transaction,
          }
        );
        if (nistResult[0]) {
          const { func_type, cat_index, sub_index, sub_title } = nistResult[0];
          // Build detailed name like "GOVERN 1.1: Subcategory description"
          const funcUpper = func_type?.toUpperCase() || "FUNC";
          const catNum = cat_index || 1;
          const subNum = sub_index || 1;
          const titlePart = sub_title ? `: ${sub_title.substring(0, 50)}${sub_title.length > 50 ? "..." : ""}` : "";
          entityName = `${funcUpper} ${catNum}.${subNum}${titlePart}`.trim();
        }
      } else {
        // Default handling for other entity types
        const tableName = getEntityTableName(link.entity_type);
        const nameColumn = getEntityNameColumn(link.entity_type);
        const entityResult = await sequelize.query<{ name: string }>(
          `SELECT ${nameColumn} as name FROM "${tenantHash}".${tableName} WHERE id = :entityId`,
          {
            replacements: { entityId: link.entity_id },
            type: QueryTypes.SELECT,
            transaction,
          }
        );
        entityName = entityResult[0]?.name || null;
      }

      enrichedLinks.push({
        ...link,
        entity_name: entityName || `${link.entity_type} #${link.entity_id}`,
      });
    } catch {
      // If entity doesn't exist anymore, still include the link
      enrichedLinks.push({
        ...link,
        entity_name: `${link.entity_type} #${link.entity_id} (deleted)`,
      });
    }
  }

  return enrichedLinks;
}

/**
 * Delete a task entity link
 */
export async function deleteTaskEntityLinkQuery(
  linkId: number,
  taskId: number,
  tenantHash: string,
  transaction?: Transaction
): Promise<boolean> {
  const result = await sequelize.query(
    `DELETE FROM "${tenantHash}".task_entity_links
     WHERE id = :linkId AND task_id = :taskId
     RETURNING *`,
    {
      replacements: { linkId, taskId },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return result.length > 0;
}

/**
 * Delete all entity links for a task
 */
export async function deleteAllTaskEntityLinksQuery(
  taskId: number,
  tenantHash: string,
  transaction?: Transaction
): Promise<number> {
  const result = await sequelize.query(
    `DELETE FROM "${tenantHash}".task_entity_links WHERE task_id = :taskId`,
    {
      replacements: { taskId },
      type: QueryTypes.DELETE,
      transaction,
    }
  );

  return (result as unknown as [unknown, number])[1];
}

/**
 * Check if a link already exists
 */
export async function linkExistsQuery(
  taskId: number,
  entityId: number,
  entityType: EntityType,
  tenantHash: string,
  transaction?: Transaction
): Promise<boolean> {
  const result = await sequelize.query<{ exists: boolean }>(
    `SELECT EXISTS(
      SELECT 1 FROM "${tenantHash}".task_entity_links
      WHERE task_id = :taskId AND entity_id = :entityId AND entity_type = :entityType
    ) as exists`,
    {
      replacements: { taskId, entityId, entityType },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return result[0]?.exists ?? false;
}

/**
 * Get all tasks linked to a specific entity
 */
export async function getTasksForEntityQuery(
  entityId: number,
  entityType: EntityType,
  tenantHash: string,
  transaction?: Transaction
): Promise<number[]> {
  const result = await sequelize.query<{ task_id: number }>(
    `SELECT task_id FROM "${tenantHash}".task_entity_links
     WHERE entity_id = :entityId AND entity_type = :entityType`,
    {
      replacements: { entityId, entityType },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return result.map((r) => r.task_id);
}
