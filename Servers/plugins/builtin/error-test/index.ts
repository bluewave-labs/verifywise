/**
 * @fileoverview Error Test Plugin
 *
 * A built-in plugin for testing error protection mechanisms.
 * Provides routes to verify:
 * - Sync/async error handling in routes
 * - Timeout behavior for long-running operations
 * - Auto-disable after repeated errors
 * - Error tracking and status reporting
 *
 * DO NOT USE IN PRODUCTION - This plugin intentionally throws errors.
 *
 * @module plugins/error-test
 */

import fs from "fs";
import path from "path";
import { Router, Request, Response } from "express";
import { Plugin, PluginContext, PluginManifest } from "../../core";

// Load manifest from JSON file
const manifestPath = path.join(__dirname, "manifest.json");
const manifest: PluginManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

// Load icon from SVG file
const iconPath = path.join(__dirname, "icon.svg");
const icon = fs.readFileSync(iconPath, "utf-8");

// Store plugin context for use in routes
let pluginContext: PluginContext | null = null;

// Track how many times each lifecycle method was called (for testing)
const lifecycleCalls = {
  onInstall: 0,
  onUninstall: 0,
  onLoad: 0,
  onUnload: 0,
  onEnable: 0,
  onDisable: 0,
};

/**
 * Error Test Plugin
 *
 * Provides test routes for verifying error protection mechanisms.
 */
const errorTestPlugin: Plugin = {
  manifest: {
    ...manifest,
    icon,
  },

  async onInstall(context: PluginContext): Promise<void> {
    lifecycleCalls.onInstall++;
    context.logger.info("Error Test plugin installed");
  },

  async onUninstall(context: PluginContext): Promise<void> {
    lifecycleCalls.onUninstall++;
    context.logger.info("Error Test plugin uninstalled");
  },

  async onLoad(context: PluginContext): Promise<void> {
    lifecycleCalls.onLoad++;
    pluginContext = context;
    context.logger.info("Error Test plugin loaded");
  },

  async onUnload(context: PluginContext): Promise<void> {
    lifecycleCalls.onUnload++;
    pluginContext = null;
    context.logger.info("Error Test plugin unloaded");
  },

  async onEnable(context: PluginContext): Promise<void> {
    lifecycleCalls.onEnable++;
    pluginContext = context;
    context.logger.info("Error Test plugin enabled");
  },

  async onDisable(context: PluginContext): Promise<void> {
    lifecycleCalls.onDisable++;
    pluginContext = null;
    context.logger.info("Error Test plugin disabled");
  },

  /**
   * Routes for testing error handling
   */
  routes(router: Router): void {
    /**
     * GET /api/plugins/error-test/status
     * Returns plugin status and lifecycle call counts
     */
    router.get("/status", (_req: Request, res: Response): void => {
      res.json({
        success: true,
        data: {
          pluginId: "error-test",
          contextAvailable: !!pluginContext,
          lifecycleCalls,
        },
      });
    });

    /**
     * GET /api/plugins/error-test/sync-error
     * Throws a synchronous error
     */
    router.get("/sync-error", (_req: Request, _res: Response): void => {
      throw new Error("Intentional sync error for testing");
    });

    /**
     * GET /api/plugins/error-test/async-error
     * Throws an asynchronous error (rejected promise)
     */
    router.get("/async-error", async (_req: Request, _res: Response): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      throw new Error("Intentional async error for testing");
    });

    /**
     * GET /api/plugins/error-test/delayed-error?delay=1000
     * Throws an error after a configurable delay (default 1000ms)
     */
    router.get("/delayed-error", async (req: Request, _res: Response): Promise<void> => {
      const delay = parseInt(req.query.delay as string) || 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      throw new Error(`Intentional error after ${delay}ms delay`);
    });

    /**
     * GET /api/plugins/error-test/partial-response
     * Sends partial response then throws (to test headersSent handling)
     */
    router.get("/partial-response", async (_req: Request, res: Response): Promise<void> => {
      res.setHeader("Content-Type", "text/plain");
      res.write("Starting response...\n");
      await new Promise((resolve) => setTimeout(resolve, 100));
      throw new Error("Error after partial response");
    });

    /**
     * GET /api/plugins/error-test/ok
     * Returns success - for verifying plugin still works
     */
    router.get("/ok", (_req: Request, res: Response): void => {
      res.json({
        success: true,
        message: "Error test plugin is working correctly",
        timestamp: new Date().toISOString(),
      });
    });

    /**
     * POST /api/plugins/error-test/trigger-errors?count=5
     * Triggers multiple errors in rapid succession (for testing auto-disable)
     * Returns after triggering the specified number of errors internally
     */
    router.post("/trigger-errors", async (req: Request, res: Response): Promise<void> => {
      const count = parseInt(req.query.count as string) || 5;
      const errors: string[] = [];

      // We can't actually trigger route errors from within a route,
      // so we'll just log what to do
      res.json({
        success: true,
        message: `To test auto-disable, call /api/plugins/error-test/sync-error ${count} times within 60 seconds`,
        testCommand: `for i in $(seq 1 ${count}); do curl -s http://localhost:3000/api/plugins/error-test/sync-error; done`,
        errors,
      });
    });

    /**
     * GET /api/plugins/error-test/hang?duration=35000
     * Simulates a hanging operation (for testing timeout)
     * Default duration is 35 seconds (exceeds 30s default timeout)
     * Note: This tests the route level, not lifecycle timeout
     */
    router.get("/hang", async (req: Request, res: Response): Promise<void> => {
      const duration = parseInt(req.query.duration as string) || 35000;
      pluginContext?.logger.info(`Hanging for ${duration}ms...`);

      await new Promise((resolve) => setTimeout(resolve, duration));

      res.json({
        success: true,
        message: `Completed after ${duration}ms`,
      });
    });

    /**
     * GET /api/plugins/error-test/memory-leak
     * Simulates memory allocation (for future resource monitoring tests)
     */
    router.get("/memory-leak", (req: Request, res: Response): void => {
      const sizeMB = parseInt(req.query.size as string) || 10;
      // Allocate memory (will be garbage collected after request)
      const data = Buffer.alloc(sizeMB * 1024 * 1024, "x");

      res.json({
        success: true,
        message: `Allocated ${sizeMB}MB buffer`,
        bufferLength: data.length,
      });
    });
  },
};

export default errorTestPlugin;
