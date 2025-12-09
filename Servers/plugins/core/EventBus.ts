/**
 * VerifyWise Plugin System - Event Bus
 *
 * Handles event emission and subscription with transaction-aware batching.
 * Events emitted within a transaction are queued and only dispatched after commit.
 */

import { Transaction } from "sequelize";
import {
  PluginEvent,
  EventPayloads,
  EventHandler,
  PluginContext,
  QueuedEvent,
} from "./types";

// Symbol to store event queue on transaction object
const EVENT_QUEUE_KEY = Symbol("pluginEventQueue");
const COMMIT_HANDLER_KEY = Symbol("pluginCommitHandler");

interface TransactionWithQueue extends Transaction {
  [EVENT_QUEUE_KEY]?: QueuedEvent[];
  [COMMIT_HANDLER_KEY]?: boolean;
}

interface HandlerEntry<E extends PluginEvent> {
  handler: EventHandler<E>;
  pluginId: string;
}

export class EventBus {
  private handlers: Map<PluginEvent, HandlerEntry<PluginEvent>[]> = new Map();
  private contextFactory: ((pluginId: string) => PluginContext) | null = null;

  /**
   * Set the context factory for providing plugin context to handlers
   */
  setContextFactory(factory: (pluginId: string) => PluginContext): void {
    this.contextFactory = factory;
  }

  /**
   * Register an event handler
   */
  on<E extends PluginEvent>(
    event: E,
    handler: EventHandler<E>,
    pluginId: string
  ): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }

    const handlers = this.handlers.get(event)!;

    // Prevent duplicate registration
    const exists = handlers.some(
      (h) => h.handler === handler && h.pluginId === pluginId
    );
    if (!exists) {
      handlers.push({ handler: handler as EventHandler<PluginEvent>, pluginId });
    }
  }

  /**
   * Unregister an event handler
   */
  off<E extends PluginEvent>(
    event: E,
    handler: EventHandler<E>,
    pluginId: string
  ): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    const index = handlers.findIndex(
      (h) => h.handler === handler && h.pluginId === pluginId
    );
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Remove all handlers for a specific plugin
   */
  removePluginHandlers(pluginId: string): void {
    const entries = Array.from(this.handlers.entries());
    for (const [event, handlers] of entries) {
      const filtered = handlers.filter((h) => h.pluginId !== pluginId);
      if (filtered.length === 0) {
        this.handlers.delete(event);
      } else {
        this.handlers.set(event, filtered);
      }
    }
  }

  /**
   * Emit an event, respecting transaction boundaries
   *
   * If a transaction is provided, the event is queued until the transaction commits.
   * If the transaction rolls back, queued events are discarded.
   */
  async emit<E extends PluginEvent>(
    event: E,
    payload: EventPayloads[E],
    options?: { transaction?: Transaction }
  ): Promise<void> {
    const transaction = options?.transaction as TransactionWithQueue | undefined;

    if (transaction) {
      this.queueForTransaction(transaction, event, payload);
    } else {
      await this.dispatch(event, payload);
    }
  }

  /**
   * Queue an event to be emitted after transaction commits
   */
  private queueForTransaction<E extends PluginEvent>(
    transaction: TransactionWithQueue,
    event: E,
    payload: EventPayloads[E]
  ): void {
    // Initialize queue if needed
    if (!transaction[EVENT_QUEUE_KEY]) {
      transaction[EVENT_QUEUE_KEY] = [];
    }

    // Register commit handler once per transaction
    if (!transaction[COMMIT_HANDLER_KEY]) {
      transaction[COMMIT_HANDLER_KEY] = true;

      // Sequelize's afterCommit hook
      transaction.afterCommit(async () => {
        const queue = transaction[EVENT_QUEUE_KEY] || [];

        for (const queued of queue) {
          try {
            await this.dispatch(
              queued.event,
              queued.payload as EventPayloads[typeof queued.event]
            );
          } catch (error) {
            // Log but don't fail - event handlers shouldn't break commits
            console.error(
              `[EventBus] Handler error for ${queued.event}:`,
              error
            );
          }
        }
      });
    }

    // Add to queue
    transaction[EVENT_QUEUE_KEY].push({
      event,
      payload: payload as EventPayloads[PluginEvent],
    });
  }

  /**
   * Dispatch an event to all registered handlers
   */
  private async dispatch<E extends PluginEvent>(
    event: E,
    payload: EventPayloads[E]
  ): Promise<void> {
    const handlers = this.handlers.get(event) || [];

    if (handlers.length === 0) {
      return;
    }

    // Run handlers in parallel with error isolation
    const results = await Promise.allSettled(
      handlers.map(async ({ handler, pluginId }) => {
        const context = this.contextFactory?.(pluginId);
        if (!context) {
          console.warn(
            `[EventBus] No context available for plugin ${pluginId}`
          );
          return;
        }

        try {
          await handler(payload, context);
        } catch (error) {
          console.error(
            `[EventBus] Handler error in plugin ${pluginId} for ${event}:`,
            error
          );
          throw error; // Re-throw to be caught by allSettled
        }
      })
    );

    // Log any failures (but don't throw - fire and forget)
    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected"
    );
    if (failures.length > 0) {
      console.warn(
        `[EventBus] ${failures.length}/${handlers.length} handlers failed for ${event}`
      );
    }
  }

  /**
   * Check if any handlers are registered for an event
   */
  hasHandlers(event: PluginEvent): boolean {
    return (this.handlers.get(event)?.length ?? 0) > 0;
  }

  /**
   * Get count of registered handlers for an event
   */
  getHandlerCount(event: PluginEvent): number {
    return this.handlers.get(event)?.length ?? 0;
  }

  /**
   * Get all registered events
   */
  getRegisteredEvents(): PluginEvent[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all handlers (for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Singleton instance
export const eventBus = new EventBus();
