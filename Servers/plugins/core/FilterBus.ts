/**
 * VerifyWise Plugin System - Filter Bus
 *
 * Handles data transformation pipelines with priority-based execution.
 * Unlike events (fire-and-forget), filters transform data and return results.
 */

import {
  PluginFilter,
  FilterPayloads,
  FilterHandler,
  FilterHandlerEntry,
} from "./types";

const DEFAULT_PRIORITY = 10;

export class FilterBus {
  private handlers: Map<PluginFilter, FilterHandlerEntry<PluginFilter>[]> =
    new Map();

  /**
   * Register a filter handler with optional priority
   *
   * Lower priority numbers run first (like WordPress).
   * Default priority is 10.
   *
   * @param filter - The filter to handle
   * @param handler - The handler function
   * @param pluginId - ID of the plugin registering this handler
   * @param priority - Execution priority (lower = earlier, default: 10)
   */
  addFilter<F extends PluginFilter>(
    filter: F,
    handler: FilterHandler<F>,
    pluginId: string,
    priority: number = DEFAULT_PRIORITY
  ): void {
    if (!this.handlers.has(filter)) {
      this.handlers.set(filter, []);
    }

    const handlers = this.handlers.get(filter)!;

    // Prevent duplicate registration
    const handlerAsUnknown = handler as unknown;
    const exists = handlers.some(
      (h) => (h.handler as unknown) === handlerAsUnknown && h.pluginId === pluginId
    );
    if (exists) {
      return;
    }

    handlers.push({
      handler: handler as unknown as FilterHandler<PluginFilter>,
      priority,
      pluginId,
    });

    // Sort by priority (ascending - lower runs first)
    handlers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove a filter handler
   */
  removeFilter<F extends PluginFilter>(
    filter: F,
    handler: FilterHandler<F>,
    pluginId: string
  ): void {
    const handlers = this.handlers.get(filter);
    if (!handlers) return;

    const handlerAsUnknown = handler as unknown;
    const index = handlers.findIndex(
      (h) => (h.handler as unknown) === handlerAsUnknown && h.pluginId === pluginId
    );
    if (index > -1) {
      handlers.splice(index, 1);
    }

    // Clean up empty arrays
    if (handlers.length === 0) {
      this.handlers.delete(filter);
    }
  }

  /**
   * Remove all handlers for a specific plugin
   */
  removePluginHandlers(pluginId: string): void {
    const entries = Array.from(this.handlers.entries());
    for (const [filter, handlers] of entries) {
      const filtered = handlers.filter((h) => h.pluginId !== pluginId);
      if (filtered.length === 0) {
        this.handlers.delete(filter);
      } else {
        this.handlers.set(filter, filtered);
      }
    }
  }

  /**
   * Apply all handlers to data in priority order
   *
   * Each handler receives the output of the previous handler.
   * If a handler throws, the error is logged and the pipeline continues
   * with the last successful result.
   *
   * @param filter - The filter to apply
   * @param data - The initial data
   * @returns The transformed data after all handlers have run
   */
  async applyFilters<F extends PluginFilter>(
    filter: F,
    data: FilterPayloads[F]
  ): Promise<FilterPayloads[F]> {
    const handlers = this.handlers.get(filter) || [];

    if (handlers.length === 0) {
      return data;
    }

    let result: FilterPayloads[F] = data;

    for (const { handler, pluginId, priority } of handlers) {
      try {
        result = (await handler(
          result as FilterPayloads[PluginFilter]
        )) as FilterPayloads[F];
      } catch (error) {
        // Log error but continue pipeline with last successful result
        console.error(
          `[FilterBus] Handler error in plugin ${pluginId} for ${filter} (priority ${priority}):`,
          error
        );
        // Continue with previous result - don't break the pipeline
      }
    }

    return result;
  }

  /**
   * Apply filters synchronously (for when you know handlers are sync)
   *
   * Warning: If handlers are async, this will not await them properly.
   * Use applyFilters() for async handlers.
   */
  applyFiltersSync<F extends PluginFilter>(
    filter: F,
    data: FilterPayloads[F]
  ): FilterPayloads[F] {
    const handlers = this.handlers.get(filter) || [];

    if (handlers.length === 0) {
      return data;
    }

    let result: FilterPayloads[F] = data;

    for (const { handler, pluginId, priority } of handlers) {
      try {
        // Cast to sync - caller is responsible for ensuring handlers are sync
        const handlerResult = handler(result as FilterPayloads[PluginFilter]);
        if (handlerResult instanceof Promise) {
          console.warn(
            `[FilterBus] Async handler used with applyFiltersSync in plugin ${pluginId} for ${filter}`
          );
          continue; // Skip async handlers in sync mode
        }
        result = handlerResult as FilterPayloads[F];
      } catch (error) {
        console.error(
          `[FilterBus] Handler error in plugin ${pluginId} for ${filter} (priority ${priority}):`,
          error
        );
      }
    }

    return result;
  }

  /**
   * Check if any handlers are registered for a filter
   */
  hasFilters(filter: PluginFilter): boolean {
    return (this.handlers.get(filter)?.length ?? 0) > 0;
  }

  /**
   * Get count of registered handlers for a filter
   */
  getHandlerCount(filter: PluginFilter): number {
    return this.handlers.get(filter)?.length ?? 0;
  }

  /**
   * Get all registered filters
   */
  getRegisteredFilters(): PluginFilter[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get handler info for a filter (for debugging)
   */
  getHandlerInfo(
    filter: PluginFilter
  ): Array<{ pluginId: string; priority: number }> {
    const handlers = this.handlers.get(filter) || [];
    return handlers.map(({ pluginId, priority }) => ({ pluginId, priority }));
  }

  /**
   * Clear all handlers (for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Singleton instance
export const filterBus = new FilterBus();
