/**
 * VerifyWise Plugin System - Public API
 *
 * This module exports the complete plugin system API.
 * Import from this file for all plugin-related functionality.
 *
 * @example
 * ```typescript
 * import {
 *   PluginManager,
 *   PluginEvent,
 *   PluginFilter,
 *   createDatabaseService,
 * } from './plugins/core';
 *
 * // Create plugin manager
 * const manager = new PluginManager({ db: createDatabaseService(sequelize) });
 *
 * // Register and enable a plugin
 * manager.registerPlugin(myPlugin);
 * await manager.installPlugin('my-plugin');
 * await manager.loadPlugin('my-plugin');
 * await manager.enablePlugin('my-plugin');
 *
 * // Emit events
 * await manager.emit(PluginEvent.PROJECT_CREATED, { project });
 *
 * // Apply filters
 * const filtered = await manager.applyFilters(PluginFilter.RISK_BEFORE_SAVE, riskData);
 * ```
 */

// =============================================================================
// CORE TYPES
// =============================================================================

export {
  // Plugin types
  PluginType,

  // Plugin manifest and definition
  PluginManifest,
  FrameworkManifest,
  IntegrationManifest,
  PluginConfigSchema,
  PluginPermission,

  // Plugin interfaces
  Plugin,
  FrameworkPlugin,
  IntegrationPlugin,
  PluginState,

  // Context and services
  PluginContext,
  PluginLogger,
  PluginConfig,
  PluginMetadataAPI,
  PluginSchedulerAPI,
  ScheduleJobOptions,
  ScheduledJobInfo,
  PluginJobHandler,
  DatabaseService,
  QueryResult,

  // Events
  PluginEvent,
  EventPayloads,
  EventHandler,
  EventHandlerMap,
  QueuedEvent,

  // Filters
  PluginFilter,
  FilterPayloads,
  FilterHandler,
  FilterHandlerMap,
  FilterHandlerEntry,

  // Framework types
  FrameworkCreateOptions,
  FrameworkData,
  ReportData,
  ReportSection,
  ReportSummary,
  FrameworkStructure,
  ValidationResult,
  ProgressInfo,

  // Integration types
  ConnectionResult,
  SyncOptions,
  SyncResult,
} from "./types";

// =============================================================================
// EVENT SYSTEM
// =============================================================================

export { EventBus, eventBus } from "./EventBus";

// =============================================================================
// FILTER SYSTEM
// =============================================================================

export { FilterBus, filterBus } from "./FilterBus";

// =============================================================================
// PLUGIN REGISTRY
// =============================================================================

export { PluginRegistry, pluginRegistry } from "./PluginRegistry";

// =============================================================================
// PLUGIN CONTEXT
// =============================================================================

export {
  PluginContextFactory,
  PluginContextFactoryOptions,
  createDatabaseService,
} from "./PluginContext";

// =============================================================================
// METADATA SERVICE
// =============================================================================

export { MetadataService, MetadataAPI } from "./MetadataService";

// =============================================================================
// PLUGIN SCHEDULER
// =============================================================================

export {
  createPluginSchedulerAPI,
  getPluginSchedulerQueue,
  registerJobHandler,
  unregisterJobHandler,
  unregisterAllHandlers,
  getJobHandler,
  cleanupOneTimeJob,
  isOneTimeJob,
  shutdownPluginScheduler,
} from "./PluginScheduler";

// =============================================================================
// UI EXTENSION REGISTRY
// =============================================================================

export {
  UIExtensionRegistry,
  uiExtensionRegistry,
  NavigationExtension,
  DashboardWidgetExtension,
  SettingsPageExtension,
  RouteExtension,
  DetailTabExtension,
  DetailTabEntityType,
  PluginUIExtensions,
  UIExtensionManifest,
} from "./UIExtensionRegistry";

// =============================================================================
// PLUGIN MANAGER
// =============================================================================

export { PluginManager, PluginManagerOptions } from "./PluginManager";

// =============================================================================
// EVENT EMISSION HELPER
// =============================================================================

export {
  emitEvent,
  computeChanges,
  getTriggeredBy,
  EventEmitter,
} from "./emitEvent";

// Also export base event types from types.ts
export { BaseEventPayload, EventTriggeredBy } from "./types";

// =============================================================================
// CONVENIENCE HELPERS
// =============================================================================

import {
  PluginManifest,
  FrameworkManifest,
  IntegrationManifest,
  PluginType,
} from "./types";

/**
 * Create a basic plugin manifest
 */
export function createPluginManifest(
  id: string,
  name: string,
  version: string,
  options?: Partial<Omit<PluginManifest, "id" | "name" | "version">>
): PluginManifest {
  return {
    id,
    name,
    version,
    type: options?.type || ("feature" as PluginType),
    description: options?.description || "",
    author: options?.author || "",
    license: options?.license,
    compatibility: options?.compatibility,
    dependencies: options?.dependencies,
    config: options?.config,
    permissions: options?.permissions,
    exports: options?.exports,
  };
}

/**
 * Create a framework plugin manifest
 */
export function createFrameworkManifest(
  id: string,
  name: string,
  version: string,
  frameworkId: number,
  options?: Partial<
    Omit<FrameworkManifest, "id" | "name" | "version" | "type" | "frameworkId">
  >
): FrameworkManifest {
  return {
    id,
    name,
    version,
    type: "framework",
    frameworkId,
    description: options?.description || "",
    author: options?.author || "",
    license: options?.license,
    compatibility: options?.compatibility,
    dependencies: options?.dependencies,
    config: options?.config,
    permissions: options?.permissions,
    exports: options?.exports,
  };
}

/**
 * Create an integration plugin manifest
 */
export function createIntegrationManifest(
  id: string,
  name: string,
  version: string,
  options?: Partial<
    Omit<IntegrationManifest, "id" | "name" | "version" | "type">
  >
): IntegrationManifest {
  return {
    id,
    name,
    version,
    type: "integration",
    description: options?.description || "",
    author: options?.author || "",
    license: options?.license,
    compatibility: options?.compatibility,
    dependencies: options?.dependencies,
    config: options?.config,
    permissions: options?.permissions,
    exports: options?.exports,
  };
}
