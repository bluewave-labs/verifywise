/**
 * VerifyWise Plugin System - Initialization
 *
 * Initializes the plugin manager and loads all registered plugins.
 * This module should be imported and called during server startup.
 */

import { Application, Router, Request, Response, NextFunction } from "express";
import { PluginManager, createDatabaseService, PluginManifest, PluginType, PluginPermission, PluginConfigSchema, Plugin, MiddlewareRegistry, PluginHotReload } from "./core";
import { setPluginManager, createDynamicPlugin } from "../controllers/plugin.ctrl";
import { sequelize } from "../database/db";
import { builtinPlugins } from "./builtin";
import logger from "../utils/logger/fileLogger";
import path from "path";
import fs from "fs";
import { registerAutomationHandlers } from "./core/automationHandler";
import authenticateJWT from "../middleware/auth.middleware";

// Global middleware registry instance
const middlewareRegistry = new MiddlewareRegistry();

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

// Hot reload instance (development only)
let hotReload: PluginHotReload | null = null;

// Store app reference for mounting routes
let expressApp: Application | null = null;

// Track mounted plugin routes to avoid duplicates
const mountedPluginRoutes: Set<string> = new Set();

/**
 * Create error handling middleware for plugin routes
 *
 * Catches errors from plugin route handlers and returns a standardized error response.
 * Prevents plugin errors from crashing the server.
 *
 * @param pluginId - The plugin ID for logging context
 * @returns Express error handling middleware
 */
function createPluginErrorHandler(pluginId: string) {
  return (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    const errorMessage = err.message || "Unknown error";
    const errorStack = process.env.NODE_ENV !== "production" ? err.stack : undefined;

    logger.error(`[Plugin:${pluginId}] Route error: ${errorMessage}`, {
      path: req.path,
      method: req.method,
      stack: errorStack,
    });

    // Track error for auto-disable feature
    if (pluginManager) {
      const wasAutoDisabled = pluginManager.reportPluginError(pluginId, errorMessage);
      if (wasAutoDisabled) {
        logger.warn(`[Plugin:${pluginId}] Plugin was auto-disabled due to repeated errors`);
      }
    }

    // Return standardized error response (only if headers not already sent)
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: `Plugin error: ${errorMessage}`,
        plugin: pluginId,
      });
    }
  };
}

/**
 * Create a sandboxed router that wraps all route handlers
 *
 * Intercepts route registrations and wraps handlers to catch async errors.
 * This ensures that even unhandled promise rejections are caught.
 *
 * @param pluginId - The plugin ID for logging context
 * @returns A router with wrapped handlers
 */
function createSandboxedRouter(pluginId: string): Router {
  const router = Router();

  // Wrap a handler to catch async errors (only wrap functions)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapHandler = (handler: any): any => {
    // Only wrap if it's a function
    if (typeof handler !== "function") {
      return handler;
    }
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await handler(req, res, next);
      } catch (error) {
        logger.error(`[Plugin:${pluginId}] Async route error:`, error);
        next(error);
      }
    };
  };

  // Wrap an array of handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapHandlers = (handlers: any[]): any[] => handlers.map(wrapHandler);

  // Store original methods
  const originalGet = router.get.bind(router);
  const originalPost = router.post.bind(router);
  const originalPut = router.put.bind(router);
  const originalPatch = router.patch.bind(router);
  const originalDelete = router.delete.bind(router);
  const originalAll = router.all.bind(router);
  const originalOptions = router.options.bind(router);
  const originalHead = router.head.bind(router);

  // Override HTTP methods to wrap handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.get = function (path: any, ...handlers: any[]) {
    return originalGet(path, ...wrapHandlers(handlers));
  } as typeof router.get;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post = function (path: any, ...handlers: any[]) {
    return originalPost(path, ...wrapHandlers(handlers));
  } as typeof router.post;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.put = function (path: any, ...handlers: any[]) {
    return originalPut(path, ...wrapHandlers(handlers));
  } as typeof router.put;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.patch = function (path: any, ...handlers: any[]) {
    return originalPatch(path, ...wrapHandlers(handlers));
  } as typeof router.patch;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.delete = function (path: any, ...handlers: any[]) {
    return originalDelete(path, ...wrapHandlers(handlers));
  } as typeof router.delete;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.all = function (path: any, ...handlers: any[]) {
    return originalAll(path, ...wrapHandlers(handlers));
  } as typeof router.all;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.options = function (path: any, ...handlers: any[]) {
    return originalOptions(path, ...wrapHandlers(handlers));
  } as typeof router.options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.head = function (path: any, ...handlers: any[]) {
    return originalHead(path, ...wrapHandlers(handlers));
  } as typeof router.head;

  return router;
}

/**
 * Mount routes for a specific plugin
 *
 * Creates a router for the plugin and mounts it at /api/plugins/{pluginId}/
 */
export function mountPluginRoutes(plugin: Plugin): void {
  if (!expressApp || !plugin.routes) return;

  const pluginId = plugin.manifest.id;

  // Skip if already mounted
  if (mountedPluginRoutes.has(pluginId)) {
    return;
  }

  try {
    // Create a sandboxed router that wraps handlers to catch async errors
    const pluginRouter = createSandboxedRouter(pluginId);

    // Let the plugin define its routes (handlers are automatically wrapped)
    plugin.routes(pluginRouter);

    // Add plugin-specific error handler as the last middleware
    pluginRouter.use(createPluginErrorHandler(pluginId));

    // Mount the router at /api/plugins/{pluginId}/
    // Apply authentication middleware
    expressApp.use(`/api/plugins/${pluginId}`, authenticateJWT, pluginRouter);

    mountedPluginRoutes.add(pluginId);
    logger.info(`[Plugins] Mounted sandboxed routes for plugin "${pluginId}" at /api/plugins/${pluginId}/`);
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

  // Create plugin manager with all required services
  pluginManager = new PluginManager({
    db,
    sequelize,
    middlewareRegistry,
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

  // Start hot reload in development mode
  if (process.env.NODE_ENV !== "production") {
    hotReload = new PluginHotReload({
      pluginManager,
      watchDirs: ["marketplace", "builtin"],
      createDynamicPlugin,
      logger: {
        info: (msg, ...args) => logger.info(`[HotReload] ${msg}`, ...args),
        warn: (msg, ...args) => logger.warn(`[HotReload] ${msg}`, ...args),
        error: (msg, ...args) => logger.error(`[HotReload] ${msg}`, ...args),
        debug: (msg, ...args) => {
          if (process.env.DEBUG_HOT_RELOAD) {
            logger.info(`[HotReload:Debug] ${msg}`, ...args);
          }
        },
      },
    });
    hotReload.start();
  }

  logger.info("[Plugins] Plugin system initialized");
  logger.info("[Plugins] Stats:", pluginManager.getStats());

  return pluginManager;
}

/**
 * Load plugin states from database and restore previous state
 *
 * IMPORTANT: Plugin default state behavior:
 * - Fresh install: No records in plugin_states table, all plugins stay DISABLED
 * - Upgrade: Records exist, plugins are restored to their previous state
 *
 * Built-in plugins are NOT auto-enabled. Users must manually enable them.
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

    const allPlugins = pluginManager.getAllPlugins();
    const isFreshInstall = states.length === 0;

    if (isFreshInstall) {
      logger.info(`[Plugins] Fresh install detected - all ${allPlugins.length} plugins will remain DISABLED by default`);
      logger.info(`[Plugins] Users can enable plugins from Settings > Plugins`);
      return;
    }

    logger.info(`[Plugins] Found ${states.length} saved plugin states (upgrade/restart detected)`);

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
 * Validate plugin ID to prevent path traversal attacks
 */
function validatePluginId(pluginId: string): void {
  // Reject empty or whitespace-only IDs
  if (!pluginId || !pluginId.trim()) {
    throw new Error("Plugin ID cannot be empty");
  }

  // Reject path traversal attempts
  if (pluginId.includes("..") || pluginId.includes("/") || pluginId.includes("\\")) {
    throw new Error("Invalid plugin ID: path traversal not allowed");
  }

  // Only allow alphanumeric, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(pluginId)) {
    throw new Error("Invalid plugin ID: only alphanumeric characters, hyphens, and underscores allowed");
  }
}

/**
 * Delete plugin files from disk
 */
export function deletePluginFiles(pluginId: string): boolean {
  // Validate plugin ID to prevent path traversal
  validatePluginId(pluginId);

  // Check both marketplace and uploaded directories
  const pluginDirs = [
    path.join(process.cwd(), "plugins", "marketplace", pluginId),
    path.join(process.cwd(), "plugins", "uploaded", pluginId),
  ];

  let deleted = false;
  for (const pluginDir of pluginDirs) {
    // Additional safety: verify the resolved path is within expected directories
    const resolvedPath = path.resolve(pluginDir);
    const expectedBase = path.resolve(process.cwd(), "plugins");
    if (!resolvedPath.startsWith(expectedBase)) {
      logger.error(`[Plugins] Path traversal attempt detected: ${pluginDir}`);
      continue;
    }

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
 * Load a full TypeScript/JavaScript plugin from disk
 *
 * Attempts to dynamically import a plugin that exports a Plugin object.
 * Supports both TypeScript (.ts) and JavaScript (.js) files.
 *
 * @param pluginPath - Path to the plugin directory
 * @param pluginId - Plugin ID for logging
 * @returns The loaded Plugin object, or null if not found
 */
async function loadFullPlugin(pluginPath: string, _pluginId: string): Promise<Plugin | null> {
  // Check for index.js or index.ts
  // Prefer .js files as they don't have import resolution issues with dynamic imports
  const jsPath = path.join(pluginPath, "index.js");
  const tsPath = path.join(pluginPath, "index.ts");

  let modulePath: string | null = null;

  if (fs.existsSync(jsPath)) {
    modulePath = jsPath;
  } else if (fs.existsSync(tsPath)) {
    modulePath = tsPath;
  }

  if (!modulePath) {
    return null;
  }

  try {
    // Dynamic import - works with both ts-node (development) and compiled JS (production)
    const pluginModule = await import(modulePath);

    // Support both default export and named 'plugin' export
    const plugin: Plugin = pluginModule.default || pluginModule.plugin;

    if (!plugin || !plugin.manifest) {
      logger.warn(`[Plugins] Module at ${modulePath} does not export a valid Plugin object`);
      return null;
    }

    logger.info(`[Plugins] Loaded full plugin from ${modulePath}`);
    return plugin;
  } catch (error) {
    logger.error(`[Plugins] Failed to import plugin module ${modulePath}:`, error);
    return null;
  }
}

/**
 * Load marketplace plugins from disk
 *
 * Scans the plugins/marketplace directory for downloaded plugins
 * and registers them with the plugin manager.
 *
 * Unified Plugin Architecture:
 * - If index.ts/index.js exists: Load full TypeScript/JavaScript plugin with all features
 * - If only manifest.json exists: Create a manifest-only plugin (backwards compatible)
 *
 * Full plugins can include: lifecycle hooks, event handlers, routes, UI extensions, etc.
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
        // Read and parse manifest for basic info
        const manifestContent = fs.readFileSync(manifestPath, "utf8");
        const manifest = JSON.parse(manifestContent);

        // Check if plugin is already registered (e.g., as a built-in)
        if (pluginManager.getPlugin(manifest.id)) {
          logger.info(`[Plugins] Plugin "${manifest.id}" already registered, skipping...`);
          continue;
        }

        // Try to load full TypeScript/JavaScript plugin first
        const fullPlugin = await loadFullPlugin(pluginPath, manifest.id);

        if (fullPlugin) {
          // Full plugin loaded - use it directly
          // Read icon if specified in manifest but not in loaded plugin
          if (!fullPlugin.manifest.icon && manifest.icon) {
            fullPlugin.manifest.icon = readPluginIcon(manifest.icon as string | undefined, pluginPath);
          }

          pluginManager.registerPlugin(fullPlugin, {});
          logger.info(`[Plugins] Loaded full marketplace plugin: ${fullPlugin.manifest.name} (${fullPlugin.manifest.id})`);
        } else {
          // No code found - fall back to manifest-only plugin
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

          // Create manifest-only plugin (backwards compatible)
          const plugin = createDynamicPlugin(pluginManifest);
          pluginManager.registerPlugin(plugin, {});

          logger.info(`[Plugins] Loaded manifest-only marketplace plugin: ${manifest.name} (${manifest.id})`);
        }
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
  logger.info("[Plugins] Shutting down plugin system...");

  // Stop hot reload first
  if (hotReload) {
    await hotReload.stop();
    hotReload = null;
  }

  if (!pluginManager) return;

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
