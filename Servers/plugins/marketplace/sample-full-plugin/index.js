/**
 * Sample Full Plugin
 *
 * This is a comprehensive example demonstrating the unified plugin architecture.
 * Marketplace plugins can include full JavaScript code with:
 * - Lifecycle hooks (onInstall, onUninstall, onEnable, onDisable, onLoad, onUnload)
 * - Custom routes (API endpoints)
 * - Event handlers (subscribe to system events)
 * - UI extensions (dashboard widgets, settings panels)
 * - Sequelize models (define custom database tables)
 * - Middleware injection (add middleware to existing routes)
 *
 * NOTE: Marketplace plugins use JavaScript (not TypeScript) to avoid import issues.
 * Types are received through the context parameter at runtime.
 */

// In-memory storage for demo purposes
let syncStatus = {
  lastSync: null,
  itemsSynced: 0,
  status: "idle", // "idle" | "syncing" | "error"
};

let syncInterval = null;
let pluginContext = null;

/**
 * Format a date as relative time (e.g., "5 minutes ago")
 */
function formatRelativeTime(date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Perform a sync operation
 */
async function performSync(context) {
  if (syncStatus.status === "syncing") {
    context.logger.info("Sync already in progress, skipping...");
    return;
  }

  try {
    syncStatus.status = "syncing";
    context.logger.info("Starting sync...");

    // Get config using the config API
    const config = context.config.getAll();
    const apiEndpoint = config?.apiEndpoint || "https://api.example.com";

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const itemsSyncedThisRun = Math.floor(Math.random() * 5) + 1;

    // Update sync status
    syncStatus.lastSync = new Date();
    syncStatus.itemsSynced += itemsSyncedThisRun;
    syncStatus.status = "idle";

    // Log sync operation to database
    const SyncLog = context.models.get("sync_logs");
    if (SyncLog) {
      await SyncLog.create({
        action: "sync",
        itemCount: itemsSyncedThisRun,
        status: "completed",
        metadata: { apiEndpoint, totalSynced: syncStatus.itemsSynced },
        syncedAt: syncStatus.lastSync,
      });
    }

    context.logger.info(
      `Sync completed. Items this run: ${itemsSyncedThisRun}, Total: ${syncStatus.itemsSynced}`
    );

    // Emit event for other plugins/systems to react to
    context.emit("plugin:sample-full-plugin:sync-completed", {
      itemsSynced: syncStatus.itemsSynced,
      timestamp: syncStatus.lastSync,
    });
  } catch (error) {
    syncStatus.status = "error";
    context.logger.error("Sync failed:", error);

    // Log failed sync to database
    const SyncLog = context.models.get("sync_logs");
    if (SyncLog) {
      await SyncLog.create({
        action: "sync",
        itemCount: 0,
        status: "failed",
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        syncedAt: new Date(),
      });
    }
  }
}

/**
 * Sample Full Plugin
 */
const plugin = {
  // Plugin manifest - matches manifest.json
  manifest: {
    id: "sample-full-plugin",
    name: "Sample Full Plugin",
    description:
      "A sample plugin demonstrating the full plugin architecture with routes, events, models, and middleware.",
    version: "1.0.0",
    author: "VerifyWise",
    authorUrl: "https://verifywise.ai",
    type: "integration",
    permissions: [
      "read:projects",
      "write:projects",
      "events:subscribe",
      "models:define",
      "middleware:inject",
    ],
    config: {
      apiEndpoint: {
        type: "string",
        label: "API Endpoint",
        description: "External API endpoint to connect to",
        default: "https://api.example.com",
      },
      syncInterval: {
        type: "number",
        label: "Sync Interval (minutes)",
        description: "How often to sync data",
        default: 30,
      },
      enableNotifications: {
        type: "boolean",
        label: "Enable Notifications",
        description: "Send notifications on important events",
        default: true,
      },
    },
  },

  /**
   * Called when the plugin is first installed
   */
  async onInstall(context) {
    context.logger.info("Sample Full Plugin installed");
    pluginContext = context;

    // Define database models
    context.models.define(
      "sync_logs",
      {
        id: { type: "integer", primaryKey: true, autoIncrement: true },
        action: { type: "string", allowNull: false },
        itemCount: { type: "integer", defaultValue: 0 },
        status: { type: "string", defaultValue: "pending" },
        metadata: { type: "json", allowNull: true },
        syncedAt: { type: "date", allowNull: true },
        createdAt: { type: "date", allowNull: false },
        updatedAt: { type: "date", allowNull: false },
      },
      {
        timestamps: true,
        indexes: [{ fields: ["action"] }, { fields: ["status"] }],
      }
    );

    context.models.define(
      "external_mappings",
      {
        id: { type: "integer", primaryKey: true, autoIncrement: true },
        entityType: { type: "string", allowNull: false },
        internalId: { type: "integer", allowNull: false },
        externalId: { type: "string", allowNull: false },
        externalSystem: { type: "string", allowNull: false },
        lastSyncedAt: { type: "date", allowNull: true },
        createdAt: { type: "date", allowNull: false },
        updatedAt: { type: "date", allowNull: false },
      },
      {
        timestamps: true,
        indexes: [
          { fields: ["entityType", "internalId"] },
          { fields: ["externalSystem", "externalId"], unique: true },
        ],
      }
    );

    // Sync models to create tables
    await context.models.sync({ alter: true });
    context.logger.info("Database models created successfully");
  },

  /**
   * Called when the plugin is uninstalled
   */
  async onUninstall(context) {
    context.logger.info("Sample Full Plugin uninstalled");

    const tables = context.models.list();
    if (tables.length > 0) {
      context.logger.info(
        `Plugin tables preserved: ${tables.join(", ")}. Use admin tools to remove if needed.`
      );
    }
  },

  /**
   * Called when the plugin is loaded
   */
  async onLoad(context) {
    context.logger.info("Sample Full Plugin loaded");
    pluginContext = context;
  },

  /**
   * Called when the plugin is unloaded
   */
  async onUnload(context) {
    context.logger.info("Sample Full Plugin unloaded");

    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  },

  /**
   * Called when the plugin is enabled
   */
  async onEnable(context) {
    context.logger.info("Sample Full Plugin enabled");
    pluginContext = context;

    const config = context.config.getAll();
    const intervalMinutes = config?.syncInterval || 30;
    const enableNotifications = config?.enableNotifications ?? true;

    // Add middleware to project routes
    context.middleware.add(
      "/api/projects/*",
      "before",
      async (ctx, next) => {
        const startTime = Date.now();
        context.logger.info(`[Audit] ${ctx.req.method} ${ctx.req.path} started`);
        await next();
        const duration = Date.now() - startTime;
        context.logger.info(
          `[Audit] ${ctx.req.method} ${ctx.req.path} completed in ${duration}ms`
        );
      }
    );

    // Log registered middleware
    const middlewareList = context.middleware.list();
    context.logger.info(`Registered ${middlewareList.length} middleware handlers`);

    // Start sync interval
    syncInterval = setInterval(
      async () => {
        await performSync(context);
      },
      intervalMinutes * 60 * 1000
    );

    // Subscribe to events
    context.on("project:created", async (data) => {
      context.logger.info(`Project created: ${data.projectId}`);

      const SyncLog = context.models.get("sync_logs");
      if (SyncLog) {
        await SyncLog.create({
          action: "project_created",
          itemCount: 1,
          status: "completed",
          metadata: { projectId: data.projectId, name: data.name },
          syncedAt: new Date(),
        });
      }

      if (enableNotifications) {
        context.emit("notification:send", {
          type: "info",
          title: "New Project",
          message: `Project ${data.name} was created`,
        });
      }
    });

    context.on("risk:created", async (data) => {
      context.logger.info(`Risk created: ${data.riskId}`);
    });

    // Perform initial sync
    await performSync(context);
  },

  /**
   * Called when the plugin is disabled
   */
  async onDisable(context) {
    context.logger.info("Sample Full Plugin disabled");

    // Remove middleware
    const removedCount = context.middleware.removeAll();
    context.logger.info(`Removed ${removedCount} middleware handlers`);

    // Stop sync interval
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }

    // Reset sync status
    syncStatus = {
      lastSync: null,
      itemsSynced: 0,
      status: "idle",
    };
  },

  /**
   * Define custom API routes
   * Routes are mounted at /api/plugins/sample-full-plugin/
   */
  routes(router) {
    // GET /api/plugins/sample-full-plugin/status
    router.get("/status", (req, res) => {
      res.json({
        success: true,
        data: {
          ...syncStatus,
          lastSync: syncStatus.lastSync?.toISOString() || null,
        },
      });
    });

    // POST /api/plugins/sample-full-plugin/sync
    router.post("/sync", async (req, res) => {
      try {
        syncStatus.status = "syncing";

        await new Promise((resolve) => setTimeout(resolve, 1000));

        syncStatus.lastSync = new Date();
        syncStatus.itemsSynced += Math.floor(Math.random() * 10) + 1;
        syncStatus.status = "idle";

        res.json({
          success: true,
          data: {
            message: "Sync completed",
            itemsSynced: syncStatus.itemsSynced,
          },
        });
      } catch (error) {
        syncStatus.status = "error";
        res.status(500).json({
          success: false,
          error: "Sync failed",
        });
      }
    });

    // GET /api/plugins/sample-full-plugin/logs
    router.get("/logs", async (req, res) => {
      try {
        if (!pluginContext) {
          return res.status(503).json({
            success: false,
            error: "Plugin not initialized",
          });
        }

        const SyncLog = pluginContext.models.get("sync_logs");
        if (!SyncLog) {
          return res.json({
            success: true,
            data: { logs: [], message: "No sync logs table found" },
          });
        }

        const logs = await SyncLog.findAll({
          order: [["createdAt", "DESC"]],
          limit: 20,
        });

        res.json({
          success: true,
          data: { logs },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message || "Failed to fetch logs",
        });
      }
    });

    // GET /api/plugins/sample-full-plugin/dashboard/widget
    router.get("/dashboard/widget", (req, res) => {
      res.json({
        success: true,
        data: {
          cards: [
            {
              id: "sync-status",
              label: "Sync Status",
              value: syncStatus.status === "idle" ? "Ready" : "Syncing...",
              icon: "activity",
              color: syncStatus.status === "idle" ? "#16a34a" : "#d97706",
            },
            {
              id: "items-synced",
              label: "Items Synced",
              value: syncStatus.itemsSynced,
              icon: "check",
              color: "#2563eb",
              change: "+5",
              changeType: "increase",
            },
            {
              id: "last-sync",
              label: "Last Sync",
              value: syncStatus.lastSync
                ? formatRelativeTime(syncStatus.lastSync)
                : "Never",
              icon: "clock",
              color: "#7c3aed",
            },
            {
              id: "connection",
              label: "Connection",
              value: "Connected",
              icon: "zap",
              color: "#13715B",
            },
          ],
        },
      });
    });
  },

  /**
   * UI extensions
   */
  uiExtensions: {
    dashboardWidgets: [
      {
        widgetId: "sample-full-plugin-status",
        pluginId: "sample-full-plugin",
        title: "Sample Plugin Status",
        template: "card-grid",
        endpoint: "/dashboard/widget",
        config: {
          columns: 2,
          refreshInterval: 30,
          compact: true,
        },
      },
    ],
    settingsPanel: {
      component: "PluginSettingsForm",
      props: {
        showAdvanced: true,
      },
    },
  },
};

// Export for CommonJS and ES modules
module.exports = plugin;
module.exports.default = plugin;
module.exports.plugin = plugin;
