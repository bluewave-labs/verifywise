/**
 * VerifyWise Plugin System - Event Emission Helper
 *
 * Provides a simple interface for controllers to emit events.
 * This module handles the complexity of getting the EventBus and
 * constructing proper event payloads.
 */

import {
  PluginEvent,
  EventPayloads,
  BaseEventPayload,
  EventTriggeredBy,
} from "./types";
import { getPluginManager } from "../init";
import logger from "../../utils/logger/fileLogger";

/**
 * Options for emitting an event
 */
interface EmitEventOptions {
  /** The user who triggered this event */
  triggeredBy: EventTriggeredBy;
  /** The tenant (organization) context */
  tenant?: string;
  /** Custom timestamp (defaults to now) */
  timestamp?: Date;
}

/**
 * Helper to compute changes between two objects
 * Returns an object with { before, after } for each changed field
 */
export function computeChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, { before: unknown; after: unknown }> {
  const changes: Record<string, { before: unknown; after: unknown }> = {};

  // Get all unique keys from both objects
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const beforeValue = before[key];
    const afterValue = after[key];

    // Skip if values are the same (simple comparison)
    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changes[key] = { before: beforeValue, after: afterValue };
    }
  }

  return changes;
}

/**
 * Create base event payload with common fields
 */
function createBasePayload(options: EmitEventOptions): BaseEventPayload {
  return {
    tenant: options.tenant || "default",
    timestamp: options.timestamp || new Date(),
    triggeredBy: options.triggeredBy,
  };
}

/**
 * Emit an event through the plugin system
 *
 * This is a fire-and-forget operation - errors are logged but don't
 * interrupt the calling code. This ensures that event emission never
 * breaks the main business logic.
 *
 * @param event - The event type to emit
 * @param payload - Event-specific payload data (will be merged with base payload)
 * @param options - Common options (triggeredBy, tenant, timestamp)
 *
 * @example
 * // Emit a project created event
 * await emitEvent(
 *   PluginEvent.PROJECT_CREATED,
 *   { projectId: 123, project: projectData },
 *   { triggeredBy: { userId: currentUser.id, email: currentUser.email } }
 * );
 */
export async function emitEvent<E extends PluginEvent>(
  event: E,
  payload: Omit<EventPayloads[E], keyof BaseEventPayload>,
  options: EmitEventOptions
): Promise<void> {
  try {
    const pluginManager = getPluginManager();
    if (!pluginManager) {
      // Plugin system not initialized - silently skip
      logger.debug(`[Events] Plugin system not ready, skipping event: ${event}`);
      return;
    }

    const eventBus = pluginManager.getEventBus();
    if (!eventBus) {
      logger.debug(`[Events] EventBus not available, skipping event: ${event}`);
      return;
    }

    // Merge base payload with event-specific payload
    const fullPayload = {
      ...createBasePayload(options),
      ...payload,
    } as EventPayloads[E];

    // Fire and forget - use Promise.resolve to ensure we don't block
    eventBus.emit(event, fullPayload).catch((error) => {
      logger.error(`[Events] Failed to emit ${event}:`, error);
    });

    logger.debug(`[Events] Emitted: ${event}`, {
      entityId: getEntityId(payload),
      triggeredBy: options.triggeredBy.userId
    });
  } catch (error) {
    // Log but don't throw - event emission should never break business logic
    logger.error(`[Events] Error emitting ${event}:`, error);
  }
}

/**
 * Helper to extract entity ID from payload for logging
 */
function getEntityId(payload: Record<string, unknown>): number | undefined {
  // Try common ID field names
  const idFields = [
    "projectId",
    "riskId",
    "vendorId",
    "modelId",
    "incidentId",
    "policyId",
    "taskId",
    "trainingId",
    "noteId",
    "fileId",
    "userId",
    "vendorRiskId",
    "modelRiskId",
  ];

  for (const field of idFields) {
    if (typeof payload[field] === "number") {
      return payload[field] as number;
    }
  }

  return undefined;
}

/**
 * Create a triggeredBy object from request user
 * Extracts user info from the authenticated request
 */
export function getTriggeredBy(req: { user?: { id: number; email?: string; name?: string } }): EventTriggeredBy {
  if (!req.user) {
    return { userId: 0 }; // System action
  }

  return {
    userId: req.user.id,
    email: req.user.email,
    name: req.user.name,
  };
}

/**
 * Convenience wrapper for emitting CRUD events
 * Provides typed helpers for common patterns
 */
export const EventEmitter = {
  /**
   * Emit a "created" event for any entity
   */
  async created<E extends PluginEvent>(
    event: E,
    payload: Omit<EventPayloads[E], keyof BaseEventPayload>,
    options: EmitEventOptions
  ): Promise<void> {
    return emitEvent(event, payload, options);
  },

  /**
   * Emit an "updated" event with automatic change detection
   */
  async updated<E extends PluginEvent>(
    event: E,
    payload: Omit<EventPayloads[E], keyof BaseEventPayload>,
    options: EmitEventOptions
  ): Promise<void> {
    return emitEvent(event, payload, options);
  },

  /**
   * Emit a "deleted" event
   */
  async deleted<E extends PluginEvent>(
    event: E,
    payload: Omit<EventPayloads[E], keyof BaseEventPayload>,
    options: EmitEventOptions
  ): Promise<void> {
    return emitEvent(event, payload, options);
  },
};

export default emitEvent;
