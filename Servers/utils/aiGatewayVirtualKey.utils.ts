/**
 * AI Gateway Virtual Key Utils
 *
 * Database utilities for managing virtual keys (developer API keys).
 * Virtual keys allow external developers to use the gateway without a VerifyWise account.
 * Key format: sk-vw- prefix + 32 hex chars. Only the SHA-256 hash is stored.
 */

import crypto from "crypto";
import { sequelize } from "../database/db";

export interface IAiGatewayVirtualKey {
  id: number;
  organization_id: number;
  key_hash: string;
  key_prefix: string;
  name: string;
  allowed_endpoint_ids: number[];
  max_budget_usd: number | null;
  current_spend_usd: number;
  budget_reset_at: string | null;
  rate_limit_rpm: number | null;
  metadata: Record<string, string>;
  expires_at: string | null;
  is_active: boolean;
  revoked_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Generate a new virtual key.
 * Returns the plaintext key (shown once), its SHA-256 hash, and the prefix.
 */
export function generateVirtualKey(): { plainKey: string; hash: string; prefix: string } {
  const random = crypto.randomBytes(16).toString("hex"); // 32 hex chars
  const plainKey = `sk-vw-${random}`;
  const hash = crypto.createHash("sha256").update(plainKey).digest("hex");
  const prefix = plainKey.slice(0, 12) + "...";
  return { plainKey, hash, prefix };
}

/**
 * Hash a virtual key for lookup.
 */
export function hashVirtualKey(plainKey: string): string {
  return crypto.createHash("sha256").update(plainKey).digest("hex");
}

/**
 * Create a new virtual key record.
 */
export const createVirtualKeyQuery = async (
  organizationId: number,
  data: {
    key_hash: string;
    key_prefix: string;
    name: string;
    allowed_endpoint_ids?: number[];
    max_budget_usd?: number;
    rate_limit_rpm?: number;
    metadata?: Record<string, string>;
    expires_at?: string;
    created_by: number;
  }
): Promise<IAiGatewayVirtualKey> => {
  const result = (await sequelize.query(
    `INSERT INTO ai_gateway_virtual_keys
       (organization_id, key_hash, key_prefix, name, allowed_endpoint_ids,
        max_budget_usd, rate_limit_rpm, metadata, expires_at, created_by,
        created_at, updated_at)
     VALUES
       (:organizationId, :key_hash, :key_prefix, :name, :allowed_endpoint_ids,
        :max_budget_usd, :rate_limit_rpm, :metadata, :expires_at, :created_by,
        NOW(), NOW())
     RETURNING id, organization_id, key_prefix, name, allowed_endpoint_ids,
              max_budget_usd, current_spend_usd, budget_reset_at, rate_limit_rpm,
              metadata, expires_at, is_active, revoked_at, created_by,
              created_at, updated_at`,
    {
      replacements: {
        organizationId,
        key_hash: data.key_hash,
        key_prefix: data.key_prefix,
        name: data.name,
        allowed_endpoint_ids: data.allowed_endpoint_ids && data.allowed_endpoint_ids.length > 0
          ? `{${data.allowed_endpoint_ids.join(",")}}`
          : "{}",
        max_budget_usd: data.max_budget_usd ?? null,
        rate_limit_rpm: data.rate_limit_rpm ?? null,
        metadata: JSON.stringify(data.metadata || {}),
        expires_at: data.expires_at || null,
        created_by: data.created_by,
      },
    }
  )) as [IAiGatewayVirtualKey[], number];

  return result[0][0];
};

/**
 * Get all virtual keys for an organization (never returns hash).
 */
export const getAllVirtualKeysQuery = async (
  organizationId: number
): Promise<Omit<IAiGatewayVirtualKey, "key_hash">[]> => {
  const result = (await sequelize.query(
    `SELECT vk.id, vk.organization_id, vk.key_prefix, vk.name,
            vk.allowed_endpoint_ids, vk.max_budget_usd, vk.current_spend_usd,
            vk.budget_reset_at, vk.rate_limit_rpm, vk.metadata,
            vk.expires_at, vk.is_active, vk.revoked_at,
            vk.created_by, vk.created_at, vk.updated_at,
            COALESCE(NULLIF(TRIM(COALESCE(u.name, '') || ' ' || COALESCE(u.surname, '')), ''), 'unknown') AS created_by_name
     FROM ai_gateway_virtual_keys vk
     LEFT JOIN users u ON u.id = vk.created_by
     WHERE vk.organization_id = :organizationId
     ORDER BY vk.created_at DESC`,
    { replacements: { organizationId } }
  )) as [any[], number];

  return result[0];
};

/**
 * Get a virtual key by its SHA-256 hash (for auth middleware).
 * Returns the full row including organization_id.
 */
export const getVirtualKeyByHashQuery = async (
  keyHash: string
): Promise<IAiGatewayVirtualKey | null> => {
  const result = (await sequelize.query(
    `SELECT * FROM ai_gateway_virtual_keys WHERE key_hash = :keyHash`,
    { replacements: { keyHash } }
  )) as [IAiGatewayVirtualKey[], number];

  return result[0].length > 0 ? result[0][0] : null;
};

/**
 * Update a virtual key's mutable fields.
 */
export const updateVirtualKeyQuery = async (
  organizationId: number,
  id: number,
  data: {
    name?: string;
    allowed_endpoint_ids?: number[];
    max_budget_usd?: number | null;
    rate_limit_rpm?: number | null;
    metadata?: Record<string, string>;
    expires_at?: string | null;
  }
): Promise<IAiGatewayVirtualKey | null> => {
  const setClauses: string[] = [];
  const replacements: Record<string, any> = { organizationId, id };

  if (data.name !== undefined) {
    setClauses.push("name = :name");
    replacements.name = data.name;
  }
  if (data.allowed_endpoint_ids !== undefined) {
    setClauses.push("allowed_endpoint_ids = :allowed_endpoint_ids");
    replacements.allowed_endpoint_ids =
      data.allowed_endpoint_ids.length > 0
        ? `{${data.allowed_endpoint_ids.join(",")}}`
        : "{}";
  }
  if (data.max_budget_usd !== undefined) {
    setClauses.push("max_budget_usd = :max_budget_usd");
    replacements.max_budget_usd = data.max_budget_usd;
  }
  if (data.rate_limit_rpm !== undefined) {
    setClauses.push("rate_limit_rpm = :rate_limit_rpm");
    replacements.rate_limit_rpm = data.rate_limit_rpm;
  }
  if (data.metadata !== undefined) {
    setClauses.push("metadata = :metadata");
    replacements.metadata = JSON.stringify(data.metadata);
  }
  if (data.expires_at !== undefined) {
    setClauses.push("expires_at = :expires_at");
    replacements.expires_at = data.expires_at;
  }

  if (setClauses.length === 0) return null;

  setClauses.push("updated_at = NOW()");

  const result = (await sequelize.query(
    `UPDATE ai_gateway_virtual_keys
     SET ${setClauses.join(", ")}
     WHERE organization_id = :organizationId AND id = :id
     RETURNING id, organization_id, key_prefix, name, allowed_endpoint_ids,
              max_budget_usd, current_spend_usd, budget_reset_at, rate_limit_rpm,
              metadata, expires_at, is_active, revoked_at, created_by,
              created_at, updated_at`,
    { replacements }
  )) as [IAiGatewayVirtualKey[], number];

  return result[0].length > 0 ? result[0][0] : null;
};

/**
 * Soft revoke a virtual key (sets is_active = false, revoked_at = NOW()).
 */
export const revokeVirtualKeyQuery = async (
  organizationId: number,
  id: number
): Promise<boolean> => {
  const result = (await sequelize.query(
    `UPDATE ai_gateway_virtual_keys
     SET is_active = false, revoked_at = NOW(), updated_at = NOW()
     WHERE organization_id = :organizationId AND id = :id AND is_active = true
     RETURNING id`,
    { replacements: { organizationId, id } }
  )) as [{ id: number }[], number];

  return (result[0] as any[]).length > 0;
};

/**
 * Hard delete a virtual key (only if already revoked).
 */
export const deleteVirtualKeyQuery = async (
  organizationId: number,
  id: number
): Promise<boolean> => {
  const result = (await sequelize.query(
    `DELETE FROM ai_gateway_virtual_keys
     WHERE organization_id = :organizationId AND id = :id AND is_active = false
     RETURNING id`,
    { replacements: { organizationId, id } }
  )) as [{ id: number }[], number];

  return (result[0] as any[]).length > 0;
};

/**
 * Reset budget spend for all virtual keys where budget_reset_at <= NOW().
 * Advances budget_reset_at to the next month.
 */
export const resetVirtualKeyBudgets = async (): Promise<number> => {
  const [, meta] = await sequelize.query(
    `UPDATE ai_gateway_virtual_keys
     SET current_spend_usd = 0,
         budget_reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
         updated_at = NOW()
     WHERE budget_reset_at <= NOW()
       AND max_budget_usd IS NOT NULL
       AND is_active = true`
  );
  return (meta as any)?.rowCount || 0;
};

/**
 * Atomically increment a virtual key's current spend.
 * Returns the updated spend and budget limit for alert checking.
 */
export const incrementVirtualKeySpend = async (
  id: number,
  amount: number
): Promise<{ name: string; current_spend_usd: number; max_budget_usd: number | null } | null> => {
  const result = (await sequelize.query(
    `UPDATE ai_gateway_virtual_keys
     SET current_spend_usd = current_spend_usd + :amount,
         updated_at = NOW()
     WHERE id = :id
     RETURNING name, current_spend_usd, max_budget_usd`,
    { replacements: { id, amount } }
  )) as [any[], number];

  return result[0].length > 0 ? result[0][0] : null;
};
