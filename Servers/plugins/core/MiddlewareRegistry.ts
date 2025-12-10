/**
 * VerifyWise Plugin System - Middleware Registry
 *
 * Allows plugins to inject middleware into existing routes.
 * Supports "before" and "after" positioning.
 * First-registered wins for execution order.
 */

import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import {
  PluginMiddlewareAPI,
  PluginMiddlewareHandler,
  RegisteredMiddleware,
  MiddlewareContext,
  PluginLogger,
} from "./types";

/**
 * Internal middleware entry with additional metadata
 */
interface MiddlewareEntry extends RegisteredMiddleware {
  regex: RegExp;
}

/**
 * Convert route pattern to regex
 * Supports :param and * wildcards
 */
function patternToRegex(pattern: string): RegExp {
  // Escape special regex chars except : and *
  let regexStr = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    // Convert :param to named capture group
    .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, "([^/]+)")
    // Convert * to match anything
    .replace(/\*/g, ".*");

  // Ensure exact match for paths without wildcards
  if (!pattern.includes("*")) {
    regexStr = `^${regexStr}$`;
  } else {
    regexStr = `^${regexStr}`;
  }

  return new RegExp(regexStr);
}

/**
 * Global middleware registry
 * Stores all registered middleware and provides execution helpers
 */
export class MiddlewareRegistry {
  private middlewares: Map<string, MiddlewareEntry> = new Map();
  private logger?: PluginLogger;

  constructor(logger?: PluginLogger) {
    this.logger = logger;
  }

  /**
   * Set the logger
   */
  setLogger(logger: PluginLogger): void {
    this.logger = logger;
  }

  /**
   * Register middleware
   */
  add(
    pluginId: string,
    pattern: string,
    position: "before" | "after",
    handler: PluginMiddlewareHandler
  ): string {
    const id = randomUUID();
    const regex = patternToRegex(pattern);

    const entry: MiddlewareEntry = {
      id,
      pluginId,
      pattern,
      position,
      handler,
      registeredAt: new Date(),
      regex,
    };

    this.middlewares.set(id, entry);
    this.logger?.info(`Registered ${position} middleware for "${pattern}" (${id})`);

    return id;
  }

  /**
   * Remove middleware by ID
   */
  remove(id: string): boolean {
    const entry = this.middlewares.get(id);
    if (entry) {
      this.middlewares.delete(id);
      this.logger?.info(`Removed middleware ${id} for "${entry.pattern}"`);
      return true;
    }
    return false;
  }

  /**
   * Remove all middleware for a plugin
   */
  removeByPlugin(pluginId: string): number {
    let count = 0;
    for (const [id, entry] of this.middlewares) {
      if (entry.pluginId === pluginId) {
        this.middlewares.delete(id);
        count++;
      }
    }
    if (count > 0) {
      this.logger?.info(`Removed ${count} middleware entries for plugin "${pluginId}"`);
    }
    return count;
  }

  /**
   * Get middleware for a specific path
   */
  getForPath(path: string, position: "before" | "after"): MiddlewareEntry[] {
    const matching: MiddlewareEntry[] = [];

    for (const entry of this.middlewares.values()) {
      if (entry.position === position && entry.regex.test(path)) {
        matching.push(entry);
      }
    }

    // Sort by registration time (first-registered wins)
    return matching.sort(
      (a, b) => a.registeredAt.getTime() - b.registeredAt.getTime()
    );
  }

  /**
   * Get all middleware for a plugin
   */
  getByPlugin(pluginId: string): RegisteredMiddleware[] {
    const result: RegisteredMiddleware[] = [];
    for (const entry of this.middlewares.values()) {
      if (entry.pluginId === pluginId) {
        // Return without the regex
        const { regex, ...rest } = entry;
        result.push(rest);
      }
    }
    return result;
  }

  /**
   * Check if middleware exists
   */
  has(id: string): boolean {
    return this.middlewares.has(id);
  }

  /**
   * Get all registered middleware
   */
  getAll(): RegisteredMiddleware[] {
    const result: RegisteredMiddleware[] = [];
    for (const entry of this.middlewares.values()) {
      const { regex, ...rest } = entry;
      result.push(rest);
    }
    return result;
  }

  /**
   * Get stats
   */
  getStats(): { total: number; beforeCount: number; afterCount: number } {
    let beforeCount = 0;
    let afterCount = 0;

    for (const entry of this.middlewares.values()) {
      if (entry.position === "before") {
        beforeCount++;
      } else {
        afterCount++;
      }
    }

    return {
      total: this.middlewares.size,
      beforeCount,
      afterCount,
    };
  }

  /**
   * Execute "before" middleware for a path
   * Returns true if all passed, false if any returned early
   */
  async executeBefore(
    path: string,
    req: Request,
    res: Response,
    tenant: string
  ): Promise<boolean> {
    const middlewares = this.getForPath(path, "before");

    for (const middleware of middlewares) {
      let nextCalled = false;
      const next = async () => {
        nextCalled = true;
      };

      const ctx: MiddlewareContext = {
        req,
        res,
        pluginId: middleware.pluginId,
        tenant,
      };

      try {
        await middleware.handler(ctx, next);

        // If next wasn't called and response was sent, stop chain
        if (!nextCalled && res.headersSent) {
          this.logger?.debug(
            `Middleware ${middleware.id} stopped request chain for ${path}`
          );
          return false;
        }

        // If next wasn't called but response wasn't sent, continue anyway
        // (middleware might have just done something async)
      } catch (error) {
        this.logger?.error(
          `Error in before middleware ${middleware.id}:`,
          { error, path }
        );
        // Continue to next middleware on error
      }
    }

    return true;
  }

  /**
   * Execute "after" middleware for a path
   * Can modify the response before it's sent
   */
  async executeAfter(
    path: string,
    req: Request,
    res: Response,
    tenant: string
  ): Promise<void> {
    const middlewares = this.getForPath(path, "after");

    for (const middleware of middlewares) {
      const ctx: MiddlewareContext = {
        req,
        res,
        pluginId: middleware.pluginId,
        tenant,
      };

      try {
        await middleware.handler(ctx, async () => {});
      } catch (error) {
        this.logger?.error(
          `Error in after middleware ${middleware.id}:`,
          { error, path }
        );
        // Continue to next middleware on error
      }
    }
  }

  /**
   * Clear all middleware
   */
  clear(): void {
    this.middlewares.clear();
    this.logger?.info("Cleared all middleware");
  }
}

/**
 * Plugin-scoped middleware API
 * Wraps the global registry with plugin-specific methods
 */
export class PluginMiddlewareManager implements PluginMiddlewareAPI {
  private pluginId: string;
  private registry: MiddlewareRegistry;
  private logger: PluginLogger;

  constructor(
    pluginId: string,
    _tenant: string,
    registry: MiddlewareRegistry,
    logger: PluginLogger
  ) {
    this.pluginId = pluginId;
    this.registry = registry;
    this.logger = logger;
  }

  /**
   * Add middleware for a route pattern
   */
  add(
    pattern: string,
    position: "before" | "after",
    handler: PluginMiddlewareHandler
  ): string {
    return this.registry.add(this.pluginId, pattern, position, handler);
  }

  /**
   * Remove middleware by ID
   */
  remove(id: string): boolean {
    // Verify this middleware belongs to this plugin
    const middlewares = this.registry.getByPlugin(this.pluginId);
    const belongs = middlewares.some((m) => m.id === id);
    if (!belongs) {
      this.logger.warn(`Cannot remove middleware ${id}: not owned by this plugin`);
      return false;
    }
    return this.registry.remove(id);
  }

  /**
   * Remove all middleware for this plugin
   */
  removeAll(): number {
    return this.registry.removeByPlugin(this.pluginId);
  }

  /**
   * List all middleware for this plugin
   */
  list(): RegisteredMiddleware[] {
    return this.registry.getByPlugin(this.pluginId);
  }

  /**
   * Check if middleware exists
   */
  has(id: string): boolean {
    const middlewares = this.registry.getByPlugin(this.pluginId);
    return middlewares.some((m) => m.id === id);
  }
}

/**
 * Create Express middleware that wraps all routes with plugin middleware execution
 *
 * NOTE: "after" middleware runs AFTER the response is sent and cannot modify the response.
 * Use "after" middleware for logging, analytics, and cleanup tasks only.
 * Use filters (via FilterBus) if you need to modify response data.
 */
export function createPluginMiddlewareWrapper(
  registry: MiddlewareRegistry,
  getTenant: (req: Request) => string = () => "default"
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // OPTIMIZATION: Skip all wrapper logic if no middleware is registered
    // This eliminates overhead when no plugins are installed/enabled
    const stats = registry.getStats();
    if (stats.total === 0) {
      return next();
    }

    const path = req.path;
    const tenant = getTenant(req);

    // Execute "before" middleware
    const shouldContinue = await registry.executeBefore(path, req, res, tenant);

    if (!shouldContinue) {
      // Middleware stopped the chain
      return;
    }

    // Store original json/send to intercept response
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Flag to track if we've executed after middleware
    let afterExecuted = false;

    const executeAfter = () => {
      if (!afterExecuted) {
        afterExecuted = true;
        // Fire-and-forget: run after-middleware in background
        // This ensures the response is sent synchronously
        registry.executeAfter(path, req, res, tenant).catch((error) => {
          // Log but don't throw - after-middleware errors shouldn't affect response
          console.error("[MiddlewareRegistry] Error in after-middleware:", error);
        });
      }
    };

    // Wrap json() to execute after middleware
    res.json = function (body: unknown) {
      // Store the body for reference (after middleware can read but not modify)
      res.locals.responseBody = body;

      // Send the response synchronously
      const result = originalJson(body);

      // Then execute after middleware in the background
      executeAfter();

      return result;
    } as typeof res.json;

    // Wrap send() similarly
    res.send = function (body: unknown) {
      res.locals.responseBody = body;

      // Send the response synchronously
      const result = originalSend(body);

      // Then execute after middleware in the background
      executeAfter();

      return result;
    } as typeof res.send;

    next();
  };
}

// Singleton instance
export const middlewareRegistry = new MiddlewareRegistry();
