/**
 * VerifyWise Plugin System - Plugin Manager
 *
 * Main orchestrator for the plugin system.
 * Handles plugin lifecycle (install, load, enable, disable, unload, uninstall).
 */

import { Transaction, Sequelize } from "sequelize";
import {
  Plugin,
  PluginManifest,
  FrameworkPlugin,
  PluginEvent,
  EventPayloads,
  EventHandler,
  PluginFilter,
  FilterPayloads,
  FilterHandler,
  DatabaseService,
} from "./types";
import { EventBus, eventBus as defaultEventBus } from "./EventBus";
import { FilterBus, filterBus as defaultFilterBus } from "./FilterBus";
import {
  PluginRegistry,
  pluginRegistry as defaultRegistry,
} from "./PluginRegistry";
import {
  PluginContextFactory,
  PluginContextFactoryOptions,
} from "./PluginContext";
import {
  MiddlewareRegistry,
  middlewareRegistry as defaultMiddlewareRegistry,
} from "./MiddlewareRegistry";

export interface PluginManagerOptions {
  eventBus?: EventBus;
  filterBus?: FilterBus;
  registry?: PluginRegistry;
  middlewareRegistry?: MiddlewareRegistry;
  db: DatabaseService;
  sequelize: Sequelize;
  defaultTenant?: string;
}

// Error tracking for auto-disable feature
interface PluginErrorRecord {
  count: number;
  timestamps: number[];
  lastError: string;
  autoDisabled: boolean;
}

export class PluginManager {
  private eventBus: EventBus;
  private filterBus: FilterBus;
  private registry: PluginRegistry;
  private middlewareRegistry: MiddlewareRegistry;
  private contextFactory: PluginContextFactory;
  private defaultTenant: string;

  // Error tracking for auto-disable feature
  private errorTracker: Map<string, PluginErrorRecord> = new Map();

  // ==========================================================================
  // SAFE EXECUTION WRAPPER & ERROR TRACKING
  // ==========================================================================

  // Default timeout for lifecycle hooks (30 seconds)
  private static readonly DEFAULT_LIFECYCLE_TIMEOUT = 30000;

  // Auto-disable thresholds
  private static readonly ERROR_THRESHOLD = 5; // Number of errors before auto-disable
  private static readonly ERROR_WINDOW_MS = 60000; // Time window for counting errors (1 minute)

  /**
   * Safely execute a plugin method with error handling and timeout
   *
   * Wraps plugin method calls in try-catch to prevent plugin errors from
   * crashing the server. Logs errors and returns a default value on failure.
   * Supports optional timeout to prevent hanging plugins.
   *
   * @param pluginId - The plugin ID for logging
   * @param methodName - The method name being called (for logging)
   * @param fn - The function to execute
   * @param options - Configuration options
   * @returns The result of fn(), or defaultValue on error/timeout
   */
  private async safeExecute<T>(
    pluginId: string,
    methodName: string,
    fn: () => Promise<T> | T,
    options: {
      defaultValue?: T;
      rethrow?: boolean;
      logLevel?: "error" | "warn" | "info";
      timeout?: number; // Timeout in milliseconds (0 = no timeout)
      skipErrorTracking?: boolean; // Skip error tracking for cleanup operations
    } = {}
  ): Promise<T | undefined> {
    const {
      defaultValue,
      rethrow = false,
      logLevel = "error",
      timeout = PluginManager.DEFAULT_LIFECYCLE_TIMEOUT,
      skipErrorTracking = false,
    } = options;

    try {
      // Execute with timeout if specified
      if (timeout > 0) {
        return await this.withTimeout(fn(), timeout, pluginId, methodName);
      }
      return await fn();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const logMsg = `[Plugin:${pluginId}] Error in ${methodName}: ${errMsg}`;

      // Log at appropriate level
      if (logLevel === "error") {
        console.error(logMsg);
      } else if (logLevel === "warn") {
        console.warn(logMsg);
      } else {
        console.log(logMsg);
      }

      // Track error for auto-disable feature (skip for cleanup operations)
      if (!skipErrorTracking) {
        this.trackError(pluginId, errMsg);
      }

      // Optionally rethrow for methods that should block on error
      if (rethrow) {
        throw error;
      }

      return defaultValue;
    }
  }

  /**
   * Execute a promise with a timeout
   *
   * @param promise - The promise to execute
   * @param timeoutMs - Timeout in milliseconds
   * @param pluginId - Plugin ID for logging
   * @param methodName - Method name for logging
   * @returns The promise result or throws on timeout
   */
  private async withTimeout<T>(
    promise: Promise<T> | T,
    timeoutMs: number,
    pluginId: string,
    methodName: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(
            `Plugin "${pluginId}" timed out in ${methodName} after ${timeoutMs}ms`
          )
        );
      }, timeoutMs);

      Promise.resolve(promise)
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Track an error for a plugin
   *
   * Records the error and checks if the plugin should be auto-disabled.
   *
   * @param pluginId - The plugin ID
   * @param errorMessage - The error message
   * @returns true if plugin was auto-disabled
   */
  private trackError(pluginId: string, errorMessage: string): boolean {
    const now = Date.now();
    let record = this.errorTracker.get(pluginId);

    if (!record) {
      record = {
        count: 0,
        timestamps: [],
        lastError: "",
        autoDisabled: false,
      };
      this.errorTracker.set(pluginId, record);
    }

    // Remove old errors outside the time window
    record.timestamps = record.timestamps.filter(
      (t) => now - t < PluginManager.ERROR_WINDOW_MS
    );

    // Add this error
    record.timestamps.push(now);
    record.count = record.timestamps.length;
    record.lastError = errorMessage;

    // Check if we should auto-disable
    if (
      record.count >= PluginManager.ERROR_THRESHOLD &&
      !record.autoDisabled
    ) {
      record.autoDisabled = true;
      console.error(
        `[Plugin:${pluginId}] Auto-disabling plugin after ${record.count} errors in ${PluginManager.ERROR_WINDOW_MS / 1000}s`
      );

      // Disable the plugin asynchronously (don't await to prevent blocking)
      this.disablePlugin(pluginId).catch((e) => {
        console.error(`[Plugin:${pluginId}] Failed to auto-disable:`, e);
      });

      return true;
    }

    return false;
  }

  /**
   * Clear error tracking for a plugin
   *
   * Called when a plugin is successfully re-enabled to reset error counts.
   *
   * @param pluginId - The plugin ID
   */
  private clearErrorTracking(pluginId: string): void {
    this.errorTracker.delete(pluginId);
  }

  /**
   * Get error status for a plugin
   *
   * @param pluginId - The plugin ID
   * @returns Error record or undefined
   */
  getPluginErrorStatus(pluginId: string): PluginErrorRecord | undefined {
    return this.errorTracker.get(pluginId);
  }

  /**
   * Check if a plugin was auto-disabled
   *
   * @param pluginId - The plugin ID
   * @returns true if plugin was auto-disabled due to errors
   */
  isAutoDisabled(pluginId: string): boolean {
    return this.errorTracker.get(pluginId)?.autoDisabled ?? false;
  }

  /**
   * Report a plugin error (public method for route handlers)
   *
   * Tracks the error and may trigger auto-disable.
   *
   * @param pluginId - The plugin ID
   * @param errorMessage - The error message
   * @returns true if plugin was auto-disabled as a result
   */
  reportPluginError(pluginId: string, errorMessage: string): boolean {
    return this.trackError(pluginId, errorMessage);
  }

  constructor(options: PluginManagerOptions) {
    this.eventBus = options.eventBus || defaultEventBus;
    this.filterBus = options.filterBus || defaultFilterBus;
    this.registry = options.registry || defaultRegistry;
    this.middlewareRegistry = options.middlewareRegistry || defaultMiddlewareRegistry;
    this.defaultTenant = options.defaultTenant || "default";

    // Create context factory
    const contextOptions: PluginContextFactoryOptions = {
      eventBus: this.eventBus,
      filterBus: this.filterBus,
      registry: this.registry,
      db: options.db,
      sequelize: options.sequelize,
      middlewareRegistry: this.middlewareRegistry,
      defaultTenant: this.defaultTenant,
    };
    this.contextFactory = new PluginContextFactory(contextOptions);
  }

  // ==========================================================================
  // PLUGIN REGISTRATION
  // ==========================================================================

  /**
   * Register a plugin (does not load or enable it)
   */
  registerPlugin(
    plugin: Plugin,
    config: Record<string, unknown> = {}
  ): void {
    this.registry.register(plugin, config);
  }

  /**
   * Unregister a plugin
   *
   * Cleans up all resources associated with the plugin.
   */
  unregisterPlugin(pluginId: string): boolean {
    // Validate state - cannot unregister if enabled
    if (this.registry.isEnabled(pluginId)) {
      throw new Error(
        `Cannot unregister enabled plugin "${pluginId}". Disable it first.`
      );
    }

    // Clean up event and filter handlers
    this.eventBus.removePluginHandlers(pluginId);
    this.filterBus.removePluginHandlers(pluginId);

    // Clean up middleware
    this.middlewareRegistry.removeByPlugin(pluginId);

    // Clean up config store to prevent memory leak
    this.contextFactory.removePluginConfig(pluginId);

    return this.registry.unregister(pluginId);
  }

  // ==========================================================================
  // INSTALLATION LIFECYCLE
  // ==========================================================================

  /**
   * Install a plugin (first-time setup)
   *
   * Calls onInstall hook for creating tables, seeding data, etc.
   * Validates dependencies are met before installation.
   */
  async installPlugin(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" is not registered`);
    }

    if (this.registry.isInstalled(pluginId)) {
      throw new Error(`Plugin "${pluginId}" is already installed`);
    }

    // Check dependencies before installation
    this.validateDependencies(plugin);

    const context = this.contextFactory.createContext(
      pluginId,
      this.defaultTenant
    );

    try {
      if (plugin.onInstall) {
        await this.safeExecute(
          pluginId,
          "onInstall",
          () => plugin.onInstall!(context),
          { rethrow: true }
        );
      }
      this.registry.setInstalled(pluginId, true);
      context.logger.info("Plugin installed successfully");
    } catch (error) {
      context.logger.error("Failed to install plugin", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Validate plugin dependencies
   *
   * Checks that all required dependencies are registered and at compatible versions.
   * Also detects circular dependencies.
   */
  private validateDependencies(
    plugin: Plugin,
    visited: Set<string> = new Set()
  ): void {
    const { id, dependencies } = plugin.manifest;

    // Check for circular dependencies
    if (visited.has(id)) {
      const cycle = Array.from(visited).concat(id).join(" -> ");
      throw new Error(`Circular dependency detected: ${cycle}`);
    }

    if (!dependencies) {
      return;
    }

    visited.add(id);

    for (const [depId, requiredVersion] of Object.entries(dependencies)) {
      const depPlugin = this.registry.get(depId);

      if (!depPlugin) {
        throw new Error(
          `Missing dependency: Plugin "${id}" requires "${depId}@${requiredVersion}" but it is not registered`
        );
      }

      // Simple version check (for now, just check if version matches)
      // TODO: Implement semver compatibility checking
      const depVersion = depPlugin.manifest.version;
      if (!this.isVersionCompatible(depVersion, requiredVersion)) {
        throw new Error(
          `Incompatible dependency: Plugin "${id}" requires "${depId}@${requiredVersion}" but found version ${depVersion}`
        );
      }

      // Recursively check dependencies
      this.validateDependencies(depPlugin, new Set(visited));
    }
  }

  /**
   * Check if a version is compatible with a requirement
   *
   * Currently does simple string matching.
   * TODO: Implement proper semver compatibility.
   */
  private isVersionCompatible(
    actualVersion: string,
    requiredVersion: string
  ): boolean {
    // For now, allow if starts with same major.minor or exact match
    // This is a simplified check - production should use semver
    if (requiredVersion.startsWith("^")) {
      const required = requiredVersion.slice(1);
      const [reqMajor] = required.split(".");
      const [actMajor] = actualVersion.split(".");
      return reqMajor === actMajor;
    }
    if (requiredVersion.startsWith("~")) {
      const required = requiredVersion.slice(1);
      const [reqMajor, reqMinor] = required.split(".");
      const [actMajor, actMinor] = actualVersion.split(".");
      return reqMajor === actMajor && reqMinor === actMinor;
    }
    return actualVersion === requiredVersion || requiredVersion === "*";
  }

  /**
   * Uninstall a plugin (permanent removal)
   *
   * Calls onUninstall hook for cleaning up data, dropping tables, etc.
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" is not registered`);
    }

    // Must be disabled before uninstalling
    if (this.registry.isEnabled(pluginId)) {
      await this.disablePlugin(pluginId);
    }

    const context = this.contextFactory.createContext(
      pluginId,
      this.defaultTenant
    );

    try {
      if (plugin.onUninstall) {
        // Don't rethrow - allow uninstall to complete even if hook fails
        // Skip error tracking - cleanup errors shouldn't contribute to auto-disable
        await this.safeExecute(
          pluginId,
          "onUninstall",
          () => plugin.onUninstall!(context),
          { rethrow: false, logLevel: "warn", skipErrorTracking: true }
        );
      }
      this.registry.setInstalled(pluginId, false);
      context.logger.info("Plugin uninstalled successfully");
    } catch (error) {
      context.logger.error("Failed to uninstall plugin", { error });
      throw error;
    }
  }

  // ==========================================================================
  // RUNTIME LIFECYCLE
  // ==========================================================================

  /**
   * Load a plugin (server starting)
   *
   * Calls onLoad hook for initializing resources.
   * Requires the plugin to be installed first.
   */
  async loadPlugin(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" is not registered`);
    }

    // Validate state - must be installed to load
    if (!this.registry.isInstalled(pluginId)) {
      throw new Error(
        `Cannot load plugin "${pluginId}": not installed. Install it first.`
      );
    }

    // Check if already loaded
    const state = this.registry.getState(pluginId);
    if (state?.loadedAt) {
      return; // Already loaded, skip
    }

    const context = this.contextFactory.createContext(
      pluginId,
      this.defaultTenant
    );

    try {
      if (plugin.onLoad) {
        await this.safeExecute(
          pluginId,
          "onLoad",
          () => plugin.onLoad!(context),
          { rethrow: true }
        );
      }
      this.registry.setLoaded(pluginId, true);
      context.logger.info("Plugin loaded");
    } catch (error) {
      context.logger.error("Failed to load plugin", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Unload a plugin (server stopping)
   *
   * Calls onUnload hook for releasing resources.
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      return; // Already unloaded or never loaded
    }

    const context = this.contextFactory.createContext(
      pluginId,
      this.defaultTenant
    );

    // Use safeExecute without rethrow - continue unloading even if hook fails
    // Skip error tracking - cleanup errors shouldn't contribute to auto-disable
    if (plugin.onUnload) {
      await this.safeExecute(
        pluginId,
        "onUnload",
        () => plugin.onUnload!(context),
        { rethrow: false, logLevel: "warn", skipErrorTracking: true }
      );
    }
    this.registry.setLoaded(pluginId, false);
    context.logger.info("Plugin unloaded");
  }

  /**
   * Enable a plugin (runtime toggle on)
   *
   * Registers event/filter handlers and calls onEnable hook.
   * Requires the plugin to be loaded first.
   */
  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" is not registered`);
    }

    if (this.registry.isEnabled(pluginId)) {
      return; // Already enabled
    }

    // Validate state - must be loaded to enable
    const state = this.registry.getState(pluginId);
    if (!state?.loadedAt) {
      throw new Error(
        `Cannot enable plugin "${pluginId}": not loaded. Load it first.`
      );
    }

    // Check that all dependencies are enabled
    const { dependencies } = plugin.manifest;
    if (dependencies) {
      for (const depId of Object.keys(dependencies)) {
        if (!this.registry.isEnabled(depId)) {
          throw new Error(
            `Cannot enable plugin "${pluginId}": dependency "${depId}" is not enabled`
          );
        }
      }
    }

    const context = this.contextFactory.createContext(
      pluginId,
      this.defaultTenant
    );

    try {
      // Register event handlers (wrapped to prevent crash on malformed handlers)
      if (plugin.eventHandlers) {
        const handlers = await this.safeExecute(
          pluginId,
          "eventHandlers",
          () => plugin.eventHandlers!(),
          { defaultValue: {}, rethrow: false }
        );
        if (handlers) {
          for (const [event, handler] of Object.entries(handlers)) {
            if (handler) {
              this.eventBus.on(
                event as PluginEvent,
                handler as EventHandler<PluginEvent>,
                pluginId
              );
            }
          }
        }
      }

      // Register filter handlers (wrapped to prevent crash on malformed handlers)
      if (plugin.filterHandlers) {
        const handlers = await this.safeExecute(
          pluginId,
          "filterHandlers",
          () => plugin.filterHandlers!(),
          { defaultValue: {}, rethrow: false }
        );
        if (handlers) {
          for (const [filter, handler] of Object.entries(handlers)) {
            if (handler) {
              this.filterBus.addFilter(
                filter as PluginFilter,
                handler as FilterHandler<PluginFilter>,
                pluginId
              );
            }
          }
        }
      }

      // Call onEnable hook (rethrow to block enable on failure)
      if (plugin.onEnable) {
        await this.safeExecute(
          pluginId,
          "onEnable",
          () => plugin.onEnable!(context),
          { rethrow: true }
        );
      }

      this.registry.setEnabled(pluginId, true);
      context.logger.info("Plugin enabled");

      // Clear error tracking on successful enable (reset for fresh start)
      this.clearErrorTracking(pluginId);

      // Emit plugin enabled event
      await this.eventBus.emit(PluginEvent.PLUGIN_ENABLED, { pluginId, timestamp: new Date() });
    } catch (error) {
      // Rollback handler registrations on error
      this.eventBus.removePluginHandlers(pluginId);
      this.filterBus.removePluginHandlers(pluginId);
      context.logger.error("Failed to enable plugin", { error });
      throw error;
    }
  }

  /**
   * Disable a plugin (runtime toggle off)
   *
   * Unregisters event/filter handlers and calls onDisable hook.
   */
  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      return; // Not registered
    }

    if (!this.registry.isEnabled(pluginId)) {
      return; // Already disabled
    }

    const context = this.contextFactory.createContext(
      pluginId,
      this.defaultTenant
    );

    // Call onDisable hook first (don't rethrow - allow disable to complete)
    // Skip error tracking - cleanup errors shouldn't contribute to auto-disable
    if (plugin.onDisable) {
      await this.safeExecute(
        pluginId,
        "onDisable",
        () => plugin.onDisable!(context),
        { rethrow: false, logLevel: "warn", skipErrorTracking: true }
      );
    }

    // Unregister handlers (always proceed even if onDisable failed)
    this.eventBus.removePluginHandlers(pluginId);
    this.filterBus.removePluginHandlers(pluginId);

    // Remove middleware registered by this plugin
    this.middlewareRegistry.removeByPlugin(pluginId);

    this.registry.setEnabled(pluginId, false);
    context.logger.info("Plugin disabled");

    // Emit plugin disabled event
    await this.eventBus.emit(PluginEvent.PLUGIN_DISABLED, { pluginId, timestamp: new Date() });
  }

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================

  /**
   * Load all registered plugins
   */
  async loadAll(): Promise<void> {
    const plugins = this.registry.getAll();
    for (const plugin of plugins) {
      try {
        await this.loadPlugin(plugin.manifest.id);
      } catch (error) {
        console.error(
          `[PluginManager] Failed to load plugin ${plugin.manifest.id}:`,
          error
        );
      }
    }
  }

  /**
   * Unload all plugins
   */
  async unloadAll(): Promise<void> {
    const plugins = this.registry.getAll();
    for (const plugin of plugins) {
      await this.unloadPlugin(plugin.manifest.id);
    }
  }

  /**
   * Enable all installed plugins
   */
  async enableAll(): Promise<void> {
    const states = this.registry.getAllStates();
    for (const state of states) {
      if (state.installed && !state.enabled) {
        try {
          await this.enablePlugin(state.plugin.manifest.id);
        } catch (error) {
          console.error(
            `[PluginManager] Failed to enable plugin ${state.plugin.manifest.id}:`,
            error
          );
        }
      }
    }
  }

  /**
   * Disable all plugins
   */
  async disableAll(): Promise<void> {
    const enabled = this.registry.getEnabled();
    for (const plugin of enabled) {
      await this.disablePlugin(plugin.manifest.id);
    }
  }

  // ==========================================================================
  // PLUGIN ACCESS
  // ==========================================================================

  /**
   * Get a plugin by ID
   */
  getPlugin<T extends Plugin>(pluginId: string): T | undefined {
    return this.registry.get<T>(pluginId);
  }

  /**
   * Get a framework plugin by framework ID
   */
  getFrameworkPlugin(frameworkId: number): FrameworkPlugin | undefined {
    return this.registry.getByFrameworkId(frameworkId);
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): Plugin[] {
    return this.registry.getAll();
  }

  /**
   * Get all enabled plugins
   */
  getEnabledPlugins(): Plugin[] {
    return this.registry.getEnabled();
  }

  /**
   * Get all framework plugins
   */
  getFrameworkPlugins(): FrameworkPlugin[] {
    return this.registry.getFrameworkPlugins();
  }

  /**
   * Get all enabled framework plugins
   */
  getEnabledFrameworkPlugins(): FrameworkPlugin[] {
    return this.registry.getEnabledFrameworkPlugins();
  }

  /**
   * Get all plugin manifests
   */
  getManifests(): PluginManifest[] {
    return this.registry.getManifests();
  }

  /**
   * Check if a plugin is enabled
   */
  isEnabled(pluginId: string): boolean {
    return this.registry.isEnabled(pluginId);
  }

  /**
   * Check if a plugin is installed
   */
  isInstalled(pluginId: string): boolean {
    return this.registry.isInstalled(pluginId);
  }

  // ==========================================================================
  // EVENT & FILTER ACCESS
  // ==========================================================================

  /**
   * Emit an event
   */
  async emit<E extends PluginEvent>(
    event: E,
    payload: EventPayloads[E],
    options?: { transaction?: Transaction }
  ): Promise<void> {
    await this.eventBus.emit(event, payload, options);
  }

  /**
   * Apply filters to data
   */
  async applyFilters<F extends PluginFilter>(
    filter: F,
    data: FilterPayloads[F]
  ): Promise<FilterPayloads[F]> {
    return this.filterBus.applyFilters(filter, data);
  }

  // ==========================================================================
  // CONTEXT ACCESS
  // ==========================================================================

  /**
   * Get the context factory (for creating contexts in routes/services)
   */
  getContextFactory(): PluginContextFactory {
    return this.contextFactory;
  }

  /**
   * Get the event bus (for emitting events from controllers/services)
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Get the filter bus (for applying filters)
   */
  getFilterBus(): FilterBus {
    return this.filterBus;
  }

  /**
   * Get the middleware registry (for Express integration)
   */
  getMiddlewareRegistry(): MiddlewareRegistry {
    return this.middlewareRegistry;
  }

  /**
   * Create a context for a plugin
   */
  createContext(pluginId: string, tenant?: string) {
    return this.contextFactory.createContext(
      pluginId,
      tenant || this.defaultTenant
    );
  }

  // ==========================================================================
  // STATS
  // ==========================================================================

  /**
   * Get plugin system stats
   */
  getStats(): {
    totalPlugins: number;
    enabledPlugins: number;
    registeredEvents: number;
    registeredFilters: number;
    registeredMiddleware: number;
  } {
    const middlewareStats = this.middlewareRegistry.getStats();
    return {
      totalPlugins: this.registry.count(),
      enabledPlugins: this.registry.enabledCount(),
      registeredEvents: this.eventBus.getRegisteredEvents().length,
      registeredFilters: this.filterBus.getRegisteredFilters().length,
      registeredMiddleware: middlewareStats.total,
    };
  }
}
