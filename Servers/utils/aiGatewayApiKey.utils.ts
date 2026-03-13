/**
 * AI Gateway API Key Utils
 *
 * Database utilities for managing AI Gateway API keys.
 * Uses raw SQL queries with unqualified table names (resolved via search_path).
 */

import { sequelize } from "../database/db";
import { encrypt, decrypt, maskApiKey } from "./encryption.utils";

export interface IAiGatewayApiKey {
  id: number;
  organization_id: number;
  provider: string;
  key_name: string;
  encrypted_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IAiGatewayApiKeyMasked {
  id: number;
  provider: string;
  key_name: string;
  masked_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all API keys for an organization (masked, no encrypted_key)
 */
export const getAllApiKeysQuery = async (
  organizationId: number
): Promise<IAiGatewayApiKeyMasked[]> => {
  const result = (await sequelize.query(
    `SELECT id, provider, key_name, encrypted_key, is_active, created_at, updated_at
     FROM ai_gateway_api_keys
     WHERE organization_id = :organizationId
     ORDER BY created_at DESC`,
    { replacements: { organizationId } }
  )) as [IAiGatewayApiKey[], number];

  return result[0].map((key) => {
    let maskedKey = "***";
    try {
      if (key.encrypted_key) {
        const plainKey = decrypt(key.encrypted_key);
        maskedKey = maskApiKey(plainKey);
      }
    } catch (err) {
      console.warn(`Failed to decrypt AI Gateway key ${key.key_name}:`, err);
    }

    return {
      id: key.id,
      provider: key.provider,
      key_name: key.key_name,
      masked_key: maskedKey,
      is_active: key.is_active,
      created_at: key.created_at,
      updated_at: key.updated_at,
    };
  });
};

/**
 * Get a single API key by ID (includes encrypted_key for internal use)
 */
export const getApiKeyByIdQuery = async (
  organizationId: number,
  id: number
): Promise<IAiGatewayApiKey | null> => {
  const result = (await sequelize.query(
    `SELECT id, organization_id, provider, key_name, encrypted_key, is_active, created_at, updated_at
     FROM ai_gateway_api_keys
     WHERE organization_id = :organizationId AND id = :id`,
    { replacements: { organizationId, id } }
  )) as [IAiGatewayApiKey[], number];

  return result[0].length > 0 ? result[0][0] : null;
};

/**
 * Create a new API key
 */
export const createApiKeyQuery = async (
  organizationId: number,
  data: { provider: string; key_name: string; api_key: string }
): Promise<IAiGatewayApiKey> => {
  const encryptedKey = encrypt(data.api_key.trim());

  const result = (await sequelize.query(
    `INSERT INTO ai_gateway_api_keys (organization_id, provider, key_name, encrypted_key, is_active, created_at, updated_at)
     VALUES (:organizationId, :provider, :key_name, :encrypted_key, true, NOW(), NOW())
     RETURNING id, organization_id, provider, key_name, encrypted_key, is_active, created_at, updated_at`,
    {
      replacements: {
        organizationId,
        provider: data.provider,
        key_name: data.key_name,
        encrypted_key: encryptedKey,
      },
    }
  )) as [IAiGatewayApiKey[], number];

  return result[0][0];
};

/**
 * Update an existing API key
 */
export const updateApiKeyQuery = async (
  organizationId: number,
  id: number,
  data: { provider?: string; key_name?: string; api_key?: string }
): Promise<IAiGatewayApiKey | null> => {
  const setClauses: string[] = [];
  const replacements: Record<string, any> = { organizationId, id };

  if (data.provider !== undefined) {
    setClauses.push("provider = :provider");
    replacements.provider = data.provider;
  }
  if (data.key_name !== undefined) {
    setClauses.push("key_name = :key_name");
    replacements.key_name = data.key_name;
  }
  if (data.api_key !== undefined) {
    setClauses.push("encrypted_key = :encrypted_key");
    replacements.encrypted_key = encrypt(data.api_key.trim());
  }

  if (setClauses.length === 0) {
    return getApiKeyByIdQuery(organizationId, id);
  }

  setClauses.push("updated_at = NOW()");

  const result = (await sequelize.query(
    `UPDATE ai_gateway_api_keys
     SET ${setClauses.join(", ")}
     WHERE organization_id = :organizationId AND id = :id
     RETURNING id, organization_id, provider, key_name, encrypted_key, is_active, created_at, updated_at`,
    { replacements }
  )) as [IAiGatewayApiKey[], number];

  return result[0].length > 0 ? result[0][0] : null;
};

/**
 * Soft delete an API key (set is_active = false)
 */
export const deleteApiKeyQuery = async (
  organizationId: number,
  id: number
): Promise<boolean> => {
  const result = (await sequelize.query(
    `UPDATE ai_gateway_api_keys
     SET is_active = false, updated_at = NOW()
     WHERE organization_id = :organizationId AND id = :id AND is_active = true
     RETURNING id`,
    { replacements: { organizationId, id } }
  )) as [{ id: number }[], number];

  return (result[0] as any[]).length > 0;
};
