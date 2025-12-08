/**
 * VerifyWise Plugin System - Initialization
 *
 * Initializes the plugin manager and loads all registered plugins.
 * This module should be imported and called during server startup.
 */

import express, { Application, Router } from "express";
import { PluginManager, createDatabaseService, PluginManifest, PluginType, PluginPermission, PluginConfigSchema, Plugin } from "./core";
import { setPluginManager, createDynamicPlugin } from "../controllers/plugin.ctrl";
import { sequelize } from "../database/db";
import { builtinPlugins } from "./builtin";
import logger from "../utils/logger/fileLogger";
import path from "path";
import fs from "fs";
import { registerAutomationHandlers } from "./core/automationHandler";
import authenticateJWT from "../middleware/auth.middleware";

/**
 * Read plugin icon from file if it's a file path
 * Supports: .svg files (read as text), other formats could be base64 encoded
 * @param iconValue - Either inline SVG content or a file path (e.g., "icon.svg")
 * @param pluginDir - Directory where the plugin is located
 * @returns The icon content (SVG string) or undefined
 */
function readPluginIcon(iconValue: string | undefined, pluginDir: string): string | undefined {
  if (!iconValue) return undefined;

  // Check if it's a file path (ends with .svg, .png, etc.)
  const isFilePath = /\.(svg|png|jpg|jpeg|gif|ico)$/i.test(iconValue);

  if (!isFilePath) {
    // It's already inline SVG content
    return iconValue;
  }

  // Try to read the icon file
  const iconPath = path.join(pluginDir, iconValue);

  if (!fs.existsSync(iconPath)) {
    logger.warn(`[Plugins] Icon file not found: ${iconPath}`);
    return undefined;
  }

  try {
    if (iconValue.toLowerCase().endsWith('.svg')) {
      // Read SVG as text
      return fs.readFileSync(iconPath, 'utf8');
    } else {
      // For other formats, base64 encode
      const buffer = fs.readFileSync(iconPath);
      const ext = path.extname(iconValue).toLowerCase().slice(1);
      const mimeType = ext === 'jpg' ? 'jpeg' : ext;
      return `data:image/${mimeType};base64,${buffer.toString('base64')}`;
    }
  } catch (error) {
    logger.error(`[Plugins] Failed to read icon file ${iconPath}:`, error);
    return undefined;
  }
}

// Global plugin manager instance (persisted across requests)
let pluginManager: PluginManager | null = null;

// Store app reference for mounting routes
let expressApp: Application | null = null;

// Track mounted plugin routes to avoid duplicates
const mountedPluginRoutes: Set<string> = new Set();

/**
 * Mount routes for a specific plugin
 *
 * Creates a router for the plugin and mounts it at /api/plugins/{pluginId}/
 */
function mountPluginRoutes(plugin: Plugin): void {
  if (!expressApp || !plugin.routes) return;

  const pluginId = plugin.manifest.id;

  // Skip if already mounted
  if (mountedPluginRoutes.has(pluginId)) {
    return;
  }

  try {
    // Create a new router for this plugin
    const pluginRouter = Router();

    // Let the plugin define its routes
    plugin.routes(pluginRouter);

    // Mount the router at /api/plugins/{pluginId}/
    // Apply authentication middleware
    expressApp.use(`/api/plugins/${pluginId}`, authenticateJWT, pluginRouter);

    mountedPluginRoutes.add(pluginId);
    logger.info(`[Plugins] Mounted routes for plugin "${pluginId}" at /api/plugins/${pluginId}/`);
  } catch (error) {
    logger.error(`[Plugins] Failed to mount routes for plugin "${pluginId}":`, error);
  }
}

/**
 * Mount routes for all enabled plugins
 */
export function mountAllPluginRoutes(): void {
  if (!pluginManager || !expressApp) return;

  const enabledPlugins = pluginManager.getEnabledPlugins();

  for (const plugin of enabledPlugins) {
    if (plugin.routes) {
      mountPluginRoutes(plugin);
    }
  }
}

/**
 * Initialize the plugin system
 *
 * Creates the PluginManager, loads plugin states from database,
 * and enables previously enabled plugins.
 *
 * @param app - Express application instance for mounting plugin routes
 */
export async function initializePlugins(app?: Application): Promise<PluginManager> {
  logger.info("[Plugins] Initializing plugin system...");

  // Store app reference for route mounting
  if (app) {
    expressApp = app;
  }

  // Create database service from sequelize
  const db = createDatabaseService(sequelize);

  // Create plugin manager
  pluginManager = new PluginManager({
    db,
    defaultTenant: "default",
  });

  // Set the plugin manager in the controller
  setPluginManager(pluginManager);

  // Register all built-in plugins
  logger.info(`[Plugins] Registering ${builtinPlugins.length} built-in plugins...`);
  for (const plugin of builtinPlugins) {
    pluginManager.registerPlugin(plugin);
    logger.info(`[Plugins] Registered: ${plugin.manifest.name} (${plugin.manifest.id})`);
  }

  // Load marketplace plugins from disk (downloaded from marketplace)
  await loadMarketplacePlugins();

  // Register automation handlers to connect EventBus with Automation system
  registerAutomationHandlers(pluginManager.getEventBus());

  // Load plugin states from database (restores installed/enabled status)
  await loadPluginStates();

  // Mount routes for all enabled plugins
  mountAllPluginRoutes();

  logger.info("[Plugins] Plugin system initialized");
  logger.info("[Plugins] Stats:", pluginManager.getStats());

  return pluginManager;
}

/**
 * Load plugin states from database and restore previous state
 */
async function loadPluginStates(): Promise<void> {
  if (!pluginManager) return;

  try {
    // Query plugin states from database
    const [results] = await sequelize.query(
      `SELECT plugin_id, installed, enabled, config
       FROM plugin_states
       WHERE tenant = 'default'`
    );

    const states = results as Array<{
      plugin_id: string;
      installed: boolean;
      enabled: boolean;
      config: Record<string, unknown>;
    }>;

    logger.info(`[Plugins] Found ${states.length} saved plugin states`);

    // For each saved state, try to restore it
    for (const state of states) {
      const plugin = pluginManager.getPlugin(state.plugin_id);
      if (!plugin) {
        // Clean up orphaned plugin state (files deleted but DB record remains)
        logger.warn(`[Plugins] Plugin "${state.plugin_id}" not found, cleaning up orphaned state`);
        await sequelize.query(
          `DELETE FROM plugin_states WHERE plugin_id = :pluginId AND tenant = 'default'`,
          { replacements: { pluginId: state.plugin_id } }
        );
        continue;
      }

      try {
        // Set config if available
        if (state.config) {
          pluginManager.getContextFactory().setPluginConfig(state.plugin_id, state.config);
        }

        // Install if was installed
        if (state.installed && !pluginManager.isInstalled(state.plugin_id)) {
          await pluginManager.installPlugin(state.plugin_id);
        }

        // Load and enable if was enabled
        if (state.enabled && !pluginManager.isEnabled(state.plugin_id)) {
          await pluginManager.loadPlugin(state.plugin_id);
          await pluginManager.enablePlugin(state.plugin_id);
        }

        logger.info(`[Plugins] Restored state for "${state.plugin_id}": installed=${state.installed}, enabled=${state.enabled}`);
      } catch (error) {
        logger.error(`[Plugins] Failed to restore state for "${state.plugin_id}":`, error);
      }
    }
  } catch (error) {
    logger.error("[Plugins] Failed to load plugin states:", error);
  }
}

/**
 * Save plugin state to database
 */
export async function savePluginState(
  pluginId: string,
  installed: boolean,
  enabled: boolean,
  config?: Record<string, unknown>
): Promise<void> {
  try {
    await sequelize.query(
      `INSERT INTO plugin_states (tenant, plugin_id, installed, enabled, config, installed_at, enabled_at, updated_at)
       VALUES ('default', $1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (tenant, plugin_id)
       DO UPDATE SET
         installed = $2,
         enabled = $3,
         config = COALESCE($4, plugin_states.config),
         installed_at = CASE WHEN $2 AND NOT plugin_states.installed THEN NOW() ELSE plugin_states.installed_at END,
         enabled_at = CASE WHEN $3 AND NOT plugin_states.enabled THEN NOW() ELSE plugin_states.enabled_at END,
         updated_at = NOW()`,
      {
        bind: [
          pluginId,
          installed,
          enabled,
          config ? JSON.stringify(config) : null,
          installed ? new Date() : null,
          enabled ? new Date() : null,
        ],
      }
    );
  } catch (error) {
    logger.error(`[Plugins] Failed to save state for "${pluginId}":`, error);
    throw error;
  }
}

/**
 * Delete plugin state from database
 */
export async function deletePluginState(pluginId: string): Promise<void> {
  try {
    await sequelize.query(
      `DELETE FROM plugin_states WHERE plugin_id = $1 AND tenant = 'default'`,
      { bind: [pluginId] }
    );
    logger.info(`[Plugins] Deleted state for "${pluginId}"`);
  } catch (error) {
    logger.error(`[Plugins] Failed to delete state for "${pluginId}":`, error);
    throw error;
  }
}

/**
 * Delete plugin files from disk
 */
export function deletePluginFiles(pluginId: string): boolean {
  // Check both marketplace and uploaded directories
  const pluginDirs = [
    path.join(process.cwd(), "plugins", "marketplace", pluginId),
    path.join(process.cwd(), "plugins", "uploaded", pluginId),
  ];

  let deleted = false;
  for (const pluginDir of pluginDirs) {
    if (fs.existsSync(pluginDir)) {
      try {
        fs.rmSync(pluginDir, { recursive: true });
        logger.info(`[Plugins] Deleted plugin files: ${pluginDir}`);
        deleted = true;
      } catch (error) {
        logger.error(`[Plugins] Failed to delete plugin files ${pluginDir}:`, error);
      }
    }
  }
  return deleted;
}

/**
 * Load marketplace plugins from disk
 *
 * Scans the plugins/marketplace directory for downloaded plugins
 * and registers them with the plugin manager.
 */
async function loadMarketplacePlugins(): Promise<void> {
  if (!pluginManager) return;

  const marketplaceDir = path.join(process.cwd(), "plugins", "marketplace");

  // Check if marketplace directory exists
  if (!fs.existsSync(marketplaceDir)) {
    logger.info("[Plugins] No marketplace directory found, skipping...");
    return;
  }

  try {
    const entries = fs.readdirSync(marketplaceDir, { withFileTypes: true });
    const pluginDirs = entries.filter((entry) => entry.isDirectory());

    logger.info(`[Plugins] Found ${pluginDirs.length} marketplace plugin(s) on disk`);

    for (const dir of pluginDirs) {
      const pluginPath = path.join(marketplaceDir, dir.name);
      const manifestPath = path.join(pluginPath, "manifest.json");

      // Check if manifest exists
      if (!fs.existsSync(manifestPath)) {
        logger.warn(`[Plugins] No manifest.json found in ${dir.name}, skipping...`);
        continue;
      }

      try {
        // Read and parse manifest
        const manifestContent = fs.readFileSync(manifestPath, "utf8");
        const manifest = JSON.parse(manifestContent);

        // Check if plugin is already registered (e.g., as a built-in)
        if (pluginManager.getPlugin(manifest.id)) {
          logger.info(`[Plugins] Plugin "${manifest.id}" already registered, skipping...`);
          continue;
        }

        // Create plugin manifest with proper types
        // Read icon from file if it's a file path (e.g., "icon.svg")
        const iconContent = readPluginIcon(manifest.icon as string | undefined, pluginPath);

        const pluginManifest: PluginManifest = {
          id: manifest.id as string,
          name: manifest.name as string,
          description: manifest.description as string,
          version: manifest.version as string,
          author: manifest.author as string,
          authorUrl: manifest.authorUrl as string | undefined,
          type: manifest.type as PluginType,
          icon: iconContent,
          permissions: (manifest.permissions as PluginPermission[]) || [],
          config: (manifest.config as Record<string, PluginConfigSchema>) || {},
          dependencies: (manifest.dependencies as Record<string, string>) || undefined,
        };

        // Create and register the plugin
        const plugin = createDynamicPlugin(pluginManifest);
        pluginManager.registerPlugin(plugin, {});

        logger.info(`[Plugins] Loaded marketplace plugin: ${manifest.name} (${manifest.id})`);
      } catch (error) {
        logger.error(`[Plugins] Failed to load plugin from ${dir.name}:`, error);
      }
    }
  } catch (error) {
    logger.error("[Plugins] Failed to scan marketplace directory:", error);
  }
}

/**
 * Shutdown the plugin system
 *
 * Disables and unloads all plugins gracefully.
 */
export async function shutdownPlugins(): Promise<void> {
  if (!pluginManager) return;

  logger.info("[Plugins] Shutting down plugin system...");

  try {
    await pluginManager.disableAll();
    await pluginManager.unloadAll();
    logger.info("[Plugins] Plugin system shutdown complete");
  } catch (error) {
    logger.error("[Plugins] Error during shutdown:", error);
  }
}

/**
 * Get the plugin manager instance
 */
export function getPluginManager(): PluginManager | null {
  return pluginManager;
}

/**
 * Register a builtin plugin
 *
 * Helper function to register plugins that ship with VerifyWise.
 */
export function registerBuiltinPlugin(
  plugin: Parameters<PluginManager["registerPlugin"]>[0],
  config?: Record<string, unknown>
): void {
  if (!pluginManager) {
    throw new Error("Plugin manager not initialized");
  }
  pluginManager.registerPlugin(plugin, config);
  logger.info(`[Plugins] Registered builtin plugin: ${plugin.manifest.id}`);
}
