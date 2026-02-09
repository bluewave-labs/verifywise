/**
 * Shadow AI Rules Utils
 *
 * Database queries for managing Shadow AI rules and alert history.
 */

import { sequelize } from "../database/db";
import { Transaction } from "sequelize";
import {
  IShadowAiRule,
  IShadowAiAlertHistory,
} from "../domain.layer/interfaces/i.shadowAi";

/**
 * Get all rules for a tenant.
 */
export async function getAllRulesQuery(
  tenant: string
): Promise<IShadowAiRule[]> {
  const [rows] = await sequelize.query(
    `SELECT r.*,
       COALESCE(
         (SELECT json_agg(rn.user_id)
          FROM "${tenant}".shadow_ai_rule_notifications rn
          WHERE rn.rule_id = r.id),
         '[]'
       ) as notification_user_ids
     FROM "${tenant}".shadow_ai_rules r
     ORDER BY r.created_at DESC`
  );

  return (rows as any[]).map((r) => ({
    ...r,
    actions: typeof r.actions === "string" ? JSON.parse(r.actions) : r.actions,
    trigger_config:
      typeof r.trigger_config === "string"
        ? JSON.parse(r.trigger_config)
        : r.trigger_config,
    notification_user_ids:
      typeof r.notification_user_ids === "string"
        ? JSON.parse(r.notification_user_ids)
        : r.notification_user_ids || [],
  }));
}

/**
 * Get a single rule by ID.
 */
export async function getRuleByIdQuery(
  tenant: string,
  ruleId: number
): Promise<IShadowAiRule | null> {
  const [rows] = await sequelize.query(
    `SELECT r.*,
       COALESCE(
         (SELECT json_agg(rn.user_id)
          FROM "${tenant}".shadow_ai_rule_notifications rn
          WHERE rn.rule_id = r.id),
         '[]'
       ) as notification_user_ids
     FROM "${tenant}".shadow_ai_rules r
     WHERE r.id = :ruleId`,
    { replacements: { ruleId } }
  );

  const results = rows as any[];
  if (results.length === 0) return null;

  const r = results[0];
  return {
    ...r,
    actions: typeof r.actions === "string" ? JSON.parse(r.actions) : r.actions,
    trigger_config:
      typeof r.trigger_config === "string"
        ? JSON.parse(r.trigger_config)
        : r.trigger_config,
    notification_user_ids:
      typeof r.notification_user_ids === "string"
        ? JSON.parse(r.notification_user_ids)
        : r.notification_user_ids || [],
  };
}

/**
 * Create a new rule.
 */
export async function createRuleQuery(
  tenant: string,
  rule: {
    name: string;
    description?: string;
    is_active: boolean;
    trigger_type: string;
    trigger_config: Record<string, unknown>;
    actions: Array<{ type: string; assign_to?: number }>;
    created_by: number;
    notification_user_ids?: number[];
  },
  transaction?: Transaction
): Promise<IShadowAiRule> {
  const [result] = await sequelize.query(
    `INSERT INTO "${tenant}".shadow_ai_rules
       (name, description, is_active, trigger_type, trigger_config, actions, created_by)
     VALUES
       (:name, :description, :is_active, :trigger_type, :trigger_config, :actions, :created_by)
     RETURNING *`,
    {
      replacements: {
        name: rule.name,
        description: rule.description || null,
        is_active: rule.is_active,
        trigger_type: rule.trigger_type,
        trigger_config: JSON.stringify(rule.trigger_config),
        actions: JSON.stringify(rule.actions),
        created_by: rule.created_by,
      },
      ...(transaction ? { transaction } : {}),
    }
  );

  const created = (result as any[])[0];

  // Insert notification recipients
  if (rule.notification_user_ids && rule.notification_user_ids.length > 0) {
    for (const userId of rule.notification_user_ids) {
      await sequelize.query(
        `INSERT INTO "${tenant}".shadow_ai_rule_notifications (rule_id, user_id)
         VALUES (:ruleId, :userId)
         ON CONFLICT (rule_id, user_id) DO NOTHING`,
        {
          replacements: { ruleId: created.id, userId },
          ...(transaction ? { transaction } : {}),
        }
      );
    }
  }

  return {
    ...created,
    actions:
      typeof created.actions === "string"
        ? JSON.parse(created.actions)
        : created.actions,
    trigger_config:
      typeof created.trigger_config === "string"
        ? JSON.parse(created.trigger_config)
        : created.trigger_config,
    notification_user_ids: rule.notification_user_ids || [],
  };
}

/**
 * Update a rule.
 */
export async function updateRuleQuery(
  tenant: string,
  ruleId: number,
  updates: {
    name?: string;
    description?: string;
    is_active?: boolean;
    trigger_type?: string;
    trigger_config?: Record<string, unknown>;
    actions?: Array<{ type: string; assign_to?: number }>;
    notification_user_ids?: number[];
  },
  transaction?: Transaction
): Promise<IShadowAiRule | null> {
  // Build SET clause dynamically
  const setClauses: string[] = ["updated_at = NOW()"];
  const replacements: Record<string, any> = { ruleId };

  if (updates.name !== undefined) {
    setClauses.push("name = :name");
    replacements.name = updates.name;
  }
  if (updates.description !== undefined) {
    setClauses.push("description = :description");
    replacements.description = updates.description;
  }
  if (updates.is_active !== undefined) {
    setClauses.push("is_active = :is_active");
    replacements.is_active = updates.is_active;
  }
  if (updates.trigger_type !== undefined) {
    setClauses.push("trigger_type = :trigger_type");
    replacements.trigger_type = updates.trigger_type;
  }
  if (updates.trigger_config !== undefined) {
    setClauses.push("trigger_config = :trigger_config");
    replacements.trigger_config = JSON.stringify(updates.trigger_config);
  }
  if (updates.actions !== undefined) {
    setClauses.push("actions = :actions");
    replacements.actions = JSON.stringify(updates.actions);
  }

  const [rows] = await sequelize.query(
    `UPDATE "${tenant}".shadow_ai_rules
     SET ${setClauses.join(", ")}
     WHERE id = :ruleId
     RETURNING *`,
    {
      replacements,
      ...(transaction ? { transaction } : {}),
    }
  );

  const results = rows as any[];
  if (results.length === 0) return null;

  // Update notification recipients if provided
  if (updates.notification_user_ids !== undefined) {
    await sequelize.query(
      `DELETE FROM "${tenant}".shadow_ai_rule_notifications WHERE rule_id = :ruleId`,
      {
        replacements: { ruleId },
        ...(transaction ? { transaction } : {}),
      }
    );

    for (const userId of updates.notification_user_ids) {
      await sequelize.query(
        `INSERT INTO "${tenant}".shadow_ai_rule_notifications (rule_id, user_id)
         VALUES (:ruleId, :userId)
         ON CONFLICT (rule_id, user_id) DO NOTHING`,
        {
          replacements: { ruleId, userId },
          ...(transaction ? { transaction } : {}),
        }
      );
    }
  }

  const r = results[0];
  return {
    ...r,
    actions: typeof r.actions === "string" ? JSON.parse(r.actions) : r.actions,
    trigger_config:
      typeof r.trigger_config === "string"
        ? JSON.parse(r.trigger_config)
        : r.trigger_config,
    notification_user_ids: updates.notification_user_ids || [],
  };
}

/**
 * Delete a rule and its notification recipients.
 */
export async function deleteRuleQuery(
  tenant: string,
  ruleId: number,
  transaction?: Transaction
): Promise<boolean> {
  const [, rowCount] = await sequelize.query(
    `DELETE FROM "${tenant}".shadow_ai_rules WHERE id = :ruleId`,
    {
      replacements: { ruleId },
      ...(transaction ? { transaction } : {}),
    }
  );

  return (rowCount as number) > 0;
}

/**
 * Get alert history with optional filtering.
 */
export async function getAlertHistoryQuery(
  tenant: string,
  options?: {
    page?: number;
    limit?: number;
    ruleId?: number;
  }
): Promise<{ alerts: IShadowAiAlertHistory[]; total: number }> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = (page - 1) * limit;

  let whereClause = "";
  const replacements: Record<string, any> = { limit, offset };

  if (options?.ruleId) {
    whereClause = "WHERE rule_id = :ruleId";
    replacements.ruleId = options.ruleId;
  }

  const [rows] = await sequelize.query(
    `SELECT * FROM "${tenant}".shadow_ai_alert_history
     ${whereClause}
     ORDER BY fired_at DESC
     LIMIT :limit OFFSET :offset`,
    { replacements }
  );

  const [countResult] = await sequelize.query(
    `SELECT COUNT(*) as total FROM "${tenant}".shadow_ai_alert_history ${whereClause}`,
    { replacements }
  );

  return {
    alerts: (rows as any[]).map((r) => ({
      ...r,
      trigger_data:
        typeof r.trigger_data === "string"
          ? JSON.parse(r.trigger_data)
          : r.trigger_data,
      actions_taken:
        typeof r.actions_taken === "string"
          ? JSON.parse(r.actions_taken)
          : r.actions_taken,
    })),
    total: parseInt((countResult as any[])[0].total, 10),
  };
}

/**
 * Insert an alert history record.
 */
export async function insertAlertHistoryQuery(
  tenant: string,
  alert: {
    rule_id: number;
    rule_name: string;
    trigger_type: string;
    trigger_data: Record<string, unknown>;
    actions_taken: Record<string, unknown>;
  },
  transaction?: Transaction
): Promise<void> {
  await sequelize.query(
    `INSERT INTO "${tenant}".shadow_ai_alert_history
       (rule_id, rule_name, trigger_type, trigger_data, actions_taken)
     VALUES
       (:rule_id, :rule_name, :trigger_type, :trigger_data, :actions_taken)`,
    {
      replacements: {
        rule_id: alert.rule_id,
        rule_name: alert.rule_name,
        trigger_type: alert.trigger_type,
        trigger_data: JSON.stringify(alert.trigger_data),
        actions_taken: JSON.stringify(alert.actions_taken),
      },
      ...(transaction ? { transaction } : {}),
    }
  );
}

/**
 * Get active rules for a tenant (used by the rules engine during ingestion).
 */
export async function getActiveRulesQuery(
  tenant: string
): Promise<IShadowAiRule[]> {
  const [rows] = await sequelize.query(
    `SELECT r.*,
       COALESCE(
         (SELECT json_agg(rn.user_id)
          FROM "${tenant}".shadow_ai_rule_notifications rn
          WHERE rn.rule_id = r.id),
         '[]'
       ) as notification_user_ids
     FROM "${tenant}".shadow_ai_rules r
     WHERE r.is_active = true
     ORDER BY r.created_at ASC`
  );

  return (rows as any[]).map((r) => ({
    ...r,
    actions: typeof r.actions === "string" ? JSON.parse(r.actions) : r.actions,
    trigger_config:
      typeof r.trigger_config === "string"
        ? JSON.parse(r.trigger_config)
        : r.trigger_config,
    notification_user_ids:
      typeof r.notification_user_ids === "string"
        ? JSON.parse(r.notification_user_ids)
        : r.notification_user_ids || [],
  }));
}
