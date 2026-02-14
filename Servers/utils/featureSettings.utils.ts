/**
 * Feature Settings Utilities
 *
 * Query helpers for the per-tenant feature_settings table.
 */

import { sequelize } from "../database/db";
import { Transaction } from "sequelize";

export interface IFeatureSettings {
  id?: number;
  lifecycle_enabled: boolean;
  updated_at?: string;
  updated_by?: number | null;
}

/**
 * Get tenant feature settings (always returns a row — created by migration).
 */
export async function getFeatureSettingsQuery(
  tenant: string
): Promise<IFeatureSettings> {
  const [rows] = await sequelize.query(
    `SELECT * FROM "${tenant}".feature_settings WHERE id = 1`
  );

  // Return defaults if no row exists yet
  if ((rows as any[]).length === 0) {
    return {
      lifecycle_enabled: true,
    };
  }

  return (rows as IFeatureSettings[])[0];
}

/**
 * Update tenant feature settings.
 */
export async function updateFeatureSettingsQuery(
  tenant: string,
  updates: Partial<Omit<IFeatureSettings, "id" | "updated_at">>,
  transaction?: Transaction
): Promise<IFeatureSettings> {
  const setClauses: string[] = ["updated_at = NOW()"];
  const replacements: Record<string, unknown> = {};

  if (updates.lifecycle_enabled !== undefined) {
    setClauses.push("lifecycle_enabled = :lifecycle_enabled");
    replacements.lifecycle_enabled = updates.lifecycle_enabled;
  }
  if (updates.updated_by !== undefined) {
    setClauses.push("updated_by = :updated_by");
    replacements.updated_by = updates.updated_by;
  }

  const [result] = await sequelize.query(
    `UPDATE "${tenant}".feature_settings
     SET ${setClauses.join(", ")}
     WHERE id = 1
     RETURNING *`,
    {
      replacements,
      ...(transaction ? { transaction } : {}),
    }
  );

  return (result as IFeatureSettings[])[0];
}
