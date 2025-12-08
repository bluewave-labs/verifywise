/**
 * Activity Feed Plugin
 *
 * Tracks and displays recent activity across VerifyWise.
 * Listens to various events and stores them in the metadata API.
 */

import { Router } from "express";
import {
  Plugin,
  PluginContext,
  PluginEvent,
  EventHandlerMap,
  PluginManifest,
} from "../../core";
import fs from "fs";
import path from "path";

// Activity types for display
type ActivityType =
  | "project_created"
  | "project_updated"
  | "project_deleted"
  | "risk_created"
  | "risk_updated"
  | "risk_deleted"
  | "task_created"
  | "task_updated"
  | "task_deleted"
  | "vendor_created"
  | "vendor_updated"
  | "vendor_deleted";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  entityId: number;
  entityType: string;
  userId?: number;
  userName?: string;
  timestamp: string;
}

// In-memory activity store (will be persisted via metadata API)
let activities: Activity[] = [];
let pluginContext: PluginContext | null = null;

// Helper to generate activity ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to get relative time string
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Add an activity to the store
async function addActivity(activity: Omit<Activity, "id" | "timestamp">) {
  const newActivity: Activity = {
    ...activity,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  // Add to beginning of array
  activities.unshift(newActivity);

  // Trim to max activities
  const maxActivities = pluginContext?.config.get("maxActivities", 50) ?? 50;
  if (activities.length > maxActivities) {
    activities = activities.slice(0, maxActivities);
  }

  // Persist to metadata
  if (pluginContext) {
    try {
      await pluginContext.metadata.set("plugin", 1, "activities", activities as unknown as Record<string, unknown>);
    } catch (error) {
      pluginContext.logger.error("Failed to persist activities:", error as Record<string, unknown>);
    }
  }

  return newActivity;
}

// Load activities from metadata
async function loadActivities(ctx: PluginContext) {
  try {
    const stored = await ctx.metadata.get<Activity[]>("plugin", 1, "activities");
    if (stored && Array.isArray(stored)) {
      activities = stored;
      ctx.logger.info(`Loaded ${activities.length} activities from storage`);
    }
  } catch (error) {
    ctx.logger.error("Failed to load activities:", error as Record<string, unknown>);
  }
}

// Read icon from file
function getIcon(): string {
  try {
    const iconPath = path.join(__dirname, "icon.svg");
    return fs.readFileSync(iconPath, "utf8");
  } catch {
    return "";
  }
}

// Helper to safely extract name from nested entity
function getEntityName(entity: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = entity[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return "Untitled";
}

// Helper to safely extract id from nested entity
function getEntityId(entity: Record<string, unknown>): number {
  const id = entity.id;
  return typeof id === "number" ? id : 0;
}

// Extended manifest type to include UI extensions
interface ExtendedManifest extends PluginManifest {
  ui?: {
    dashboardWidgets?: Array<{
      id: string;
      template: string;
      title: string;
      endpoint: string;
      config?: Record<string, unknown>;
    }>;
  };
}

// Read manifest from file (preserves all fields including ui extensions)
function loadManifest(): ExtendedManifest {
  try {
    const manifestPath = path.join(__dirname, "manifest.json");
    const content = fs.readFileSync(manifestPath, "utf8");
    return JSON.parse(content) as ExtendedManifest;
  } catch {
    // Return a default manifest if file cannot be read
    return {
      id: "activity-feed",
      name: "Activity feed",
      description: "Tracks and displays recent activity across VerifyWise",
      version: "1.0.0",
      author: "VerifyWise",
      type: "feature",
      permissions: ["events:listen", "database:read", "database:write"],
      config: {},
      ui: {
        dashboardWidgets: [
          {
            id: "activity-feed-widget",
            template: "activity-feed",
            title: "Recent activity",
            endpoint: "/activities",
            config: {
              maxItems: 10,
              showTimestamp: true,
              showAvatar: true,
            },
          },
        ],
      },
    };
  }
}

/**
 * Activity Feed Plugin Definition
 */
const activityFeedPlugin: Plugin = {
  manifest: {
    ...loadManifest(),
    icon: getIcon(),
  },

  async onInstall(ctx: PluginContext): Promise<void> {
    ctx.logger.info("Activity Feed plugin installed");
  },

  async onUninstall(ctx: PluginContext): Promise<void> {
    // Clean up stored activities
    await ctx.metadata.delete("plugin", 1, "activities");
    ctx.logger.info("Activity Feed plugin uninstalled, data cleaned up");
  },

  async onLoad(ctx: PluginContext): Promise<void> {
    pluginContext = ctx;
    await loadActivities(ctx);
    ctx.logger.info("Activity Feed plugin loaded");
  },

  async onUnload(ctx: PluginContext): Promise<void> {
    pluginContext = null;
    ctx.logger.info("Activity Feed plugin unloaded");
  },

  async onEnable(ctx: PluginContext): Promise<void> {
    pluginContext = ctx;
    ctx.logger.info("Activity Feed plugin enabled");
  },

  async onDisable(ctx: PluginContext): Promise<void> {
    ctx.logger.info("Activity Feed plugin disabled");
  },

  /**
   * Event handlers - listen to various events and record activity
   */
  eventHandlers(): EventHandlerMap {
    return {
      // Project events
      [PluginEvent.PROJECT_CREATED]: async (payload) => {
        const project = payload.project;
        await addActivity({
          type: "project_created",
          title: "Project created",
          description: `New project "${getEntityName(project, "project_title", "name", "title")}" was created`,
          entityId: payload.projectId,
          entityType: "project",
          userId: payload.triggeredBy?.userId,
          userName: payload.triggeredBy?.name,
        });
      },

      [PluginEvent.PROJECT_UPDATED]: async (payload) => {
        const project = payload.project;
        await addActivity({
          type: "project_updated",
          title: "Project updated",
          description: `Project "${getEntityName(project, "project_title", "name", "title")}" was updated`,
          entityId: payload.projectId,
          entityType: "project",
          userId: payload.triggeredBy?.userId,
          userName: payload.triggeredBy?.name,
        });
      },

      [PluginEvent.PROJECT_DELETED]: async (payload) => {
        const project = payload.project;
        await addActivity({
          type: "project_deleted",
          title: "Project deleted",
          description: `Project "${getEntityName(project, "project_title", "name", "title")}" was deleted`,
          entityId: payload.projectId,
          entityType: "project",
          userId: payload.triggeredBy?.userId,
          userName: payload.triggeredBy?.name,
        });
      },

      // Risk events
      [PluginEvent.RISK_CREATED]: async (payload) => {
        const risk = payload.risk;
        await addActivity({
          type: "risk_created",
          title: "Risk created",
          description: `New risk "${getEntityName(risk, "risk_name", "name", "title")}" was identified`,
          entityId: payload.riskId,
          entityType: "risk",
          userId: payload.triggeredBy?.userId,
          userName: payload.triggeredBy?.name,
        });
      },

      [PluginEvent.RISK_UPDATED]: async (payload) => {
        const risk = payload.risk;
        await addActivity({
          type: "risk_updated",
          title: "Risk updated",
          description: `Risk "${getEntityName(risk, "risk_name", "name", "title")}" was updated`,
          entityId: payload.riskId,
          entityType: "risk",
          userId: payload.triggeredBy?.userId,
          userName: payload.triggeredBy?.name,
        });
      },

      [PluginEvent.RISK_DELETED]: async (payload) => {
        const risk = payload.risk;
        await addActivity({
          type: "risk_deleted",
          title: "Risk deleted",
          description: `Risk "${getEntityName(risk, "risk_name", "name", "title")}" was removed`,
          entityId: payload.riskId,
          entityType: "risk",
          userId: payload.triggeredBy?.userId,
          userName: payload.triggeredBy?.name,
        });
      },

      // Task events
      [PluginEvent.TASK_CREATED]: async (payload) => {
        const task = payload.task;
        await addActivity({
          type: "task_created",
          title: "Task created",
          description: `New task "${getEntityName(task, "task_title", "name", "title")}" was created`,
          entityId: payload.taskId,
          entityType: "task",
          userId: payload.triggeredBy?.userId,
          userName: payload.triggeredBy?.name,
        });
      },

      [PluginEvent.TASK_UPDATED]: async (payload) => {
        const task = payload.task;
        await addActivity({
          type: "task_updated",
          title: "Task updated",
          description: `Task "${getEntityName(task, "task_title", "name", "title")}" was updated`,
          entityId: payload.taskId,
          entityType: "task",
          userId: payload.triggeredBy?.userId,
          userName: payload.triggeredBy?.name,
        });
      },

      [PluginEvent.TASK_DELETED]: async (payload) => {
        const task = payload.task;
        await addActivity({
          type: "task_deleted",
          title: "Task deleted",
          description: `Task "${getEntityName(task, "task_title", "name", "title")}" was completed or removed`,
          entityId: payload.taskId,
          entityType: "task",
          userId: payload.triggeredBy?.userId,
          userName: payload.triggeredBy?.name,
        });
      },

      // Vendor events
      [PluginEvent.VENDOR_CREATED]: async (payload) => {
        const vendor = payload.vendor;
        await addActivity({
          type: "vendor_created",
          title: "Vendor added",
          description: `New vendor "${getEntityName(vendor, "vendor_name", "name")}" was added`,
          entityId: payload.vendorId,
          entityType: "vendor",
          userId: payload.triggeredBy?.userId,
          userName: payload.triggeredBy?.name,
        });
      },

      [PluginEvent.VENDOR_UPDATED]: async (payload) => {
        const vendor = payload.vendor;
        await addActivity({
          type: "vendor_updated",
          title: "Vendor updated",
          description: `Vendor "${getEntityName(vendor, "vendor_name", "name")}" was updated`,
          entityId: payload.vendorId,
          entityType: "vendor",
          userId: payload.triggeredBy?.userId,
          userName: payload.triggeredBy?.name,
        });
      },

      [PluginEvent.VENDOR_DELETED]: async (payload) => {
        const vendor = payload.vendor;
        await addActivity({
          type: "vendor_deleted",
          title: "Vendor removed",
          description: `Vendor "${getEntityName(vendor, "vendor_name", "name")}" was removed`,
          entityId: payload.vendorId,
          entityType: "vendor",
          userId: payload.triggeredBy?.userId,
          userName: payload.triggeredBy?.name,
        });
      },
    };
  },

  /**
   * Routes - expose activity data via API
   */
  routes(router: Router): void {
    // GET /api/plugins/activity-feed/activities
    router.get("/activities", (_req, res) => {
      const limit = parseInt(_req.query.limit as string) || 10;
      const offset = parseInt(_req.query.offset as string) || 0;

      const paginatedActivities = activities.slice(offset, offset + limit);

      // Add relative time to each activity
      const activitiesWithRelativeTime = paginatedActivities.map((activity) => ({
        ...activity,
        relativeTime: getRelativeTime(new Date(activity.timestamp)),
      }));

      res.json({
        success: true,
        data: {
          activities: activitiesWithRelativeTime,
          total: activities.length,
          limit,
          offset,
        },
      });
    });

    // GET /api/plugins/activity-feed/stats
    router.get("/stats", (_req, res) => {
      const stats = {
        total: activities.length,
        byType: activities.reduce((acc, activity) => {
          acc[activity.type] = (acc[activity.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        lastActivity: activities[0]?.timestamp || null,
      };

      res.json({
        success: true,
        data: stats,
      });
    });

    // DELETE /api/plugins/activity-feed/activities (clear all)
    router.delete("/activities", async (_req, res) => {
      activities = [];
      if (pluginContext) {
        await pluginContext.metadata.delete("plugin", 1, "activities");
      }
      res.json({
        success: true,
        message: "All activities cleared",
      });
    });
  },
};

export default activityFeedPlugin;
