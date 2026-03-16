/**
 * AI Gateway Endpoint Utils
 *
 * Database utilities for managing AI Gateway endpoints (proxy routes).
 * Uses raw SQL queries with unqualified table names (resolved via search_path).
 */

import { sequelize } from "../database/db";
import logger from "./logger/fileLogger";

export interface IAiGatewayEndpoint {
  id: number;
  organization_id: number;
  slug: string;
  display_name: string;
  provider: string;
  model: string;
  api_key_id: number;
  api_key_name?: string;
  max_tokens: number | null;
  temperature: number | null;
  system_prompt: string | null;
  rate_limit_rpm: number | null;
  fallback_endpoint_id: number | null;
  allowed_role_ids: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all active endpoints for an organization with api key name joined
 */
export const getAllEndpointsQuery = async (
  organizationId: number,
  roleId?: number
): Promise<IAiGatewayEndpoint[]> => {
  const roleFilter = roleId ? "AND :roleId = ANY(e.allowed_role_ids)" : "";
  const result = (await sequelize.query(
    `SELECT e.id, e.organization_id, e.slug, e.display_name, e.provider, e.model,
            e.api_key_id, k.key_name AS api_key_name,
            e.max_tokens, e.temperature, e.system_prompt, e.rate_limit_rpm,
            e.fallback_endpoint_id, e.allowed_role_ids,
            e.is_active, e.created_at, e.updated_at
     FROM ai_gateway_endpoints e
     LEFT JOIN ai_gateway_api_keys k ON k.id = e.api_key_id AND k.organization_id = e.organization_id
     WHERE e.organization_id = :organizationId ${roleFilter}
     ORDER BY e.created_at DESC`,
    { replacements: { organizationId, ...(roleId ? { roleId } : {}) } }
  )) as [IAiGatewayEndpoint[], number];

  return result[0];
};

/**
 * Get a single endpoint by slug
 */
export const getEndpointBySlugQuery = async (
  organizationId: number,
  slug: string
): Promise<IAiGatewayEndpoint | null> => {
  const result = (await sequelize.query(
    `SELECT e.id, e.organization_id, e.slug, e.display_name, e.provider, e.model,
            e.api_key_id, k.key_name AS api_key_name,
            e.max_tokens, e.temperature, e.system_prompt, e.rate_limit_rpm,
            e.fallback_endpoint_id, e.allowed_role_ids,
            e.is_active, e.created_at, e.updated_at
     FROM ai_gateway_endpoints e
     LEFT JOIN ai_gateway_api_keys k ON k.id = e.api_key_id AND k.organization_id = e.organization_id
     WHERE e.organization_id = :organizationId AND e.slug = :slug`,
    { replacements: { organizationId, slug } }
  )) as [IAiGatewayEndpoint[], number];

  return result[0].length > 0 ? result[0][0] : null;
};

/**
 * Get a single endpoint by ID
 */
export const getEndpointByIdQuery = async (
  organizationId: number,
  id: number
): Promise<IAiGatewayEndpoint | null> => {
  const result = (await sequelize.query(
    `SELECT e.id, e.organization_id, e.slug, e.display_name, e.provider, e.model,
            e.api_key_id, k.key_name AS api_key_name,
            e.max_tokens, e.temperature, e.system_prompt, e.rate_limit_rpm,
            e.fallback_endpoint_id, e.allowed_role_ids,
            e.is_active, e.created_at, e.updated_at
     FROM ai_gateway_endpoints e
     LEFT JOIN ai_gateway_api_keys k ON k.id = e.api_key_id AND k.organization_id = e.organization_id
     WHERE e.organization_id = :organizationId AND e.id = :id`,
    { replacements: { organizationId, id } }
  )) as [IAiGatewayEndpoint[], number];

  return result[0].length > 0 ? result[0][0] : null;
};

/**
 * Create a new endpoint
 */
export const createEndpointQuery = async (
  organizationId: number,
  data: {
    slug: string;
    display_name: string;
    provider: string;
    model: string;
    api_key_id: number;
    max_tokens?: number | null;
    temperature?: number | null;
    system_prompt?: string | null;
    rate_limit_rpm?: number | null;
  }
): Promise<IAiGatewayEndpoint> => {
  const result = (await sequelize.query(
    `INSERT INTO ai_gateway_endpoints
       (organization_id, slug, display_name, provider, model, api_key_id,
        max_tokens, temperature, system_prompt, rate_limit_rpm, is_active, created_at, updated_at)
     VALUES
       (:organizationId, :slug, :display_name, :provider, :model, :api_key_id,
        :max_tokens, :temperature, :system_prompt, :rate_limit_rpm, true, NOW(), NOW())
     RETURNING id, organization_id, slug, display_name, provider, model, api_key_id,
               max_tokens, temperature, system_prompt, rate_limit_rpm, is_active, created_at, updated_at`,
    {
      replacements: {
        organizationId,
        slug: data.slug,
        display_name: data.display_name,
        provider: data.provider,
        model: data.model,
        api_key_id: data.api_key_id,
        max_tokens: data.max_tokens ?? null,
        temperature: data.temperature ?? null,
        system_prompt: data.system_prompt ?? null,
        rate_limit_rpm: data.rate_limit_rpm ?? null,
      },
    }
  )) as [IAiGatewayEndpoint[], number];

  return result[0][0];
};

/**
 * Update an existing endpoint
 */
export const updateEndpointQuery = async (
  organizationId: number,
  id: number,
  data: {
    slug?: string;
    display_name?: string;
    provider?: string;
    model?: string;
    api_key_id?: number;
    max_tokens?: number | null;
    temperature?: number | null;
    system_prompt?: string | null;
    rate_limit_rpm?: number | null;
    fallback_endpoint_id?: number | null;
    allowed_role_ids?: number[];
    is_active?: boolean;
  }
): Promise<IAiGatewayEndpoint | null> => {
  const setClauses: string[] = [];
  const replacements: Record<string, any> = { organizationId, id };

  if (data.slug !== undefined) {
    setClauses.push("slug = :slug");
    replacements.slug = data.slug;
  }
  if (data.display_name !== undefined) {
    setClauses.push("display_name = :display_name");
    replacements.display_name = data.display_name;
  }
  if (data.provider !== undefined) {
    setClauses.push("provider = :provider");
    replacements.provider = data.provider;
  }
  if (data.model !== undefined) {
    setClauses.push("model = :model");
    replacements.model = data.model;
  }
  if (data.api_key_id !== undefined) {
    setClauses.push("api_key_id = :api_key_id");
    replacements.api_key_id = data.api_key_id;
  }
  if (data.max_tokens !== undefined) {
    setClauses.push("max_tokens = :max_tokens");
    replacements.max_tokens = data.max_tokens;
  }
  if (data.temperature !== undefined) {
    setClauses.push("temperature = :temperature");
    replacements.temperature = data.temperature;
  }
  if (data.system_prompt !== undefined) {
    setClauses.push("system_prompt = :system_prompt");
    replacements.system_prompt = data.system_prompt;
  }
  if (data.rate_limit_rpm !== undefined) {
    setClauses.push("rate_limit_rpm = :rate_limit_rpm");
    replacements.rate_limit_rpm = data.rate_limit_rpm;
  }
  if (data.fallback_endpoint_id !== undefined) {
    setClauses.push("fallback_endpoint_id = :fallback_endpoint_id");
    replacements.fallback_endpoint_id = data.fallback_endpoint_id;
  }
  if (data.allowed_role_ids !== undefined) {
    setClauses.push("allowed_role_ids = :allowed_role_ids");
    replacements.allowed_role_ids = `{${data.allowed_role_ids.join(",")}}`;
  }
  if (data.is_active !== undefined) {
    setClauses.push("is_active = :is_active");
    replacements.is_active = data.is_active;
  }

  if (setClauses.length === 0) {
    return getEndpointByIdQuery(organizationId, id);
  }

  setClauses.push("updated_at = NOW()");

  const result = (await sequelize.query(
    `UPDATE ai_gateway_endpoints
     SET ${setClauses.join(", ")}
     WHERE organization_id = :organizationId AND id = :id
     RETURNING id, organization_id, slug, display_name, provider, model, api_key_id,
               max_tokens, temperature, system_prompt, rate_limit_rpm, is_active, created_at, updated_at`,
    { replacements }
  )) as [IAiGatewayEndpoint[], number];

  return result[0].length > 0 ? result[0][0] : null;
};

/**
 * Hard delete an endpoint.
 * Also cleans up:
 * - Virtual key allowed_endpoint_ids arrays (removes the deleted ID)
 * - Logs a warning if other endpoints had this as a fallback (FK SET NULL handles it)
 */
export const deleteEndpointQuery = async (
  organizationId: number,
  id: number
): Promise<boolean> => {
  // Check if any endpoints use this as a fallback (will be SET NULL by FK, but log it)
  try {
    const fallbackRefs = (await sequelize.query(
      `SELECT id, display_name FROM ai_gateway_endpoints
       WHERE organization_id = :organizationId AND fallback_endpoint_id = :id`,
      { replacements: { organizationId, id } }
    )) as [any[], number];
    if (fallbackRefs[0].length > 0) {
      const names = fallbackRefs[0].map((e: any) => e.display_name).join(", ");
      logger.warn(`Deleting endpoint ${id} which is used as fallback by: ${names}`);
    }
  } catch { /* non-blocking */ }

  // Remove this endpoint ID from virtual key allowed_endpoint_ids arrays
  try {
    await sequelize.query(
      `UPDATE ai_gateway_virtual_keys
       SET allowed_endpoint_ids = array_remove(allowed_endpoint_ids, :id),
           updated_at = NOW()
       WHERE organization_id = :organizationId
         AND :id = ANY(allowed_endpoint_ids)`,
      { replacements: { organizationId, id } }
    );
  } catch { /* non-blocking */ }

  const result = (await sequelize.query(
    `DELETE FROM ai_gateway_endpoints
     WHERE organization_id = :organizationId AND id = :id
     RETURNING id`,
    { replacements: { organizationId, id } }
  )) as [{ id: number }[], number];

  return (result[0] as any[]).length > 0;
};
