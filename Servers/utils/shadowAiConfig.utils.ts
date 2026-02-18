/**
 * Shadow AI Configuration Utils
 *
 * Database queries for syslog config and department sensitivity.
 */

import { sequelize } from "../database/db";
import { Transaction } from "sequelize";
import { IShadowAiSyslogConfig, IShadowAiSettings } from "../domain.layer/interfaces/i.shadowAi";

// ─── Syslog Config ─────────────────────────────────────────────────────

/**
 * Get all syslog configurations for a tenant.
 */
export async function getSyslogConfigsQuery(
  tenant: string
): Promise<IShadowAiSyslogConfig[]> {
  const [rows] = await sequelize.query(
    `SELECT * FROM "${tenant}".shadow_ai_syslog_config
     ORDER BY created_at DESC`
  );

  return rows as IShadowAiSyslogConfig[];
}

/**
 * Create a new syslog configuration.
 */
export async function createSyslogConfigQuery(
  tenant: string,
  config: {
    source_identifier: string;
    parser_type: string;
    is_active: boolean;
  },
  transaction?: Transaction
): Promise<IShadowAiSyslogConfig> {
  const [result] = await sequelize.query(
    `INSERT INTO "${tenant}".shadow_ai_syslog_config
       (source_identifier, parser_type, is_active)
     VALUES
       (:source_identifier, :parser_type, :is_active)
     RETURNING *`,
    {
      replacements: {
        source_identifier: config.source_identifier,
        parser_type: config.parser_type,
        is_active: config.is_active,
      },
      ...(transaction ? { transaction } : {}),
    }
  );

  return (result as IShadowAiSyslogConfig[])[0];
}

/**
 * Update a syslog configuration.
 */
export async function updateSyslogConfigQuery(
  tenant: string,
  configId: number,
  updates: {
    source_identifier?: string;
    parser_type?: string;
    is_active?: boolean;
  },
  transaction?: Transaction
): Promise<IShadowAiSyslogConfig | null> {
  const setClauses: string[] = [];
  const replacements: Record<string, unknown> = { configId };

  if (updates.source_identifier !== undefined) {
    setClauses.push("source_identifier = :source_identifier");
    replacements.source_identifier = updates.source_identifier;
  }
  if (updates.parser_type !== undefined) {
    setClauses.push("parser_type = :parser_type");
    replacements.parser_type = updates.parser_type;
  }
  if (updates.is_active !== undefined) {
    setClauses.push("is_active = :is_active");
    replacements.is_active = updates.is_active;
  }

  if (setClauses.length === 0) return null;

  const [result] = await sequelize.query(
    `UPDATE "${tenant}".shadow_ai_syslog_config
     SET ${setClauses.join(", ")}
     WHERE id = :configId
     RETURNING *`,
    {
      replacements,
      ...(transaction ? { transaction } : {}),
    }
  );

  const rows = result as IShadowAiSyslogConfig[];
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Delete a syslog configuration.
 */
export async function deleteSyslogConfigQuery(
  tenant: string,
  configId: number,
  transaction?: Transaction
): Promise<boolean> {
  const [rows] = await sequelize.query(
    `DELETE FROM "${tenant}".shadow_ai_syslog_config WHERE id = :configId
     RETURNING id`,
    {
      replacements: { configId },
      ...(transaction ? { transaction } : {}),
    }
  );

  return (rows as any[]).length > 0;
}

// ─── Settings ──────────────────────────────────────────────────────

/**
 * Get tenant settings (always returns a row — created by migration).
 */
export async function getSettingsQuery(
  tenant: string
): Promise<IShadowAiSettings> {
  const [rows] = await sequelize.query(
    `SELECT * FROM "${tenant}".shadow_ai_settings WHERE id = 1`
  );

  // Return defaults if no row exists yet
  if ((rows as any[]).length === 0) {
    return {
      rate_limit_max_events_per_hour: 0,
      retention_events_days: 30,
      retention_daily_rollups_days: 365,
      retention_alert_history_days: 90,
    };
  }

  return (rows as IShadowAiSettings[])[0];
}

/**
 * Update tenant settings.
 */
export async function updateSettingsQuery(
  tenant: string,
  updates: Partial<Omit<IShadowAiSettings, "id" | "updated_at">>,
  transaction?: Transaction
): Promise<IShadowAiSettings> {
  const setClauses: string[] = ["updated_at = NOW()"];
  const replacements: Record<string, unknown> = {};

  if (updates.rate_limit_max_events_per_hour !== undefined) {
    setClauses.push("rate_limit_max_events_per_hour = :rate_limit");
    replacements.rate_limit = Math.max(0, updates.rate_limit_max_events_per_hour);
  }
  if (updates.retention_events_days !== undefined) {
    setClauses.push("retention_events_days = :ret_events");
    replacements.ret_events = Math.max(0, updates.retention_events_days);
  }
  if (updates.retention_daily_rollups_days !== undefined) {
    setClauses.push("retention_daily_rollups_days = :ret_rollups");
    replacements.ret_rollups = Math.max(0, updates.retention_daily_rollups_days);
  }
  if (updates.retention_alert_history_days !== undefined) {
    setClauses.push("retention_alert_history_days = :ret_alerts");
    replacements.ret_alerts = Math.max(0, updates.retention_alert_history_days);
  }
  if (updates.updated_by !== undefined) {
    setClauses.push("updated_by = :updated_by");
    replacements.updated_by = updates.updated_by;
  }

  const [result] = await sequelize.query(
    `UPDATE "${tenant}".shadow_ai_settings
     SET ${setClauses.join(", ")}
     WHERE id = 1
     RETURNING *`,
    {
      replacements,
      ...(transaction ? { transaction } : {}),
    }
  );

  return (result as IShadowAiSettings[])[0];
}
