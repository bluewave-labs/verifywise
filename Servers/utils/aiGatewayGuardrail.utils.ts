/**
 * AI Gateway Guardrail Utils
 *
 * Database queries for guardrail rules, settings, and logs.
 */

import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";

// ─── Guardrail Rules ─────────────────────────────────────────────────────────

export async function getAllGuardrailsQuery(organizationId: number) {
  const rows = await sequelize.query(
    `SELECT id, organization_id, guardrail_type, name, config, scope, action,
            is_active, created_by, created_at, updated_at
     FROM ai_gateway_guardrails
     WHERE organization_id = :organizationId
     ORDER BY guardrail_type, created_at`,
    { replacements: { organizationId }, type: QueryTypes.SELECT }
  );
  return rows;
}

export async function getActiveGuardrailsQuery(organizationId: number) {
  const rows = await sequelize.query(
    `SELECT id, guardrail_type, name, config, scope, action, is_active
     FROM ai_gateway_guardrails
     WHERE organization_id = :organizationId AND is_active = true
     ORDER BY guardrail_type`,
    { replacements: { organizationId }, type: QueryTypes.SELECT }
  );
  return rows;
}

export async function createGuardrailQuery(
  organizationId: number,
  data: {
    guardrail_type: string;
    name: string;
    config: object;
    scope?: string;
    action?: string;
    is_active?: boolean;
    created_by?: number;
  }
) {
  const [rows] = await sequelize.query(
    `INSERT INTO ai_gateway_guardrails
       (organization_id, guardrail_type, name, config, scope, action, is_active, created_by)
     VALUES
       (:organizationId, :guardrail_type, :name, :config, :scope, :action, :is_active, :created_by)
     RETURNING *`,
    {
      replacements: {
        organizationId,
        guardrail_type: data.guardrail_type,
        name: data.name,
        config: JSON.stringify(data.config),
        scope: data.scope || "input",
        action: data.action || "block",
        is_active: data.is_active !== false,
        created_by: data.created_by || null,
      },
    }
  );
  return (rows as any[])[0];
}

export async function updateGuardrailQuery(
  organizationId: number,
  id: number,
  data: Record<string, any>
) {
  const fields: string[] = [];
  const replacements: Record<string, any> = { organizationId, id };

  if (data.name !== undefined) {
    fields.push("name = :name");
    replacements.name = data.name;
  }
  if (data.config !== undefined) {
    fields.push("config = :config");
    replacements.config = JSON.stringify(data.config);
  }
  if (data.scope !== undefined) {
    fields.push("scope = :scope");
    replacements.scope = data.scope;
  }
  if (data.action !== undefined) {
    fields.push("action = :action");
    replacements.action = data.action;
  }
  if (data.is_active !== undefined) {
    fields.push("is_active = :is_active");
    replacements.is_active = data.is_active;
  }

  if (fields.length === 0) return null;
  fields.push("updated_at = NOW()");

  const [rows] = await sequelize.query(
    `UPDATE ai_gateway_guardrails SET ${fields.join(", ")}
     WHERE organization_id = :organizationId AND id = :id
     RETURNING *`,
    { replacements }
  );
  return (rows as any[])[0] || null;
}

export async function deleteGuardrailQuery(organizationId: number, id: number) {
  const [rows] = await sequelize.query(
    `DELETE FROM ai_gateway_guardrails
     WHERE organization_id = :organizationId AND id = :id
     RETURNING id`,
    { replacements: { organizationId, id } }
  );
  return (rows as any[]).length > 0;
}

// ─── Guardrail Settings ──────────────────────────────────────────────────────

export async function getGuardrailSettingsQuery(organizationId: number) {
  const rows = await sequelize.query(
    `SELECT * FROM ai_gateway_guardrail_settings
     WHERE organization_id = :organizationId`,
    { replacements: { organizationId }, type: QueryTypes.SELECT }
  );
  return (rows as any[])[0] || null;
}

export async function upsertGuardrailSettingsQuery(
  organizationId: number,
  data: Record<string, any>
) {
  const [rows] = await sequelize.query(
    `INSERT INTO ai_gateway_guardrail_settings
       (organization_id, pii_on_error, content_filter_on_error,
        pii_replacement_format, content_filter_replacement, log_retention_days)
     VALUES
       (:organizationId, :pii_on_error, :content_filter_on_error,
        :pii_replacement_format, :content_filter_replacement, :log_retention_days)
     ON CONFLICT (organization_id) DO UPDATE SET
       pii_on_error = EXCLUDED.pii_on_error,
       content_filter_on_error = EXCLUDED.content_filter_on_error,
       pii_replacement_format = EXCLUDED.pii_replacement_format,
       content_filter_replacement = EXCLUDED.content_filter_replacement,
       log_retention_days = EXCLUDED.log_retention_days,
       updated_at = NOW()
     RETURNING *`,
    {
      replacements: {
        organizationId,
        pii_on_error: data.pii_on_error || "block",
        content_filter_on_error: data.content_filter_on_error || "allow",
        pii_replacement_format: data.pii_replacement_format || "<ENTITY_TYPE>",
        content_filter_replacement: data.content_filter_replacement || "[REDACTED]",
        log_retention_days: data.log_retention_days ?? 90,
      },
    }
  );
  return (rows as any[])[0];
}

// ─── Guardrail Logs ──────────────────────────────────────────────────────────

export async function insertGuardrailLogQuery(
  organizationId: number,
  data: {
    guardrail_id?: number;
    endpoint_id?: number;
    user_id?: number;
    guardrail_type: string;
    action_taken: string;
    matched_text?: string;
    entity_type?: string;
    execution_time_ms?: number;
  }
) {
  await sequelize.query(
    `INSERT INTO ai_gateway_guardrail_logs
       (organization_id, guardrail_id, endpoint_id, user_id,
        guardrail_type, action_taken, matched_text, entity_type, execution_time_ms)
     VALUES
       (:organizationId, :guardrail_id, :endpoint_id, :user_id,
        :guardrail_type, :action_taken, :matched_text, :entity_type, :execution_time_ms)`,
    {
      replacements: {
        organizationId,
        guardrail_id: data.guardrail_id || null,
        endpoint_id: data.endpoint_id || null,
        user_id: data.user_id || null,
        guardrail_type: data.guardrail_type,
        action_taken: data.action_taken,
        matched_text: data.matched_text || null,
        entity_type: data.entity_type || null,
        execution_time_ms: data.execution_time_ms || null,
      },
    }
  );
}

export async function getGuardrailLogsQuery(
  organizationId: number,
  limit: number = 50,
  offset: number = 0
) {
  const rows = await sequelize.query(
    `SELECT gl.*, g.name AS guardrail_name
     FROM ai_gateway_guardrail_logs gl
     LEFT JOIN ai_gateway_guardrails g ON g.id = gl.guardrail_id
     WHERE gl.organization_id = :organizationId
     ORDER BY gl.created_at DESC
     LIMIT :limit OFFSET :offset`,
    {
      replacements: { organizationId, limit, offset },
      type: QueryTypes.SELECT,
    }
  );
  return rows;
}

export async function getGuardrailStatsQuery(
  organizationId: number,
  startDate: string,
  endDate: string
) {
  const rows = await sequelize.query(
    `SELECT
       COUNT(*) FILTER (WHERE action_taken = 'blocked') AS blocked_count,
       COUNT(*) FILTER (WHERE action_taken = 'masked') AS masked_count,
       COUNT(*) FILTER (WHERE action_taken = 'allowed') AS allowed_count,
       COUNT(*) AS total_checks
     FROM ai_gateway_guardrail_logs
     WHERE organization_id = :organizationId
       AND created_at >= :startDate
       AND created_at <= :endDate`,
    {
      replacements: { organizationId, startDate, endDate },
      type: QueryTypes.SELECT,
    }
  );
  return (rows as any[])[0] || { blocked_count: 0, masked_count: 0, allowed_count: 0, total_checks: 0 };
}

export async function getGuardrailStatsByTypeQuery(
  organizationId: number,
  startDate: string,
  endDate: string
) {
  const rows = await sequelize.query(
    `SELECT
       guardrail_type,
       action_taken,
       COUNT(*) AS count
     FROM ai_gateway_guardrail_logs
     WHERE organization_id = :organizationId
       AND created_at >= :startDate
       AND created_at <= :endDate
     GROUP BY guardrail_type, action_taken
     ORDER BY guardrail_type`,
    {
      replacements: { organizationId, startDate, endDate },
      type: QueryTypes.SELECT,
    }
  );
  return rows;
}

export async function getGuardrailStatsByDayQuery(
  organizationId: number,
  startDate: string,
  endDate: string
) {
  const rows = await sequelize.query(
    `SELECT
       DATE(created_at) AS day,
       COUNT(*) FILTER (WHERE action_taken = 'blocked') AS blocked,
       COUNT(*) FILTER (WHERE action_taken = 'masked') AS masked,
       COUNT(*) AS total
     FROM ai_gateway_guardrail_logs
     WHERE organization_id = :organizationId
       AND created_at >= :startDate
       AND created_at <= :endDate
     GROUP BY DATE(created_at)
     ORDER BY day`,
    {
      replacements: { organizationId, startDate, endDate },
      type: QueryTypes.SELECT,
    }
  );
  return rows;
}

export async function purgeGuardrailLogsQuery(
  organizationId: number,
  retentionDays: number
) {
  const [, meta] = await sequelize.query(
    `DELETE FROM ai_gateway_guardrail_logs
     WHERE organization_id = :organizationId
       AND created_at < NOW() - (:days || ' days')::interval`,
    { replacements: { organizationId, days: retentionDays } }
  );
  return (meta as any)?.rowCount || 0;
}
