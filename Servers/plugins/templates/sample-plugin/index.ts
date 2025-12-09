/**
 * ============================================================================
 * SAMPLE PLUGIN - VerifyWise Plugin Development Template
 * ============================================================================
 *
 * This file demonstrates all the features available to VerifyWise plugins:
 *
 * 1. LIFECYCLE HOOKS - Respond to plugin state changes
 * 2. EVENT HANDLERS - React to system events (risk created, project updated, etc.)
 * 3. CUSTOM ROUTES - Expose your own API endpoints
 * 4. DASHBOARD WIDGETS - Add widgets to the main dashboard
 * 5. CONFIGURATION - User-configurable settings
 * 6. DATA STORAGE - Persist data using the metadata API
 *
 * GETTING STARTED:
 * 1. Copy this entire folder to plugins/marketplace/your-plugin-name/
 * 2. Update manifest.json with your plugin's details
 * 3. Modify this file to implement your logic
 * 4. Restart the server - your plugin will appear in Settings > Plugins
 *
 * @packageDocumentation
 */

import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

// ============================================================================
// IMPORTS FROM PLUGIN CORE
// ============================================================================
// These types are provided by the VerifyWise plugin system.
// Import paths are relative from plugins/marketplace/your-plugin/ to plugins/core/

import {
  Plugin,           // Main plugin interface - your plugin must implement this
  PluginContext,    // Context object passed to lifecycle hooks
  PluginEvent,      // Enum of all available events to listen to
  EventHandlerMap,  // Type for the eventHandlers() return value
  PluginManifest,   // Type for the manifest object
} from "../../core";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
// Define your plugin's data structures here. TypeScript helps catch errors early.

/**
 * Represents a single item tracked by this plugin.
 * Customize this interface for your plugin's data model.
 */
interface SampleItem {
  /** Unique identifier for this item */
  id: string;
  /** Display title */
  title: string;
  /** Detailed description */
  description: string;
  /** Entity type this item relates to (project, risk, etc.) */
  entityType: string;
  /** ID of the related entity */
  entityId: number;
  /** When this item was created */
  createdAt: string;
  /** User who triggered the action */
  createdBy?: {
    userId: number;
    name: string;
  };
}

/**
 * Statistics tracked by this plugin.
 */
interface PluginStats {
  totalItems: number;
  itemsByType: Record<string, number>;
  lastUpdated: string;
}

// ============================================================================
// PLUGIN STATE
// ============================================================================
// Module-level variables to maintain state across requests.
// Note: These reset when the server restarts. Use ctx.metadata for persistence.

/** In-memory store for items (persisted to metadata API) */
let items: SampleItem[] = [];

/** Reference to plugin context for use outside lifecycle hooks */
let pluginContext: PluginContext | null = null;

/** Cached statistics */
let stats: PluginStats = {
  totalItems: 0,
  itemsByType: {},
  lastUpdated: new Date().toISOString(),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
// Extract reusable logic into helper functions for cleaner code.

/**
 * Generates a unique ID for new items.
 * Uses timestamp + random string for uniqueness.
 *
 * @returns A unique string ID
 *
 * @example
 * const id = generateId(); // "1699123456789-a1b2c3d4e"
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Adds a new item to the store and persists to metadata.
 *
 * @param item - The item to add (without id and createdAt)
 * @returns The complete item with generated id and timestamp
 *
 * @example
 * const item = await addItem({
 *   title: "New Risk",
 *   description: "Risk was created",
 *   entityType: "risk",
 *   entityId: 123
 * });
 */
async function addItem(
  item: Omit<SampleItem, "id" | "createdAt">
): Promise<SampleItem> {
  const newItem: SampleItem = {
    ...item,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  // Add to beginning of array (most recent first)
  items.unshift(newItem);

  // Enforce maximum items limit from config
  const maxItems = pluginContext?.config.get("maxItems", 50) ?? 50;
  if (items.length > maxItems) {
    items = items.slice(0, maxItems);
  }

  // Update statistics
  updateStats();

  // Persist to storage
  await persistItems();

  // Log the action (respects logLevel config)
  logAction("info", `Added item: ${item.title}`);

  return newItem;
}

/**
 * Updates the cached statistics based on current items.
 */
function updateStats(): void {
  stats = {
    totalItems: items.length,
    itemsByType: items.reduce((acc, item) => {
      acc[item.entityType] = (acc[item.entityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Persists items to the metadata API for durability.
 * Data survives server restarts.
 */
async function persistItems(): Promise<void> {
  if (!pluginContext) return;

  try {
    // Store items associated with the plugin itself (entity type "plugin", id 1)
    await pluginContext.metadata.set(
      "plugin",
      1,
      "items",
      items as unknown as Record<string, unknown>
    );
  } catch (error) {
    pluginContext.logger.error("Failed to persist items", {
      error: String(error),
    });
  }
}

/**
 * Loads items from the metadata API on plugin startup.
 *
 * @param ctx - The plugin context
 */
async function loadItems(ctx: PluginContext): Promise<void> {
  try {
    const stored = await ctx.metadata.get<SampleItem[]>("plugin", 1, "items");
    if (stored && Array.isArray(stored)) {
      items = stored;
      updateStats();
      ctx.logger.info(`Loaded ${items.length} items from storage`);
    }
  } catch (error) {
    ctx.logger.error("Failed to load items", { error: String(error) });
  }
}

/**
 * Logs a message respecting the configured log level.
 *
 * @param level - The log level for this message
 * @param message - The message to log
 * @param data - Optional additional data
 */
function logAction(
  level: "debug" | "info" | "warn" | "error",
  message: string,
  data?: Record<string, unknown>
): void {
  if (!pluginContext) return;

  const configLevel = pluginContext.config.get("logLevel", "info") as string;
  const levels = ["debug", "info", "warn", "error"];
  const configLevelIndex = levels.indexOf(configLevel);
  const messageLevelIndex = levels.indexOf(level);

  // Only log if message level is >= configured level
  if (messageLevelIndex >= configLevelIndex) {
    pluginContext.logger[level](message, data);
  }
}

/**
 * Safely extracts a string property from an object.
 * Handles nested objects and provides fallback.
 *
 * @param obj - The object to extract from
 * @param keys - Property names to try, in order of preference
 * @returns The first non-empty string found, or "Unknown"
 *
 * @example
 * const name = safeGetString(project, "project_title", "name", "title");
 */
function safeGetString(
  obj: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return "Unknown";
}

/**
 * Reads the plugin icon from disk.
 *
 * @returns SVG content as string, or empty string if not found
 */
function loadIcon(): string {
  try {
    const iconPath = path.join(__dirname, "icon.svg");
    return fs.readFileSync(iconPath, "utf8");
  } catch {
    return "";
  }
}

/**
 * Reads and parses the manifest.json file.
 * Falls back to a default manifest if file cannot be read.
 *
 * @returns The plugin manifest
 */
function loadManifest(): PluginManifest & { ui?: unknown } {
  try {
    const manifestPath = path.join(__dirname, "manifest.json");
    const content = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(content);

    // Remove comment fields (they're just for documentation)
    const cleaned = Object.fromEntries(
      Object.entries(manifest).filter(([key]) => !key.startsWith("_comment"))
    );

    return cleaned as PluginManifest & { ui?: unknown };
  } catch (error) {
    console.error("Failed to load manifest:", error);

    // Return minimal default manifest
    return {
      id: "sample-plugin",
      name: "Sample Plugin",
      description: "A sample plugin template",
      version: "1.0.0",
      author: "VerifyWise",
      type: "feature",
      permissions: ["events:listen"],
      config: {},
    };
  }
}

// ============================================================================
// PLUGIN DEFINITION
// ============================================================================
// This is the main plugin object that VerifyWise loads.
// It must be the default export of the file.

/**
 * Sample Plugin
 *
 * A comprehensive example demonstrating all VerifyWise plugin capabilities.
 * Use this as a starting point for your own plugins.
 */
const samplePlugin: Plugin = {
  // --------------------------------------------------------------------------
  // MANIFEST
  // --------------------------------------------------------------------------
  // The manifest contains plugin metadata. It's loaded from manifest.json
  // and enriched with the icon at runtime.

  manifest: {
    ...loadManifest(),
    icon: loadIcon(),
  },

  // --------------------------------------------------------------------------
  // LIFECYCLE HOOKS
  // --------------------------------------------------------------------------
  // These methods are called at different stages of the plugin lifecycle.
  // Implement only the ones you need.

  /**
   * Called when the plugin is first installed.
   * Use this for one-time setup like database migrations.
   *
   * @param ctx - Plugin context with access to services
   *
   * @example
   * // Create database tables
   * await ctx.db.query(`
   *   CREATE TABLE IF NOT EXISTS my_plugin_data (...)
   * `);
   */
  async onInstall(ctx: PluginContext): Promise<void> {
    ctx.logger.info("=== Sample Plugin: Installing ===");

    // Example: Initialize default data
    await ctx.metadata.set("plugin", 1, "installDate", {
      date: new Date().toISOString(),
    });

    ctx.logger.info("Sample Plugin installed successfully");
  },

  /**
   * Called when the plugin is uninstalled.
   * Clean up all plugin data here.
   *
   * @param ctx - Plugin context
   */
  async onUninstall(ctx: PluginContext): Promise<void> {
    ctx.logger.info("=== Sample Plugin: Uninstalling ===");

    // Clean up all stored data
    await ctx.metadata.delete("plugin", 1, "items");
    await ctx.metadata.delete("plugin", 1, "installDate");

    ctx.logger.info("Sample Plugin uninstalled, all data removed");
  },

  /**
   * Called when the plugin is loaded into memory.
   * This happens on server startup (for enabled plugins) or when first enabled.
   *
   * @param ctx - Plugin context
   */
  async onLoad(ctx: PluginContext): Promise<void> {
    ctx.logger.info("=== Sample Plugin: Loading ===");

    // Store context reference for use in helper functions
    pluginContext = ctx;

    // Load persisted data
    await loadItems(ctx);

    // Log current configuration
    ctx.logger.debug("Plugin configuration:", ctx.config.getAll());

    ctx.logger.info("Sample Plugin loaded");
  },

  /**
   * Called when the plugin is unloaded from memory.
   * This happens on server shutdown or when the plugin is disabled.
   *
   * @param ctx - Plugin context
   */
  async onUnload(ctx: PluginContext): Promise<void> {
    ctx.logger.info("=== Sample Plugin: Unloading ===");

    // Clear context reference
    pluginContext = null;

    // Save any pending data
    await persistItems();

    ctx.logger.info("Sample Plugin unloaded");
  },

  /**
   * Called when the plugin is enabled (activated).
   * Start processing events and tasks here.
   *
   * @param ctx - Plugin context
   */
  async onEnable(ctx: PluginContext): Promise<void> {
    ctx.logger.info("=== Sample Plugin: Enabling ===");

    // Ensure context is available
    pluginContext = ctx;

    // Example: Register a scheduled task (if you have scheduler:use permission)
    // ctx.scheduler.register("hourly-task", "0 * * * *", async () => {
    //   ctx.logger.info("Hourly task running");
    // });

    ctx.logger.info("Sample Plugin enabled and ready");
  },

  /**
   * Called when the plugin is disabled.
   * Stop processing but don't clean up data (user may re-enable).
   *
   * @param ctx - Plugin context
   */
  async onDisable(ctx: PluginContext): Promise<void> {
    ctx.logger.info("=== Sample Plugin: Disabling ===");

    // Example: Cancel scheduled tasks
    // ctx.scheduler.cancel("hourly-task");

    ctx.logger.info("Sample Plugin disabled");
  },

  // --------------------------------------------------------------------------
  // EVENT HANDLERS
  // --------------------------------------------------------------------------
  // React to system events. Requires "events:listen" permission.
  // Return a map of event names to handler functions.

  /**
   * Returns a map of event handlers.
   * Each handler receives a payload with event-specific data.
   *
   * @returns Object mapping event names to handler functions
   *
   * Available events:
   * - PROJECT_CREATED, PROJECT_UPDATED, PROJECT_DELETED
   * - RISK_CREATED, RISK_UPDATED, RISK_DELETED
   * - TASK_CREATED, TASK_UPDATED, TASK_DELETED
   * - VENDOR_CREATED, VENDOR_UPDATED, VENDOR_DELETED
   * - USER_LOGIN, USER_LOGOUT
   */
  eventHandlers(): EventHandlerMap {
    return {
      // ---------------------------------------------------------------------
      // PROJECT EVENTS
      // ---------------------------------------------------------------------

      /**
       * Fired when a new project is created.
       *
       * Payload: {
       *   projectId: number,
       *   project: { project_title, description, ... },
       *   triggeredBy: { userId, name }
       * }
       */
      [PluginEvent.PROJECT_CREATED]: async (payload) => {
        const { projectId, project, triggeredBy } = payload;

        await addItem({
          title: "Project created",
          description: `Project "${safeGetString(
            project,
            "project_title",
            "name"
          )}" was created`,
          entityType: "project",
          entityId: projectId,
          createdBy: triggeredBy,
        });

        // Example: Send notification if enabled
        if (pluginContext?.config.get("enableNotifications", true)) {
          logAction("info", `Notification: New project created by ${triggeredBy?.name}`);
        }
      },

      /**
       * Fired when a project is updated.
       */
      [PluginEvent.PROJECT_UPDATED]: async (payload) => {
        const { projectId, project, triggeredBy } = payload;

        await addItem({
          title: "Project updated",
          description: `Project "${safeGetString(
            project,
            "project_title",
            "name"
          )}" was modified`,
          entityType: "project",
          entityId: projectId,
          createdBy: triggeredBy,
        });
      },

      /**
       * Fired when a project is deleted.
       */
      [PluginEvent.PROJECT_DELETED]: async (payload) => {
        const { projectId, project, triggeredBy } = payload;

        await addItem({
          title: "Project deleted",
          description: `Project "${safeGetString(
            project,
            "project_title",
            "name"
          )}" was removed`,
          entityType: "project",
          entityId: projectId,
          createdBy: triggeredBy,
        });
      },

      // ---------------------------------------------------------------------
      // RISK EVENTS
      // ---------------------------------------------------------------------

      [PluginEvent.RISK_CREATED]: async (payload) => {
        const { riskId, risk, triggeredBy } = payload;

        await addItem({
          title: "Risk identified",
          description: `New risk "${safeGetString(
            risk,
            "risk_name",
            "name",
            "title"
          )}" was added`,
          entityType: "risk",
          entityId: riskId,
          createdBy: triggeredBy,
        });
      },

      [PluginEvent.RISK_UPDATED]: async (payload) => {
        const { riskId, risk, triggeredBy } = payload;

        await addItem({
          title: "Risk updated",
          description: `Risk "${safeGetString(
            risk,
            "risk_name",
            "name",
            "title"
          )}" was modified`,
          entityType: "risk",
          entityId: riskId,
          createdBy: triggeredBy,
        });
      },

      [PluginEvent.RISK_DELETED]: async (payload) => {
        const { riskId, risk, triggeredBy } = payload;

        await addItem({
          title: "Risk resolved",
          description: `Risk "${safeGetString(
            risk,
            "risk_name",
            "name",
            "title"
          )}" was removed`,
          entityType: "risk",
          entityId: riskId,
          createdBy: triggeredBy,
        });
      },

      // ---------------------------------------------------------------------
      // TASK EVENTS
      // ---------------------------------------------------------------------

      [PluginEvent.TASK_CREATED]: async (payload) => {
        const { taskId, task, triggeredBy } = payload;

        await addItem({
          title: "Task created",
          description: `Task "${safeGetString(
            task,
            "task_title",
            "name",
            "title"
          )}" was created`,
          entityType: "task",
          entityId: taskId,
          createdBy: triggeredBy,
        });
      },

      [PluginEvent.TASK_UPDATED]: async (payload) => {
        const { taskId, task, triggeredBy } = payload;

        await addItem({
          title: "Task updated",
          description: `Task "${safeGetString(
            task,
            "task_title",
            "name",
            "title"
          )}" was modified`,
          entityType: "task",
          entityId: taskId,
          createdBy: triggeredBy,
        });
      },

      [PluginEvent.TASK_DELETED]: async (payload) => {
        const { taskId, task, triggeredBy } = payload;

        await addItem({
          title: "Task completed",
          description: `Task "${safeGetString(
            task,
            "task_title",
            "name",
            "title"
          )}" was completed or removed`,
          entityType: "task",
          entityId: taskId,
          createdBy: triggeredBy,
        });
      },

      // ---------------------------------------------------------------------
      // VENDOR EVENTS
      // ---------------------------------------------------------------------

      [PluginEvent.VENDOR_CREATED]: async (payload) => {
        const { vendorId, vendor, triggeredBy } = payload;

        await addItem({
          title: "Vendor added",
          description: `Vendor "${safeGetString(
            vendor,
            "vendor_name",
            "name"
          )}" was added`,
          entityType: "vendor",
          entityId: vendorId,
          createdBy: triggeredBy,
        });
      },

      [PluginEvent.VENDOR_UPDATED]: async (payload) => {
        const { vendorId, vendor, triggeredBy } = payload;

        await addItem({
          title: "Vendor updated",
          description: `Vendor "${safeGetString(
            vendor,
            "vendor_name",
            "name"
          )}" was modified`,
          entityType: "vendor",
          entityId: vendorId,
          createdBy: triggeredBy,
        });
      },

      [PluginEvent.VENDOR_DELETED]: async (payload) => {
        const { vendorId, vendor, triggeredBy } = payload;

        await addItem({
          title: "Vendor removed",
          description: `Vendor "${safeGetString(
            vendor,
            "vendor_name",
            "name"
          )}" was removed`,
          entityType: "vendor",
          entityId: vendorId,
          createdBy: triggeredBy,
        });
      },
    };
  },

  // --------------------------------------------------------------------------
  // CUSTOM ROUTES
  // --------------------------------------------------------------------------
  // Expose your own API endpoints. Routes are mounted at:
  // /api/plugins/{plugin-id}/{your-route}
  //
  // All routes automatically have:
  // - Authentication (req.user is available)
  // - Tenant context (req.tenantId is available)
  // - Rate limiting (100 requests/minute default)

  /**
   * Registers custom API routes for this plugin.
   *
   * @param router - Express router to add routes to
   *
   * Routes will be available at: /api/plugins/sample-plugin/...
   */
  routes(router: Router): void {
    // -------------------------------------------------------------------------
    // GET /api/plugins/sample-plugin/stats
    // -------------------------------------------------------------------------
    // Returns plugin statistics. Used by the stats-card dashboard widget.

    /**
     * @route GET /stats
     * @description Get plugin statistics for the dashboard widget
     * @returns {Object} Stats data formatted for stats-card template
     *
     * Response format for stats-card template:
     * {
     *   success: true,
     *   data: {
     *     value: number,      // Main value to display
     *     label: string,      // Label below the value
     *     change: string,     // Change indicator (e.g., "+5")
     *     changeType: string  // "increase" or "decrease"
     *   }
     * }
     */
    router.get("/stats", (_req: Request, res: Response) => {
      // Calculate change since yesterday (simplified example)
      const recentItems = items.filter((item) => {
        const itemDate = new Date(item.createdAt);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return itemDate > dayAgo;
      });

      res.json({
        success: true,
        data: {
          value: stats.totalItems,
          label: "Total items tracked",
          change: `+${recentItems.length}`,
          changeType: recentItems.length > 0 ? "increase" : "neutral",
        },
      });
    });

    // -------------------------------------------------------------------------
    // GET /api/plugins/sample-plugin/items
    // -------------------------------------------------------------------------
    // Returns list of items. Used by the list dashboard widget.

    /**
     * @route GET /items
     * @description Get list of tracked items
     * @query {number} limit - Maximum items to return (default: 10)
     * @query {number} offset - Items to skip (default: 0)
     * @query {string} type - Filter by entity type (optional)
     * @returns {Object} List data formatted for list template
     *
     * Response format for list template:
     * {
     *   success: true,
     *   data: {
     *     items: [
     *       {
     *         id: string,
     *         title: string,
     *         subtitle: string,
     *         icon: string,       // Lucide icon name
     *         timestamp: string
     *       }
     *     ],
     *     total: number
     *   }
     * }
     */
    router.get("/items", (req: Request, res: Response) => {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const typeFilter = req.query.type as string;

      // Apply optional type filter
      let filteredItems = items;
      if (typeFilter) {
        filteredItems = items.filter((item) => item.entityType === typeFilter);
      }

      // Paginate
      const paginatedItems = filteredItems.slice(offset, offset + limit);

      // Map to list template format
      const listItems = paginatedItems.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.description,
        icon: getIconForType(item.entityType),
        timestamp: item.createdAt,
      }));

      res.json({
        success: true,
        data: {
          items: listItems,
          total: filteredItems.length,
          limit,
          offset,
        },
      });
    });

    // -------------------------------------------------------------------------
    // GET /api/plugins/sample-plugin/items/:id
    // -------------------------------------------------------------------------
    // Get a specific item by ID

    /**
     * @route GET /items/:id
     * @description Get a specific item by ID
     * @param {string} id - Item ID
     * @returns {Object} The item or 404 error
     */
    router.get("/items/:id", (req: Request, res: Response) => {
      const item = items.find((i) => i.id === req.params.id);

      if (!item) {
        return res.status(404).json({
          success: false,
          error: "Item not found",
        });
      }

      res.json({
        success: true,
        data: item,
      });
    });

    // -------------------------------------------------------------------------
    // DELETE /api/plugins/sample-plugin/items
    // -------------------------------------------------------------------------
    // Clear all items (admin action)

    /**
     * @route DELETE /items
     * @description Clear all tracked items
     * @returns {Object} Success message
     */
    router.delete("/items", async (_req: Request, res: Response) => {
      const count = items.length;
      items = [];
      updateStats();
      await persistItems();

      logAction("warn", `Cleared ${count} items`);

      res.json({
        success: true,
        message: `Cleared ${count} items`,
      });
    });

    // -------------------------------------------------------------------------
    // POST /api/plugins/sample-plugin/test
    // -------------------------------------------------------------------------
    // Test endpoint for development

    /**
     * @route POST /test
     * @description Test endpoint - creates a test item
     * @body {string} message - Test message
     * @returns {Object} The created test item
     */
    router.post("/test", async (req: Request, res: Response) => {
      const message = req.body.message || "Test item";

      const item = await addItem({
        title: "Test event",
        description: message,
        entityType: "test",
        entityId: 0,
        createdBy: {
          userId: (req as unknown as { user?: { id: number } }).user?.id || 0,
          name: "Test User",
        },
      });

      res.json({
        success: true,
        data: item,
      });
    });

    // -------------------------------------------------------------------------
    // GET /api/plugins/sample-plugin/health
    // -------------------------------------------------------------------------
    // Health check endpoint

    /**
     * @route GET /health
     * @description Health check endpoint
     * @returns {Object} Plugin health status
     */
    router.get("/health", (_req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          status: "healthy",
          version: loadManifest().version,
          itemCount: items.length,
          uptime: process.uptime(),
        },
      });
    });
  },
};

// ============================================================================
// HELPER: Icon Mapping
// ============================================================================

/**
 * Maps entity types to Lucide icon names for the list widget.
 *
 * @param type - Entity type
 * @returns Lucide icon name
 */
function getIconForType(type: string): string {
  const iconMap: Record<string, string> = {
    project: "FolderKanban",
    risk: "AlertTriangle",
    task: "CheckSquare",
    vendor: "Building2",
    test: "FlaskConical",
  };
  return iconMap[type] || "Circle";
}

// ============================================================================
// EXPORT
// ============================================================================
// The plugin must be the default export

export default samplePlugin;
