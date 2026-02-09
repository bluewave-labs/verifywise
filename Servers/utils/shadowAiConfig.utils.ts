/**
 * Shadow AI Configuration Utils
 *
 * Database queries for syslog config and department sensitivity.
 */

import { sequelize } from "../database/db";
import { Transaction } from "sequelize";
import { IShadowAiSyslogConfig } from "../domain.layer/interfaces/i.shadowAi";

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
 * Delete a syslog configuration.
 */
export async function deleteSyslogConfigQuery(
  tenant: string,
  configId: number,
  transaction?: Transaction
): Promise<boolean> {
  const [, rowCount] = await sequelize.query(
    `DELETE FROM "${tenant}".shadow_ai_syslog_config WHERE id = :configId`,
    {
      replacements: { configId },
      ...(transaction ? { transaction } : {}),
    }
  );

  return (rowCount as number) > 0;
}
