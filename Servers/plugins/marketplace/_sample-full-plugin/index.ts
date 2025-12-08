/**
 * Sample Full Plugin
 *
 * This is a comprehensive example demonstrating the unified plugin architecture.
 * Marketplace plugins can now include full TypeScript/JavaScript code with:
 * - Lifecycle hooks (onInstall, onUninstall, onEnable, onDisable, onLoad, onUnload)
 * - Custom routes (API endpoints)
 * - Event handlers (subscribe to system events)
 * - UI extensions (dashboard widgets, settings panels)
 *
 * To create your own plugin:
 * 1. Copy this directory as a template
 * 2. Update manifest.json with your plugin details
 * 3. Implement the features you need
 * 4. The plugin will be auto-loaded when placed in plugins/marketplace/
 */

import { Router, Request, Response } from "express";
import {
  Plugin,
  PluginManifest,
  PluginContext,
  PluginType,
  PluginPermission,
} from "../../core";

// Plugin manifest - should match manifest.json
const manifest: PluginManifest = {
  id: "sample-full-plugin",
  name: "Sample Full Plugin",
  description:
    "A sample plugin demonstrating the full TypeScript plugin architecture with routes, events, and UI extensions.",
  version: "1.0.0",
  author: "VerifyWise",
  authorUrl: "https://verifywise.ai",
  type: "integration" as PluginType,
  permissions: [
    "read:projects" as PluginPermission,
    "write:projects" as PluginPermission,
    "events:subscribe" as PluginPermission,
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
};

// In-memory storage for demo purposes
let syncStatus = {
  lastSync: null as Date | null,
  itemsSynced: 0,
  status: "idle" as "idle" | "syncing" | "error",
};

let syncInterval: NodeJS.Timeout | null = null;

/**
 * Sample Full Plugin
 *
 * Demonstrates all plugin capabilities available in the unified architecture.
 */
const plugin: Plugin = {
  manifest,

  /**
   * Called when the plugin is first installed
   * Use this for one-time setup (e.g., creating database tables)
   */
  async onInstall(context: PluginContext): Promise<void> {
    context.logger.info("Sample Full Plugin installed");

    // Example: Create a custom table for this plugin
    // await context.db.query(`
    //   CREATE TABLE IF NOT EXISTS sample_plugin_data (
    //     id SERIAL PRIMARY KEY,
    //     key VARCHAR(255) NOT NULL,
    //     value JSONB,
    //     created_at TIMESTAMP DEFAULT NOW()
    //   )
    // `);
  },

  /**
   * Called when the plugin is uninstalled
   * Use this for cleanup (e.g., dropping database tables)
   */
  async onUninstall(context: PluginContext): Promise<void> {
    context.logger.info("Sample Full Plugin uninstalled");

    // Example: Drop custom tables
    // await context.db.query(`DROP TABLE IF EXISTS sample_plugin_data`);
  },

  /**
   * Called when the plugin is loaded into memory
   * Use this for initialization that doesn't require the plugin to be enabled
   */
  async onLoad(context: PluginContext): Promise<void> {
    context.logger.info("Sample Full Plugin loaded");
  },

  /**
   * Called when the plugin is unloaded from memory
   * Use this for cleanup of resources
   */
  async onUnload(context: PluginContext): Promise<void> {
    context.logger.info("Sample Full Plugin unloaded");

    // Clear any running intervals
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  },

  /**
   * Called when the plugin is enabled by the user
   * Use this to start background tasks, subscribe to events, etc.
   */
  async onEnable(context: PluginContext): Promise<void> {
    context.logger.info("Sample Full Plugin enabled");

    // Get config values
    const config = context.getConfig();
    const intervalMinutes = (config?.syncInterval as number) || 30;
    const enableNotifications = (config?.enableNotifications as boolean) ?? true;

    // Start sync interval
    syncInterval = setInterval(
      async () => {
        await performSync(context);
      },
      intervalMinutes * 60 * 1000
    );

    // Subscribe to events
    context.eventBus.on("project:created", async (data) => {
      context.logger.info(`Project created: ${data.projectId}`);

      if (enableNotifications) {
        // Example: Send notification
        context.eventBus.emit("notification:send", {
          type: "info",
          title: "New Project",
          message: `Project ${data.name} was created`,
        });
      }
    });

    context.eventBus.on("risk:created", async (data) => {
      context.logger.info(`Risk created: ${data.riskId}`);
    });

    // Perform initial sync
    await performSync(context);
  },

  /**
   * Called when the plugin is disabled by the user
   * Use this to stop background tasks, unsubscribe from events, etc.
   */
  async onDisable(context: PluginContext): Promise<void> {
    context.logger.info("Sample Full Plugin disabled");

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
   * Define custom API routes for this plugin
   * Routes are mounted at /api/plugins/{pluginId}/
   *
   * Example: GET /api/plugins/sample-full-plugin/status
   */
  routes(router: Router): void {
    // GET /api/plugins/sample-full-plugin/status
    // Returns current sync status
    router.get("/status", (req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          ...syncStatus,
          lastSync: syncStatus.lastSync?.toISOString() || null,
        },
      });
    });

    // POST /api/plugins/sample-full-plugin/sync
    // Triggers a manual sync
    router.post("/sync", async (req: Request, res: Response) => {
      try {
        // In a real plugin, you'd have access to context here
        // For demo, we simulate a sync
        syncStatus.status = "syncing";

        // Simulate async work
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

    // GET /api/plugins/sample-full-plugin/dashboard/widget
    // Returns data for the dashboard widget
    router.get("/dashboard/widget", (req: Request, res: Response) => {
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
   * Define UI extensions for this plugin
   * These are registered with the frontend and rendered in appropriate locations
   */
  uiExtensions: {
    // Dashboard widgets
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

    // Settings panel (rendered in plugin settings)
    settingsPanel: {
      component: "PluginSettingsForm",
      props: {
        showAdvanced: true,
      },
    },
  },
};

/**
 * Perform a sync operation
 */
async function performSync(context: PluginContext): Promise<void> {
  if (syncStatus.status === "syncing") {
    context.logger.info("Sync already in progress, skipping...");
    return;
  }

  try {
    syncStatus.status = "syncing";
    context.logger.info("Starting sync...");

    // Get config
    const config = context.getConfig();
    const apiEndpoint = (config?.apiEndpoint as string) || "https://api.example.com";

    // In a real plugin, you would:
    // 1. Fetch data from external API
    // 2. Process and transform data
    // 3. Store in database or update VerifyWise entities

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update sync status
    syncStatus.lastSync = new Date();
    syncStatus.itemsSynced += Math.floor(Math.random() * 5) + 1;
    syncStatus.status = "idle";

    context.logger.info(
      `Sync completed. Total items synced: ${syncStatus.itemsSynced}`
    );

    // Emit event for other plugins/systems to react to
    context.eventBus.emit("plugin:sample-full-plugin:sync-completed", {
      itemsSynced: syncStatus.itemsSynced,
      timestamp: syncStatus.lastSync,
    });
  } catch (error) {
    syncStatus.status = "error";
    context.logger.error("Sync failed:", error);

    // Emit error event
    context.eventBus.emit("plugin:sample-full-plugin:sync-failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
    });
  }
}

/**
 * Format a date as relative time (e.g., "5 minutes ago")
 */
function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Export the plugin (supports both default and named exports)
export default plugin;
export { plugin };
