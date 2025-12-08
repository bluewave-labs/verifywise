/**
 * @fileoverview Marketplace Controller
 *
 * Handles plugin marketplace operations including fetching the registry
 * from GitHub, browsing available plugins, and comparing with installed plugins.
 *
 * Registry URL: https://raw.githubusercontent.com/bluewave-labs/verifywise-apps/main/registry.json
 *
 * @module controllers/marketplace.ctrl
 */

import { Request, Response as ExpressResponse } from "express";
import { getPluginManager } from "./plugin.ctrl";
import logger from "../utils/logger/fileLogger";

// =============================================================================
// CONSTANTS
// =============================================================================

/** GitHub raw URL for the plugin registry */
const REGISTRY_URL =
  "https://raw.githubusercontent.com/bluewave-labs/verifywise-apps/main/registry.json";

/** Cache TTL in milliseconds (15 minutes) */
const REGISTRY_CACHE_TTL = 15 * 60 * 1000;

/** Fetch timeout in milliseconds */
const FETCH_TIMEOUT_MS = 30000;

// =============================================================================
// TYPES
// =============================================================================

/**
 * Plugin entry in the registry
 */
interface RegistryPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: {
    name: string;
    url?: string;
  };
  homepage?: string;
  repository?: string;
  support?: string;
  type: "integration" | "feature" | "framework" | "reporting";
  tags: string[];
  icon?: string;
  download: string;
  checksum?: string;
  compatibility?: {
    minVersion?: string;
  };
  permissions: string[];
  dependencies?: Record<string, string>;
}

/**
 * Registry structure from GitHub
 */
interface PluginRegistry {
  version: string;
  generated: string;
  plugins: RegistryPlugin[];
}

/**
 * Marketplace plugin DTO (includes installation status)
 */
interface MarketplacePluginDTO {
  id: string;
  name: string;
  description: string;
  version: string;
  author: {
    name: string;
    url?: string;
  };
  homepage?: string;
  repository?: string;
  support?: string;
  type: string;
  tags: string[];
  icon?: string;
  download: string;
  checksum?: string;
  compatibility?: {
    minVersion?: string;
  };
  permissions: string[];
  dependencies?: Record<string, string>;
  // Installation status
  installed: boolean;
  installedVersion?: string;
  enabled: boolean;
  hasUpdate: boolean;
}

// =============================================================================
// CACHE
// =============================================================================

/**
 * In-memory cache for the registry
 */
let registryCache: {
  data: PluginRegistry | null;
  fetchedAt: number;
} = {
  data: null,
  fetchedAt: 0,
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Fetch with timeout using AbortController
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out while fetching plugin registry.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Compare semantic versions
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;

    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }

  return 0;
}

/**
 * Fetch the plugin registry from GitHub
 */
async function fetchRegistry(forceRefresh: boolean = false): Promise<PluginRegistry> {
  // Check cache
  const now = Date.now();
  if (
    !forceRefresh &&
    registryCache.data &&
    now - registryCache.fetchedAt < REGISTRY_CACHE_TTL
  ) {
    logger.debug("[Marketplace] Returning cached registry");
    return registryCache.data;
  }

  logger.info("[Marketplace] Fetching registry from GitHub...");

  try {
    const response = await fetchWithTimeout(REGISTRY_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch registry: HTTP ${response.status}`);
    }

    const registry = (await response.json()) as PluginRegistry;

    // Validate registry structure
    if (!registry.plugins || !Array.isArray(registry.plugins)) {
      throw new Error("Invalid registry format: missing plugins array");
    }

    // Update cache
    registryCache = {
      data: registry,
      fetchedAt: now,
    };

    logger.info(
      `[Marketplace] Registry fetched: ${registry.plugins.length} plugins available`
    );

    return registry;
  } catch (error) {
    // If we have cached data, return it even if expired
    if (registryCache.data) {
      logger.warn(
        "[Marketplace] Failed to refresh registry, using cached data:",
        error
      );
      return registryCache.data;
    }
    throw error;
  }
}

/**
 * Enrich registry plugins with installation status
 */
function enrichWithInstallationStatus(
  plugins: RegistryPlugin[]
): MarketplacePluginDTO[] {
  const manager = getPluginManager();

  return plugins.map((plugin) => {
    let installed = false;
    let installedVersion: string | undefined;
    let enabled = false;
    let hasUpdate = false;

    if (manager) {
      const installedPlugin = manager.getPlugin(plugin.id);
      if (installedPlugin) {
        installed = manager.isInstalled(plugin.id);
        enabled = manager.isEnabled(plugin.id);
        installedVersion = installedPlugin.manifest.version;
        hasUpdate = compareVersions(plugin.version, installedVersion) > 0;
      }
    }

    return {
      ...plugin,
      installed,
      installedVersion,
      enabled,
      hasUpdate,
    };
  });
}

// =============================================================================
// ENDPOINTS
// =============================================================================

/**
 * GET /api/marketplace
 *
 * Get all available plugins from the marketplace.
 * Supports filtering and search.
 *
 * Query params:
 * - type: Filter by plugin type (integration, feature, framework, reporting)
 * - search: Search by name, description, or tags
 * - installed: Filter by installation status (true, false, updates)
 * - refresh: Force refresh the registry cache (true)
 */
export async function getMarketplacePlugins(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  try {
    const { type, search, installed, refresh } = req.query;

    // Fetch registry
    const forceRefresh = refresh === "true";
    const registry = await fetchRegistry(forceRefresh);

    // Enrich with installation status
    let plugins = enrichWithInstallationStatus(registry.plugins);

    // Filter by type
    if (type && typeof type === "string") {
      plugins = plugins.filter((p) => p.type === type);
    }

    // Filter by installation status
    if (installed === "true") {
      plugins = plugins.filter((p) => p.installed);
    } else if (installed === "false") {
      plugins = plugins.filter((p) => !p.installed);
    } else if (installed === "updates") {
      plugins = plugins.filter((p) => p.hasUpdate);
    }

    // Search
    if (search && typeof search === "string") {
      const searchLower = search.toLowerCase();
      plugins = plugins.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    res.status(200).json({
      success: true,
      data: {
        registryVersion: registry.version,
        registryUpdated: registry.generated,
        plugins,
        total: plugins.length,
      },
    });
  } catch (error) {
    logger.error("[Marketplace] Error fetching marketplace plugins:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch marketplace plugins",
    });
  }
}

/**
 * GET /api/marketplace/:id
 *
 * Get details of a specific marketplace plugin.
 */
export async function getMarketplacePluginById(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  try {
    const { id } = req.params;

    const registry = await fetchRegistry();

    const plugin = registry.plugins.find((p) => p.id === id);
    if (!plugin) {
      res.status(404).json({
        success: false,
        error: `Plugin "${id}" not found in marketplace`,
      });
      return;
    }

    // Enrich with installation status
    const [enrichedPlugin] = enrichWithInstallationStatus([plugin]);

    res.status(200).json({
      success: true,
      data: enrichedPlugin,
    });
  } catch (error) {
    logger.error("[Marketplace] Error fetching plugin details:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch plugin details",
    });
  }
}

/**
 * GET /api/marketplace/categories
 *
 * Get available plugin categories (types) with counts.
 */
export async function getMarketplaceCategories(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  try {
    const registry = await fetchRegistry();

    // Count plugins by type
    const categoryCounts: Record<string, number> = {};
    for (const plugin of registry.plugins) {
      categoryCounts[plugin.type] = (categoryCounts[plugin.type] || 0) + 1;
    }

    const categories = Object.entries(categoryCounts).map(([type, count]) => ({
      type,
      count,
      label: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize
    }));

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error("[Marketplace] Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch categories",
    });
  }
}

/**
 * GET /api/marketplace/tags
 *
 * Get all available tags with counts.
 */
export async function getMarketplaceTags(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  try {
    const registry = await fetchRegistry();

    // Count plugins by tag
    const tagCounts: Record<string, number> = {};
    for (const plugin of registry.plugins) {
      for (const tag of plugin.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    // Sort by count descending
    const tags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    res.status(200).json({
      success: true,
      data: tags,
    });
  } catch (error) {
    logger.error("[Marketplace] Error fetching tags:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch tags",
    });
  }
}

/**
 * GET /api/marketplace/updates
 *
 * Get plugins that have updates available.
 */
export async function getAvailableUpdates(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  try {
    const registry = await fetchRegistry();
    const plugins = enrichWithInstallationStatus(registry.plugins);

    const updates = plugins.filter((p) => p.hasUpdate);

    res.status(200).json({
      success: true,
      data: {
        plugins: updates,
        total: updates.length,
      },
    });
  } catch (error) {
    logger.error("[Marketplace] Error fetching updates:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to check for updates",
    });
  }
}

/**
 * POST /api/marketplace/refresh
 *
 * Force refresh the registry cache.
 */
export async function refreshRegistry(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  try {
    const registry = await fetchRegistry(true);

    res.status(200).json({
      success: true,
      message: "Registry refreshed successfully",
      data: {
        registryVersion: registry.version,
        registryUpdated: registry.generated,
        pluginCount: registry.plugins.length,
      },
    });
  } catch (error) {
    logger.error("[Marketplace] Error refreshing registry:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to refresh registry",
    });
  }
}

/**
 * Clear the registry cache (for testing)
 */
export function clearRegistryCache(): void {
  registryCache = {
    data: null,
    fetchedAt: 0,
  };
}
