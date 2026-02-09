/**
 * Shadow AI Tool Matcher Service
 *
 * Matches event destinations against the global tool registry
 * and manages tenant-specific tool entries.
 */

import { sequelize } from "../database/db";
import { IShadowAiToolRegistry } from "../domain.layer/interfaces/i.shadowAi";

let toolRegistryCache: IShadowAiToolRegistry[] = [];
let cacheLastRefreshed = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load the global tool registry into memory.
 * Cached with a 5-minute TTL.
 */
export async function loadToolRegistry(): Promise<IShadowAiToolRegistry[]> {
  const now = Date.now();
  if (toolRegistryCache.length > 0 && now - cacheLastRefreshed < CACHE_TTL_MS) {
    return toolRegistryCache;
  }

  const [rows] = await sequelize.query(
    `SELECT id, name, vendor, domains, category, models,
            trains_on_data, soc2_certified, gdpr_compliant
     FROM public.shadow_ai_tool_registry
     ORDER BY name`
  );

  toolRegistryCache = (rows as any[]).map((r) => ({
    ...r,
    domains: r.domains || [],
    models: r.models || [],
  }));
  cacheLastRefreshed = now;
  return toolRegistryCache;
}

/**
 * Clear the in-memory tool registry cache (useful after seeding/updates).
 */
export function clearToolRegistryCache(): void {
  toolRegistryCache = [];
  cacheLastRefreshed = 0;
}

/**
 * Match a destination domain against the tool registry.
 * Returns the matching registry entry or null.
 */
export async function matchDomain(
  destination: string
): Promise<IShadowAiToolRegistry | null> {
  const registry = await loadToolRegistry();
  const normalizedDest = destination.toLowerCase().replace(/^www\./, "");

  for (const tool of registry) {
    for (const domain of tool.domains) {
      const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");
      if (
        normalizedDest === normalizedDomain ||
        normalizedDest.endsWith(`.${normalizedDomain}`)
      ) {
        return tool;
      }
    }
  }

  return null;
}

/**
 * Ensure a tool exists in the tenant's shadow_ai_tools table.
 * If the tool doesn't exist, create it from the registry entry.
 * Returns the tenant tool ID.
 */
export async function ensureTenantTool(
  tenant: string,
  registryEntry: IShadowAiToolRegistry,
  transaction?: any
): Promise<number> {
  // Check if tool already exists in tenant by name
  const [existing] = await sequelize.query(
    `SELECT id FROM "${tenant}".shadow_ai_tools WHERE name = :name LIMIT 1`,
    {
      replacements: { name: registryEntry.name },
      ...(transaction ? { transaction } : {}),
    }
  );

  if ((existing as any[]).length > 0) {
    return (existing as any[])[0].id;
  }

  // Create new tenant tool from registry
  const [created] = await sequelize.query(
    `INSERT INTO "${tenant}".shadow_ai_tools
       (name, vendor, domains, status, risk_score,
        first_detected_at, last_seen_at, total_users, total_events,
        trains_on_data, soc2_certified, gdpr_compliant)
     VALUES
       (:name, :vendor, :domains, 'detected', NULL,
        NOW(), NOW(), 0, 0,
        :trains_on_data, :soc2_certified, :gdpr_compliant)
     RETURNING id`,
    {
      replacements: {
        name: registryEntry.name,
        vendor: registryEntry.vendor || null,
        domains: registryEntry.domains,
        trains_on_data: registryEntry.trains_on_data ?? null,
        soc2_certified: registryEntry.soc2_certified ?? null,
        gdpr_compliant: registryEntry.gdpr_compliant ?? null,
      },
      ...(transaction ? { transaction } : {}),
    }
  );

  return (created as any[])[0].id;
}

/**
 * Update tool counters after event ingestion.
 */
export async function updateToolCounters(
  tenant: string,
  toolId: number,
  eventCount: number,
  _uniqueEmails: Set<string>,
  transaction?: any
): Promise<void> {
  await sequelize.query(
    `UPDATE "${tenant}".shadow_ai_tools
     SET last_seen_at = NOW(),
         total_events = total_events + :eventCount,
         total_users = (
           SELECT COUNT(DISTINCT user_email)
           FROM "${tenant}".shadow_ai_events
           WHERE detected_tool_id = :toolId
         ),
         updated_at = NOW()
     WHERE id = :toolId`,
    {
      replacements: { toolId, eventCount },
      ...(transaction ? { transaction } : {}),
    }
  );
}
