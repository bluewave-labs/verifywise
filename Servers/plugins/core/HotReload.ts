/**
 * VerifyWise Plugin System - Hot Reload
 *
 * Watches plugin directories for file changes and automatically reloads
 * plugins without requiring a server restart.
 *
 * Only active in development mode (NODE_ENV !== 'production').
 */

import chokidar, { FSWatcher } from "chokidar";
import path from "path";
import fs from "fs";
import { PluginManager } from "./PluginManager";
import { Plugin, PluginManifest, PluginType, PluginPermission, PluginConfigSchema } from "./types";

// Logger interface to avoid circular dependency
interface Logger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

// Simple console logger for development
const devLogger: Logger = {
  info: (msg, ...args) => console.log(`[HotReload] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[HotReload] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[HotReload] ${msg}`, ...args),
  debug: (msg, ...args) => {
    if (process.env.DEBUG_HOT_RELOAD) {
      console.debug(`[HotReload] ${msg}`, ...args);
    }
  },
};

export interface HotReloadOptions {
  /** Plugin manager instance */
  pluginManager: PluginManager;
  /** Base directory for plugins (default: process.cwd()/plugins) */
  pluginsDir?: string;
  /** Directories to watch (default: ['marketplace', 'builtin']) */
  watchDirs?: string[];
  /** Debounce delay in ms (default: 500) */
  debounceMs?: number;
  /** Custom logger */
  logger?: Logger;
  /** Function to create dynamic plugin from manifest */
  createDynamicPlugin?: (manifest: PluginManifest) => Plugin;
}

/**
 * Plugin Hot Reload Manager
 *
 * Watches plugin directories and automatically reloads plugins when files change.
 */
export class PluginHotReload {
  private pluginManager: PluginManager;
  private pluginsDir: string;
  private watchDirs: string[];
  private debounceMs: number;
  private logger: Logger;
  private createDynamicPlugin?: (manifest: PluginManifest) => Plugin;

  private watcher: FSWatcher | null = null;
  private pendingReloads: Map<string, NodeJS.Timeout> = new Map();
  private isEnabled: boolean = false;

  constructor(options: HotReloadOptions) {
    this.pluginManager = options.pluginManager;
    this.pluginsDir = options.pluginsDir || path.join(process.cwd(), "plugins");
    this.watchDirs = options.watchDirs || ["marketplace", "builtin"];
    this.debounceMs = options.debounceMs || 500;
    this.logger = options.logger || devLogger;
    this.createDynamicPlugin = options.createDynamicPlugin;
  }

  /**
   * Start watching plugin directories
   */
  start(): void {
    // Only enable in development
    if (process.env.NODE_ENV === "production") {
      this.logger.info("Hot reload disabled in production mode");
      return;
    }

    if (this.isEnabled) {
      this.logger.warn("Hot reload already started");
      return;
    }

    const watchPaths = this.watchDirs
      .map((dir) => path.join(this.pluginsDir, dir))
      .filter((dir) => fs.existsSync(dir));

    if (watchPaths.length === 0) {
      this.logger.warn("No plugin directories found to watch");
      return;
    }

    this.logger.info(`Starting hot reload for: ${watchPaths.join(", ")}`);

    this.watcher = chokidar.watch(watchPaths, {
      ignored: [
        /(^|[\/\\])\../, // Ignore dotfiles
        /node_modules/,
        /\.d\.ts$/,
        /\.map$/,
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });

    this.watcher
      .on("change", (filePath) => this.handleFileChange(filePath, "change"))
      .on("add", (filePath) => this.handleFileChange(filePath, "add"))
      .on("unlink", (filePath) => this.handleFileChange(filePath, "unlink"))
      .on("error", (error) => this.logger.error("Watcher error:", error));

    this.isEnabled = true;
    this.logger.info("Hot reload started - watching for plugin changes");
  }

  /**
   * Stop watching plugin directories
   */
  async stop(): Promise<void> {
    if (!this.isEnabled || !this.watcher) {
      return;
    }

    // Clear pending reloads
    for (const timeout of this.pendingReloads.values()) {
      clearTimeout(timeout);
    }
    this.pendingReloads.clear();

    await this.watcher.close();
    this.watcher = null;
    this.isEnabled = false;

    this.logger.info("Hot reload stopped");
  }

  /**
   * Handle file change event
   */
  private handleFileChange(
    filePath: string,
    eventType: "change" | "add" | "unlink"
  ): void {
    const pluginId = this.extractPluginId(filePath);
    if (!pluginId) {
      this.logger.debug(`Ignoring change in non-plugin file: ${filePath}`);
      return;
    }

    this.logger.debug(`File ${eventType}: ${filePath} (plugin: ${pluginId})`);

    // Debounce reloads for the same plugin
    if (this.pendingReloads.has(pluginId)) {
      clearTimeout(this.pendingReloads.get(pluginId)!);
    }

    this.pendingReloads.set(
      pluginId,
      setTimeout(() => {
        this.pendingReloads.delete(pluginId);
        this.reloadPlugin(pluginId, filePath).catch((error) => {
          this.logger.error(`Failed to reload plugin "${pluginId}":`, error);
        });
      }, this.debounceMs)
    );
  }

  /**
   * Extract plugin ID from file path
   */
  private extractPluginId(filePath: string): string | null {
    // Path format: .../plugins/{watchDir}/{pluginId}/...
    const relativePath = path.relative(this.pluginsDir, filePath);
    const parts = relativePath.split(path.sep);

    // parts[0] = watchDir (marketplace, builtin), parts[1] = pluginId
    if (parts.length >= 2 && this.watchDirs.includes(parts[0])) {
      return parts[1];
    }

    return null;
  }

  /**
   * Reload a plugin
   */
  private async reloadPlugin(pluginId: string, changedFile: string): Promise<void> {
    this.logger.info(`Reloading plugin "${pluginId}" due to change in ${path.basename(changedFile)}`);

    const startTime = Date.now();

    try {
      // Find the plugin directory
      const pluginDir = this.findPluginDir(pluginId);
      if (!pluginDir) {
        this.logger.warn(`Plugin directory not found for "${pluginId}"`);
        return;
      }

      // Check if plugin is currently registered
      const existingPlugin = this.pluginManager.getPlugin(pluginId);
      const wasEnabled = existingPlugin ? this.pluginManager.isEnabled(pluginId) : false;
      const wasInstalled = existingPlugin ? this.pluginManager.isInstalled(pluginId) : false;

      // Step 1: Disable if enabled
      if (wasEnabled) {
        this.logger.debug(`Disabling plugin "${pluginId}"`);
        await this.pluginManager.disablePlugin(pluginId);
      }

      // Step 2: Unregister if registered
      if (existingPlugin) {
        this.logger.debug(`Unregistering plugin "${pluginId}"`);
        this.pluginManager.unregisterPlugin(pluginId);
      }

      // Step 3: Clear module cache for the plugin
      this.clearPluginCache(pluginDir);

      // Step 4: Re-import and register the plugin
      const newPlugin = await this.loadPlugin(pluginDir, pluginId);
      if (!newPlugin) {
        this.logger.error(`Failed to load plugin "${pluginId}" after change`);
        return;
      }

      this.pluginManager.registerPlugin(newPlugin);
      this.logger.debug(`Registered updated plugin "${pluginId}"`);

      // Step 5: Re-install if was installed
      if (wasInstalled) {
        // Skip onInstall for hot reload - data already exists
        // Just mark as installed in registry
        this.logger.debug(`Marking plugin "${pluginId}" as installed`);
        await this.pluginManager.installPlugin(pluginId);
      }

      // Step 6: Re-enable if was enabled
      if (wasEnabled) {
        await this.pluginManager.loadPlugin(pluginId);
        await this.pluginManager.enablePlugin(pluginId);
        this.logger.debug(`Re-enabled plugin "${pluginId}"`);
      }

      const elapsed = Date.now() - startTime;
      this.logger.info(`Plugin "${pluginId}" reloaded successfully in ${elapsed}ms`);
    } catch (error) {
      this.logger.error(`Error reloading plugin "${pluginId}":`, error);
    }
  }

  /**
   * Find the directory for a plugin
   */
  private findPluginDir(pluginId: string): string | null {
    for (const watchDir of this.watchDirs) {
      const pluginDir = path.join(this.pluginsDir, watchDir, pluginId);
      if (fs.existsSync(pluginDir)) {
        return pluginDir;
      }
    }
    return null;
  }

  /**
   * Clear Node.js module cache for a plugin
   */
  private clearPluginCache(pluginDir: string): void {
    const resolvedDir = path.resolve(pluginDir);

    // Clear all cached modules under the plugin directory
    const keysToDelete: string[] = [];

    for (const key of Object.keys(require.cache)) {
      if (key.startsWith(resolvedDir)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      delete require.cache[key];
    }

    if (keysToDelete.length > 0) {
      this.logger.debug(`Cleared ${keysToDelete.length} cached modules for plugin`);
    }
  }

  /**
   * Load a plugin from directory
   */
  private async loadPlugin(pluginDir: string, pluginId: string): Promise<Plugin | null> {
    const manifestPath = path.join(pluginDir, "manifest.json");

    if (!fs.existsSync(manifestPath)) {
      this.logger.warn(`No manifest.json found for plugin "${pluginId}"`);
      return null;
    }

    // Try to load full TypeScript/JavaScript plugin first
    const fullPlugin = await this.loadFullPlugin(pluginDir);
    if (fullPlugin) {
      return fullPlugin;
    }

    // Fall back to manifest-only plugin
    try {
      const manifestContent = fs.readFileSync(manifestPath, "utf8");
      const manifest = JSON.parse(manifestContent);

      const pluginManifest: PluginManifest = {
        id: manifest.id as string,
        name: manifest.name as string,
        description: manifest.description as string,
        version: manifest.version as string,
        author: manifest.author as string,
        authorUrl: manifest.authorUrl as string | undefined,
        type: manifest.type as PluginType,
        icon: manifest.icon as string | undefined,
        permissions: (manifest.permissions as PluginPermission[]) || [],
        config: (manifest.config as Record<string, PluginConfigSchema>) || {},
        dependencies: (manifest.dependencies as Record<string, string>) || undefined,
      };

      if (this.createDynamicPlugin) {
        return this.createDynamicPlugin(pluginManifest);
      }

      // Create a minimal plugin if no factory provided
      return {
        manifest: pluginManifest,
      };
    } catch (error) {
      this.logger.error(`Failed to load manifest for "${pluginId}":`, error);
      return null;
    }
  }

  /**
   * Load a full TypeScript/JavaScript plugin
   */
  private async loadFullPlugin(pluginDir: string): Promise<Plugin | null> {
    const jsPath = path.join(pluginDir, "index.js");
    const tsPath = path.join(pluginDir, "index.ts");

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
      // Add cache-busting query param for dynamic import
      const cacheBuster = `?update=${Date.now()}`;
      const importPath = modulePath + cacheBuster;

      // Dynamic import
      const pluginModule = await import(importPath);

      const plugin: Plugin = pluginModule.default || pluginModule.plugin;

      if (!plugin || !plugin.manifest) {
        this.logger.warn(`Module at ${modulePath} does not export a valid Plugin object`);
        return null;
      }

      return plugin;
    } catch (error) {
      this.logger.error(`Failed to import plugin module ${modulePath}:`, error);
      return null;
    }
  }

  /**
   * Check if hot reload is currently enabled
   */
  isRunning(): boolean {
    return this.isEnabled;
  }

  /**
   * Get list of watched directories
   */
  getWatchedPaths(): string[] {
    return this.watchDirs.map((dir) => path.join(this.pluginsDir, dir));
  }
}

/**
 * Create and start hot reload instance
 */
export function createHotReload(options: HotReloadOptions): PluginHotReload {
  const hotReload = new PluginHotReload(options);
  hotReload.start();
  return hotReload;
}
