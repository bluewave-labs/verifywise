/**
 * VerifyWise Plugin System - Plugin Registry
 *
 * Stores and manages plugin instances and their state.
 * Handles plugin lookup by ID and framework ID.
 */

import {
  Plugin,
  PluginState,
  FrameworkPlugin,
  IntegrationPlugin,
  PluginManifest,
} from "./types";

export class PluginRegistry {
  private plugins: Map<string, PluginState> = new Map();
  private frameworkIndex: Map<number, string> = new Map(); // frameworkId -> pluginId

  /**
   * Register a plugin
   */
  register(plugin: Plugin, config: Record<string, unknown> = {}): void {
    const { id } = plugin.manifest;

    if (this.plugins.has(id)) {
      throw new Error(`Plugin "${id}" is already registered`);
    }

    this.plugins.set(id, {
      plugin,
      enabled: false,
      installed: false,
      config,
    });

    // Index framework plugins by frameworkId
    if (this.isFrameworkPlugin(plugin)) {
      const frameworkId = plugin.manifest.frameworkId;
      if (this.frameworkIndex.has(frameworkId)) {
        throw new Error(
          `Framework ID ${frameworkId} is already registered by plugin "${this.frameworkIndex.get(frameworkId)}"`
        );
      }
      this.frameworkIndex.set(frameworkId, id);
    }
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): boolean {
    const state = this.plugins.get(pluginId);
    if (!state) {
      return false;
    }

    // Remove from framework index if applicable
    if (this.isFrameworkPlugin(state.plugin)) {
      const frameworkId = state.plugin.manifest.frameworkId;
      this.frameworkIndex.delete(frameworkId);
    }

    this.plugins.delete(pluginId);
    return true;
  }

  /**
   * Get a plugin by ID
   */
  get<T extends Plugin>(pluginId: string): T | undefined {
    const state = this.plugins.get(pluginId);
    return state?.plugin as T | undefined;
  }

  /**
   * Get plugin state by ID
   */
  getState(pluginId: string): PluginState | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get a framework plugin by framework ID
   */
  getByFrameworkId(frameworkId: number): FrameworkPlugin | undefined {
    const pluginId = this.frameworkIndex.get(frameworkId);
    if (!pluginId) return undefined;

    const state = this.plugins.get(pluginId);
    if (!state) return undefined;

    return this.isFrameworkPlugin(state.plugin) ? state.plugin : undefined;
  }

  /**
   * Check if a plugin is registered
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Check if a plugin is enabled
   */
  isEnabled(pluginId: string): boolean {
    return this.plugins.get(pluginId)?.enabled ?? false;
  }

  /**
   * Check if a plugin is installed
   */
  isInstalled(pluginId: string): boolean {
    return this.plugins.get(pluginId)?.installed ?? false;
  }

  /**
   * Set plugin enabled state
   */
  setEnabled(pluginId: string, enabled: boolean): void {
    const state = this.plugins.get(pluginId);
    if (state) {
      state.enabled = enabled;
      state.enabledAt = enabled ? new Date() : undefined;
    }
  }

  /**
   * Set plugin installed state
   */
  setInstalled(pluginId: string, installed: boolean): void {
    const state = this.plugins.get(pluginId);
    if (state) {
      state.installed = installed;
    }
  }

  /**
   * Set plugin loaded time
   */
  setLoaded(pluginId: string, loaded: boolean): void {
    const state = this.plugins.get(pluginId);
    if (state) {
      state.loadedAt = loaded ? new Date() : undefined;
    }
  }

  /**
   * Update plugin config
   */
  setConfig(pluginId: string, config: Record<string, unknown>): void {
    const state = this.plugins.get(pluginId);
    if (state) {
      state.config = config;
    }
  }

  /**
   * Get plugin config
   */
  getConfig(pluginId: string): Record<string, unknown> {
    return this.plugins.get(pluginId)?.config ?? {};
  }

  /**
   * Get all plugins
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values()).map((state) => state.plugin);
  }

  /**
   * Get all plugin states
   */
  getAllStates(): PluginState[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all enabled plugins
   */
  getEnabled(): Plugin[] {
    return Array.from(this.plugins.values())
      .filter((state) => state.enabled)
      .map((state) => state.plugin);
  }

  /**
   * Get all framework plugins
   */
  getFrameworkPlugins(): FrameworkPlugin[] {
    return Array.from(this.plugins.values())
      .filter((state) => this.isFrameworkPlugin(state.plugin))
      .map((state) => state.plugin as FrameworkPlugin);
  }

  /**
   * Get all enabled framework plugins
   */
  getEnabledFrameworkPlugins(): FrameworkPlugin[] {
    return Array.from(this.plugins.values())
      .filter((state) => state.enabled && this.isFrameworkPlugin(state.plugin))
      .map((state) => state.plugin as FrameworkPlugin);
  }

  /**
   * Get all integration plugins
   */
  getIntegrationPlugins(): IntegrationPlugin[] {
    return Array.from(this.plugins.values())
      .filter((state) => this.isIntegrationPlugin(state.plugin))
      .map((state) => state.plugin as IntegrationPlugin);
  }

  /**
   * Get all plugin manifests
   */
  getManifests(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(
      (state) => state.plugin.manifest
    );
  }

  /**
   * Get count of registered plugins
   */
  count(): number {
    return this.plugins.size;
  }

  /**
   * Get count of enabled plugins
   */
  enabledCount(): number {
    return Array.from(this.plugins.values()).filter((s) => s.enabled).length;
  }

  /**
   * Clear all plugins (for testing)
   */
  clear(): void {
    this.plugins.clear();
    this.frameworkIndex.clear();
  }

  /**
   * Type guard for FrameworkPlugin
   */
  private isFrameworkPlugin(plugin: Plugin): plugin is FrameworkPlugin {
    return (
      plugin.manifest.type === "framework" &&
      "frameworkId" in plugin.manifest &&
      "createForProject" in plugin &&
      "deleteForProject" in plugin &&
      "getReportData" in plugin &&
      "getStructure" in plugin
    );
  }

  /**
   * Type guard for IntegrationPlugin
   */
  private isIntegrationPlugin(plugin: Plugin): plugin is IntegrationPlugin {
    return (
      plugin.manifest.type === "integration" &&
      "connect" in plugin &&
      "disconnect" in plugin &&
      "testConnection" in plugin
    );
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();
