import { getTenantHash } from "../../tools/getTenantHash";
import { getAllOrganizationsQuery } from "../../utils/organization.utils";
import { getInstalledPlugins } from "../../utils/pluginInstallation.utils";
import {
  PluginService,
  PluginRouteContext,
} from "../plugin/pluginService";
import {
  upsertAgentPrimitivesQuery,
  flagStaleAgentsQuery,
  createSyncLogQuery,
  updateSyncLogQuery,
} from "../../utils/agentDiscovery.utils";
import { sequelize } from "../../database/db";
import logger from "../../utils/logger/fileLogger";

/**
 * Permission category mapping: maps raw permission strings to normalized categories.
 */
const PERMISSION_CATEGORY_MAP: Record<string, string> = {
  // Read-level
  "read": "data_read",
  "read:all": "data_read",
  "list": "data_read",
  "get": "data_read",
  "view": "data_read",
  // Write-level
  "write": "data_write",
  "write:all": "data_write",
  "create": "data_write",
  "update": "data_write",
  "put": "data_write",
  "patch": "data_write",
  // Delete-level
  "delete": "data_delete",
  "delete:all": "data_delete",
  "remove": "data_delete",
  // Admin-level
  "admin": "admin",
  "manage": "admin",
  "admin:all": "admin",
  // Execute-level
  "execute": "code_execute",
  "run": "code_execute",
  "invoke": "code_execute",
  // Network
  "network": "network_access",
  "internet": "network_access",
  "api": "network_access",
  "http": "network_access",
};

function categorizePermissions(permissions: string[]): string[] {
  const categories = new Set<string>();
  for (const perm of permissions) {
    const normalized = perm.toLowerCase().trim();
    let matched = false;
    // Check for exact match first
    if (PERMISSION_CATEGORY_MAP[normalized]) {
      categories.add(PERMISSION_CATEGORY_MAP[normalized]);
      continue;
    }
    // Check colon-delimited segments (e.g., "files:read" → check "files", "read")
    const segments = normalized.split(/[:.]/);
    for (const segment of segments) {
      if (PERMISSION_CATEGORY_MAP[segment]) {
        categories.add(PERMISSION_CATEGORY_MAP[segment]);
        matched = true;
      }
    }
    // If no segment matched, mark as "other"
    if (!matched) {
      categories.add("other");
    }
  }
  return [...categories];
}

/**
 * Run agent discovery sync for a single tenant.
 * Called by the manual trigger endpoint and by the scheduled job.
 */
export async function runAgentDiscoverySyncForTenant(
  tenantId: string,
  triggeredBy: string = "manual"
): Promise<{ synced: string[]; errors: string[] }> {
  const synced: string[] = [];
  const errors: string[] = [];

  try {
    const installations = await getInstalledPlugins(tenantId);

    // For each installed plugin, check if it's an agent_discovery plugin
    for (const installation of installations) {
      const pluginKey = installation.plugin_key;

      let plugin;
      try {
        plugin = await PluginService.getPluginByKey(pluginKey);
      } catch {
        continue;
      }

      if (!plugin || plugin.category !== "agent_discovery") {
        continue;
      }

      // Create sync log
      const syncLog = await createSyncLogQuery(
        { source_system: pluginKey, triggered_by: triggeredBy },
        tenantId
      );

      try {
        // Build context and forward to plugin's discover route
        const context: PluginRouteContext = {
          tenantId,
          userId: 0, // system-level call
          organizationId: 0,
          method: "GET",
          path: "/discover",
          params: {},
          query: {},
          body: {},
          sequelize,
          configuration: installation.configuration || {},
        };

        const response = await PluginService.forwardToPlugin(pluginKey, context);
        const primitives = response.data || [];

        // Normalize permissions into categories
        const normalizedPrimitives = primitives.map((p: any) => ({
          source_system: p.source_system || pluginKey,
          primitive_type: p.primitive_type || "unknown",
          external_id: p.external_id,
          display_name: p.display_name,
          owner_id: p.owner_id || null,
          permissions: p.permissions || [],
          permission_categories: categorizePermissions(p.permissions || []),
          last_activity: p.last_activity || null,
          metadata: p.metadata || {},
        }));

        // Upsert primitives
        const { created, updated } = await upsertAgentPrimitivesQuery(
          normalizedPrimitives,
          tenantId
        );

        // Flag stale agents (inactive > 30 days)
        const staleFlagged = await flagStaleAgentsQuery(pluginKey, tenantId);

        // Update sync log with success
        await updateSyncLogQuery(syncLog.id!, {
          status: "success",
          primitives_found: normalizedPrimitives.length,
          primitives_created: created,
          primitives_updated: updated,
          primitives_stale_flagged: typeof staleFlagged === "number" ? staleFlagged : 0,
        }, tenantId);

        synced.push(pluginKey);
        logger.info(
          `[AgentDiscoverySync] ${pluginKey}: found=${normalizedPrimitives.length}, created=${created}, updated=${updated}, stale=${staleFlagged}`
        );
      } catch (pluginError) {
        const errMsg = (pluginError as Error).message;
        await updateSyncLogQuery(syncLog.id!, {
          status: "failed",
          error_message: errMsg,
        }, tenantId);
        errors.push(`${pluginKey}: ${errMsg}`);
        logger.error(`[AgentDiscoverySync] Error syncing ${pluginKey}: ${errMsg}`);
      }
    }
  } catch (error) {
    logger.error(`[AgentDiscoverySync] Error for tenant ${tenantId}: ${(error as Error).message}`);
    errors.push((error as Error).message);
  }

  return { synced, errors };
}

/**
 * Run agent discovery sync for ALL organizations.
 * Called by the scheduled BullMQ job.
 */
export async function runAgentDiscoverySync(): Promise<void> {
  logger.info("[AgentDiscoverySync] Starting scheduled sync for all orgs...");

  const organizations = await getAllOrganizationsQuery();

  for (const org of organizations) {
    const tenantHash = getTenantHash(org.id!);
    try {
      await runAgentDiscoverySyncForTenant(tenantHash, "scheduled");
    } catch (error) {
      logger.error(
        `[AgentDiscoverySync] Failed for org ${org.id}: ${(error as Error).message}`
      );
    }
  }

  logger.info("[AgentDiscoverySync] Scheduled sync complete.");
}
