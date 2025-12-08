/**
 * VerifyWise Plugin System - Plugin Context Factory
 *
 * Creates scoped contexts for plugins with access to services.
 * Each plugin gets its own context instance with its ID and configuration.
 */

import { Request, Response } from "express";
import { Transaction, Sequelize } from "sequelize";
import {
  PluginContext,
  PluginLogger,
  PluginConfig,
  DatabaseService,
  Plugin,
  PluginEvent,
  EventPayloads,
  EventHandler,
  PluginFilter,
  FilterPayloads,
  FilterHandler,
  PluginSchedulerAPI,
} from "./types";
import { EventBus } from "./EventBus";
import { FilterBus } from "./FilterBus";
import { PluginRegistry } from "./PluginRegistry";
import { MetadataService, MetadataAPI } from "./MetadataService";
import { createPluginSchedulerAPI } from "./PluginScheduler";

export interface PluginContextFactoryOptions {
  eventBus: EventBus;
  filterBus: FilterBus;
  registry: PluginRegistry;
  db: DatabaseService;
  defaultTenant?: string;
}

/**
 * Factory for creating plugin contexts
 */
export class PluginContextFactory {
  private eventBus: EventBus;
  private filterBus: FilterBus;
  private registry: PluginRegistry;
  private db: DatabaseService;
  private defaultTenant: string;
  private configStore: Map<string, Record<string, unknown>> = new Map();

  constructor(options: PluginContextFactoryOptions) {
    this.eventBus = options.eventBus;
    this.filterBus = options.filterBus;
    this.registry = options.registry;
    this.db = options.db;
    this.defaultTenant = options.defaultTenant || "default";

    // Wire up the event bus to use this factory for contexts
    this.eventBus.setContextFactory((pluginId) =>
      this.createContext(pluginId, this.defaultTenant)
    );
  }

  /**
   * Create a context for a plugin
   */
  createContext(
    pluginId: string,
    tenant: string = this.defaultTenant,
    request?: Request,
    response?: Response
  ): PluginContext {
    const logger = this.createLogger(pluginId);
    const config = this.createConfig(pluginId);
    const metadata = new MetadataService(this.db, pluginId, tenant);
    const scheduler = createPluginSchedulerAPI(pluginId, tenant);

    const context: PluginContext = {
      pluginId,
      tenant,
      db: this.db,
      logger,
      config,
      metadata,
      scheduler,
      request,
      response,

      // Event system
      emit: async <E extends PluginEvent>(
        event: E,
        payload: EventPayloads[E],
        options?: { transaction?: Transaction }
      ) => {
        await this.eventBus.emit(event, payload, options);
      },

      on: <E extends PluginEvent>(event: E, handler: EventHandler<E>) => {
        this.eventBus.on(event, handler, pluginId);
      },

      off: <E extends PluginEvent>(event: E, handler: EventHandler<E>) => {
        this.eventBus.off(event, handler, pluginId);
      },

      // Filter system
      applyFilters: async <F extends PluginFilter>(
        filter: F,
        data: FilterPayloads[F]
      ) => {
        return this.filterBus.applyFilters(filter, data);
      },

      addFilter: <F extends PluginFilter>(
        filter: F,
        handler: FilterHandler<F>,
        priority?: number
      ) => {
        this.filterBus.addFilter(filter, handler, pluginId, priority);
      },

      removeFilter: <F extends PluginFilter>(
        filter: F,
        handler: FilterHandler<F>
      ) => {
        this.filterBus.removeFilter(filter, handler, pluginId);
      },

      // Plugin access
      getPlugin: <T extends Plugin>(id: string) => {
        return this.registry.get<T>(id);
      },

      isPluginEnabled: (id: string) => {
        return this.registry.isEnabled(id);
      },
    };

    return context;
  }

  /**
   * Create a logger for a plugin
   */
  private createLogger(pluginId: string): PluginLogger {
    const prefix = `[Plugin:${pluginId}]`;

    return {
      debug: (message: string, meta?: Record<string, unknown>) => {
        if (process.env.NODE_ENV === "development") {
          console.debug(prefix, message, meta || "");
        }
      },
      info: (message: string, meta?: Record<string, unknown>) => {
        console.info(prefix, message, meta || "");
      },
      warn: (message: string, meta?: Record<string, unknown>) => {
        console.warn(prefix, message, meta || "");
      },
      error: (message: string, meta?: Record<string, unknown>) => {
        console.error(prefix, message, meta || "");
      },
    };
  }

  /**
   * Create a config accessor for a plugin
   */
  private createConfig(pluginId: string): PluginConfig {
    // Get stored config or initialize
    if (!this.configStore.has(pluginId)) {
      const registryConfig = this.registry.getConfig(pluginId);
      this.configStore.set(pluginId, { ...registryConfig });
    }

    return {
      get: <T = unknown>(key: string, defaultValue?: T): T => {
        const config = this.configStore.get(pluginId) || {};
        const value = config[key];
        return (value !== undefined ? value : defaultValue) as T;
      },

      set: async (key: string, value: unknown): Promise<void> => {
        const config = this.configStore.get(pluginId) || {};
        config[key] = value;
        this.configStore.set(pluginId, config);
        // Also update registry
        this.registry.setConfig(pluginId, config);
      },

      getAll: (): Record<string, unknown> => {
        return { ...(this.configStore.get(pluginId) || {}) };
      },
    };
  }

  /**
   * Set config for a plugin
   */
  setPluginConfig(pluginId: string, config: Record<string, unknown>): void {
    this.configStore.set(pluginId, { ...config });
    this.registry.setConfig(pluginId, config);
  }

  /**
   * Get config for a plugin
   */
  getPluginConfig(pluginId: string): Record<string, unknown> {
    return this.configStore.get(pluginId) || {};
  }

  /**
   * Remove config for a specific plugin
   *
   * Should be called when a plugin is unregistered to prevent memory leaks.
   */
  removePluginConfig(pluginId: string): boolean {
    return this.configStore.delete(pluginId);
  }

  /**
   * Clear config store (for testing)
   */
  clearConfig(): void {
    this.configStore.clear();
  }

  /**
   * Get the number of plugins with stored config (for monitoring)
   */
  getConfigStoreSize(): number {
    return this.configStore.size;
  }
}

/**
 * Create a minimal database service wrapper from Sequelize instance
 */
export function createDatabaseService(sequelize: Sequelize): DatabaseService {
  return {
    query: async (sql: string, params?: unknown[]) => {
      const [results] = await sequelize.query(sql, {
        bind: params,
      });
      return {
        rows: results as Record<string, unknown>[],
        rowCount: Array.isArray(results) ? results.length : 0,
      };
    },
    transaction: async <T>(callback: (t: Transaction) => Promise<T>) => {
      return sequelize.transaction(callback);
    },
  };
}
