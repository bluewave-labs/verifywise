/**
 * Shadow AI Tools Utils
 *
 * Database queries for managing tenant shadow AI tools.
 */

import { sequelize } from "../database/db";
import { Transaction } from "sequelize";
import {
  IShadowAiTool,
  ShadowAiToolStatus,
} from "../domain.layer/interfaces/i.shadowAi";

/**
 * Get all tools for a tenant with optional filtering.
 */
export async function getAllToolsQuery(
  tenant: string,
  options?: {
    status?: ShadowAiToolStatus;
    sort?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ tools: IShadowAiTool[]; total: number }> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = (page - 1) * limit;

  let whereClause = "";
  const replacements: Record<string, any> = { limit, offset };

  if (options?.status) {
    whereClause = "WHERE status = :status";
    replacements.status = options.status;
  }

  const sortColumn =
    options?.sort === "risk"
      ? "risk_score DESC NULLS LAST"
      : options?.sort === "users"
        ? "total_users DESC"
        : options?.sort === "events"
          ? "total_events DESC"
          : options?.sort === "name"
            ? "name ASC"
            : "last_seen_at DESC NULLS LAST";

  const [tools] = await sequelize.query(
    `SELECT * FROM "${tenant}".shadow_ai_tools
     ${whereClause}
     ORDER BY ${sortColumn}
     LIMIT :limit OFFSET :offset`,
    { replacements }
  );

  const [countResult] = await sequelize.query(
    `SELECT COUNT(*) as total FROM "${tenant}".shadow_ai_tools ${whereClause}`,
    { replacements }
  );

  return {
    tools: tools as IShadowAiTool[],
    total: parseInt((countResult as any[])[0].total, 10),
  };
}

/**
 * Get a single tool by ID with department breakdown.
 */
export async function getToolByIdQuery(
  tenant: string,
  toolId: number
): Promise<IShadowAiTool | null> {
  const [rows] = await sequelize.query(
    `SELECT * FROM "${tenant}".shadow_ai_tools WHERE id = :toolId`,
    { replacements: { toolId } }
  );

  const tools = rows as IShadowAiTool[];
  return tools.length > 0 ? tools[0] : null;
}

/**
 * Get department breakdown for a tool.
 */
export async function getToolDepartmentsQuery(
  tenant: string,
  toolId: number
): Promise<Array<{ department: string; user_count: number; event_count: number }>> {
  const [rows] = await sequelize.query(
    `SELECT
       COALESCE(department, 'Unknown') as department,
       COUNT(DISTINCT user_email) as user_count,
       COUNT(*) as event_count
     FROM "${tenant}".shadow_ai_events
     WHERE detected_tool_id = :toolId
       AND event_timestamp > NOW() - INTERVAL '30 days'
     GROUP BY department
     ORDER BY event_count DESC`,
    { replacements: { toolId } }
  );

  return rows as any[];
}

/**
 * Get top users for a tool.
 */
export async function getToolTopUsersQuery(
  tenant: string,
  toolId: number,
  limit: number = 10
): Promise<Array<{ user_email: string; event_count: number; last_used: string }>> {
  const [rows] = await sequelize.query(
    `SELECT
       user_email,
       COUNT(*) as event_count,
       MAX(event_timestamp) as last_used
     FROM "${tenant}".shadow_ai_events
     WHERE detected_tool_id = :toolId
       AND event_timestamp > NOW() - INTERVAL '30 days'
     GROUP BY user_email
     ORDER BY event_count DESC
     LIMIT :limit`,
    { replacements: { toolId, limit } }
  );

  return rows as any[];
}

/**
 * Update tool status.
 */
export async function updateToolStatusQuery(
  tenant: string,
  toolId: number,
  status: ShadowAiToolStatus,
  transaction?: Transaction
): Promise<IShadowAiTool | null> {
  const [rows] = await sequelize.query(
    `UPDATE "${tenant}".shadow_ai_tools
     SET status = :status, updated_at = NOW()
     WHERE id = :toolId
     RETURNING *`,
    {
      replacements: { toolId, status },
      ...(transaction ? { transaction } : {}),
    }
  );

  const tools = rows as IShadowAiTool[];
  return tools.length > 0 ? tools[0] : null;
}

/**
 * Link a tool to a model inventory entry.
 */
export async function linkToolToModelInventoryQuery(
  tenant: string,
  toolId: number,
  modelInventoryId: number,
  riskEntryId?: number,
  transaction?: Transaction
): Promise<void> {
  await sequelize.query(
    `UPDATE "${tenant}".shadow_ai_tools
     SET model_inventory_id = :modelInventoryId,
         risk_entry_id = :riskEntryId,
         updated_at = NOW()
     WHERE id = :toolId`,
    {
      replacements: {
        toolId,
        modelInventoryId,
        riskEntryId: riskEntryId || null,
      },
      ...(transaction ? { transaction } : {}),
    }
  );
}
