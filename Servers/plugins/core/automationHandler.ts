/**
 * VerifyWise Plugin System - Automation Handler
 *
 * Connects the EventBus to the Automation system.
 * When events are emitted, this handler looks up matching automations
 * and enqueues the configured actions.
 */

import { sequelize } from "../../database/db";
import { enqueueAutomationAction } from "../../services/automations/automationProducer";
import { replaceTemplateVariables } from "../../utils/automation/automation.utils";
import logger from "../../utils/logger/fileLogger";
import { EventBus } from "./EventBus";
import { PluginEvent, EventPayloads, BaseEventPayload } from "./types";

/**
 * Structure of automation data retrieved from database
 */
interface AutomationData {
  trigger_key: string;
  action_key: string;
  automation_id: number;
  automation_params: Record<string, unknown>;
  id: number;
  params: Record<string, unknown>;
  order: number;
}

/**
 * Cache for trigger mappings to avoid repeated DB lookups
 * Key: PluginEvent, Value: trigger keys that match this event
 */
const triggerCache = new Map<PluginEvent, string[]>();

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000;
let lastCacheRefresh = 0;

/**
 * Refresh the trigger cache from database
 */
async function refreshTriggerCache(): Promise<void> {
  try {
    const [triggers] = await sequelize.query(
      `SELECT key, event_name FROM public.automation_triggers`
    ) as [{ key: string; event_name: string }[], unknown];

    triggerCache.clear();

    for (const trigger of triggers) {
      const eventName = trigger.event_name as PluginEvent;
      if (!triggerCache.has(eventName)) {
        triggerCache.set(eventName, []);
      }
      triggerCache.get(eventName)!.push(trigger.key);
    }

    lastCacheRefresh = Date.now();
    logger.debug(`[AutomationHandler] Refreshed trigger cache with ${triggers.length} triggers`);
  } catch (error) {
    logger.error("[AutomationHandler] Failed to refresh trigger cache:", error);
  }
}

/**
 * Get trigger keys for an event (with caching)
 */
async function getTriggerKeysForEvent(event: PluginEvent): Promise<string[]> {
  // Refresh cache if expired
  if (Date.now() - lastCacheRefresh > CACHE_TTL) {
    await refreshTriggerCache();
  }

  return triggerCache.get(event) || [];
}

/**
 * Find active automations for a trigger in a specific tenant
 */
async function findActiveAutomations(
  triggerKey: string,
  tenantId: string
): Promise<AutomationData[]> {
  try {
    const [automations] = await sequelize.query(`
      SELECT
        pat.key AS trigger_key,
        paa.key AS action_key,
        a.id AS automation_id,
        a.params AS automation_params,
        aa.id,
        aa.params,
        aa."order"
      FROM public.automation_triggers pat
      JOIN "${tenantId}".automations a ON a.trigger_id = pat.id
      JOIN "${tenantId}".automation_actions aa ON a.id = aa.automation_id
      JOIN public.automation_actions paa ON aa.action_type_id = paa.id
      WHERE pat.key = :triggerKey AND a.is_active = true
      ORDER BY aa."order" ASC
    `, {
      replacements: { triggerKey }
    }) as [AutomationData[], unknown];

    return automations;
  } catch (error) {
    // Schema might not exist for this tenant
    logger.debug(`[AutomationHandler] No automations found for tenant ${tenantId}: ${error}`);
    return [];
  }
}

/**
 * Build replacements object from event payload for template variable substitution
 */
function buildReplacementsFromPayload(
  _event: PluginEvent,
  payload: Record<string, unknown>
): Record<string, string> {
  const replacements: Record<string, string> = {};

  // Add timestamp
  if (payload.timestamp) {
    replacements["{{timestamp}}"] = new Date(payload.timestamp as string).toISOString();
    replacements["{{date}}"] = new Date(payload.timestamp as string).toLocaleDateString();
    replacements["{{time}}"] = new Date(payload.timestamp as string).toLocaleTimeString();
  }

  // Add triggered by info
  const triggeredBy = payload.triggeredBy as { userId: number; email?: string; name?: string } | undefined;
  if (triggeredBy) {
    replacements["{{user_id}}"] = String(triggeredBy.userId);
    if (triggeredBy.email) replacements["{{user_email}}"] = triggeredBy.email;
    if (triggeredBy.name) replacements["{{user_name}}"] = triggeredBy.name;
  }

  // Extract the main entity from payload
  const entityKeys = ["project", "risk", "vendor", "model", "incident", "policy", "task", "training", "note", "file", "vendorRisk", "modelRisk"];
  for (const key of entityKeys) {
    if (payload[key] && typeof payload[key] === "object") {
      const entity = payload[key] as Record<string, unknown>;
      for (const [field, value] of Object.entries(entity)) {
        if (value !== null && value !== undefined) {
          replacements[`{{${key}_${field}}}`] = String(value);
          // Also add without prefix for convenience
          replacements[`{{${field}}}`] = String(value);
        }
      }
    }
  }

  // Add ID fields
  const idFields = ["projectId", "riskId", "vendorId", "modelId", "incidentId", "policyId", "taskId", "trainingId", "noteId", "fileId", "vendorRiskId", "modelRiskId"];
  for (const field of idFields) {
    if (payload[field] !== undefined) {
      replacements[`{{${field}}}`] = String(payload[field]);
    }
  }

  // Add changes if present (for update events)
  if (payload.changes && typeof payload.changes === "object") {
    const changes = payload.changes as Record<string, { before: unknown; after: unknown }>;
    const changedFields = Object.keys(changes);
    replacements["{{changed_fields}}"] = changedFields.join(", ");
    replacements["{{changes_count}}"] = String(changedFields.length);
  }

  return replacements;
}

/**
 * Process an event and trigger any matching automations
 */
async function processEvent<E extends PluginEvent>(
  event: E,
  payload: EventPayloads[E]
): Promise<void> {
  const basePayload = payload as BaseEventPayload;
  const tenantId = basePayload.tenant || "default";

  logger.debug(`[AutomationHandler] Processing event: ${event} for tenant: ${tenantId}`);

  try {
    // Get trigger keys that match this event
    const triggerKeys = await getTriggerKeysForEvent(event);

    if (triggerKeys.length === 0) {
      logger.debug(`[AutomationHandler] No triggers registered for event: ${event}`);
      return;
    }

    // Build replacements for template variables
    const replacements = buildReplacementsFromPayload(event, payload as unknown as Record<string, unknown>);

    // Process each trigger
    for (const triggerKey of triggerKeys) {
      // Find active automations for this trigger in the tenant
      const automations = await findActiveAutomations(triggerKey, tenantId);

      if (automations.length === 0) {
        continue;
      }

      logger.debug(`[AutomationHandler] Found ${automations.length} automation actions for trigger: ${triggerKey}`);

      // Group actions by automation_id to process them in order
      const automationGroups = new Map<number, AutomationData[]>();
      for (const automation of automations) {
        if (!automationGroups.has(automation.automation_id)) {
          automationGroups.set(automation.automation_id, []);
        }
        automationGroups.get(automation.automation_id)!.push(automation);
      }

      // Enqueue actions for each automation
      for (const [automationId, actions] of automationGroups) {
        for (const action of actions) {
          try {
            const actionParams = action.params || {};

            // Replace template variables in action params
            const processedParams: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(actionParams)) {
              if (typeof value === "string") {
                processedParams[key] = replaceTemplateVariables(value, replacements);
              } else {
                processedParams[key] = value;
              }
            }

            // Add context to the action
            const jobData = {
              ...processedParams,
              automation_id: automationId,
              trigger_key: triggerKey,
              trigger_data: {
                event,
                payload,
                timestamp: basePayload.timestamp,
                triggered_by: basePayload.triggeredBy,
              },
              tenant: tenantId,
            };

            // Enqueue the action
            await enqueueAutomationAction(action.action_key, jobData);

            logger.debug(`[AutomationHandler] Enqueued action: ${action.action_key} for automation: ${automationId}`);
          } catch (error) {
            logger.error(`[AutomationHandler] Failed to enqueue action ${action.action_key}:`, error);
          }
        }
      }
    }
  } catch (error) {
    logger.error(`[AutomationHandler] Error processing event ${event}:`, error);
  }
}

/**
 * Register automation handlers for all supported events
 */
export function registerAutomationHandlers(eventBus: EventBus): void {
  logger.info("[AutomationHandler] Registering automation event handlers");

  // List of events to handle (only events that exist in PluginEvent enum)
  const eventsToHandle: PluginEvent[] = [
    // Project events
    PluginEvent.PROJECT_CREATED,
    PluginEvent.PROJECT_UPDATED,
    PluginEvent.PROJECT_DELETED,

    // Risk events
    PluginEvent.RISK_CREATED,
    PluginEvent.RISK_UPDATED,
    PluginEvent.RISK_DELETED,
    PluginEvent.RISK_MITIGATED,

    // Vendor events
    PluginEvent.VENDOR_CREATED,
    PluginEvent.VENDOR_UPDATED,
    PluginEvent.VENDOR_DELETED,

    // Model events
    PluginEvent.MODEL_CREATED,
    PluginEvent.MODEL_UPDATED,
    PluginEvent.MODEL_DELETED,
    PluginEvent.MODEL_STATUS_CHANGED,

    // Vendor Risk events
    PluginEvent.VENDOR_RISK_CREATED,
    PluginEvent.VENDOR_RISK_UPDATED,
    PluginEvent.VENDOR_RISK_DELETED,
    PluginEvent.VENDOR_RISK_MITIGATED,

    // Model Risk events
    PluginEvent.MODEL_RISK_CREATED,
    PluginEvent.MODEL_RISK_UPDATED,
    PluginEvent.MODEL_RISK_DELETED,
    PluginEvent.MODEL_RISK_MITIGATED,

    // Incident events
    PluginEvent.INCIDENT_CREATED,
    PluginEvent.INCIDENT_UPDATED,
    PluginEvent.INCIDENT_DELETED,
    PluginEvent.INCIDENT_RESOLVED,

    // Policy events
    PluginEvent.POLICY_CREATED,
    PluginEvent.POLICY_UPDATED,
    PluginEvent.POLICY_DELETED,
    PluginEvent.POLICY_PUBLISHED,

    // Task events
    PluginEvent.TASK_CREATED,
    PluginEvent.TASK_UPDATED,
    PluginEvent.TASK_DELETED,
    PluginEvent.TASK_COMPLETED,
    PluginEvent.TASK_ASSIGNED,

    // Training events
    PluginEvent.TRAINING_CREATED,
    PluginEvent.TRAINING_UPDATED,
    PluginEvent.TRAINING_DELETED,
    PluginEvent.TRAINING_COMPLETED,
    PluginEvent.TRAINING_ASSIGNED,

    // Note events
    PluginEvent.NOTE_CREATED,
    PluginEvent.NOTE_UPDATED,
    PluginEvent.NOTE_DELETED,

    // File events
    PluginEvent.FILE_UPLOADED,
    PluginEvent.FILE_UPDATED,
    PluginEvent.FILE_DELETED,

    // User events
    PluginEvent.USER_CREATED,
    PluginEvent.USER_UPDATED,
    PluginEvent.USER_DELETED,
    PluginEvent.USER_LOGIN,
    PluginEvent.USER_LOGOUT,
  ];

  // Register handler for each event
  for (const event of eventsToHandle) {
    eventBus.on(
      event,
      async (payload, _context) => {
        await processEvent(event, payload);
      },
      "automation-handler"
    );
  }

  // Initial cache refresh
  refreshTriggerCache().catch((error) => {
    logger.error("[AutomationHandler] Initial cache refresh failed:", error);
  });

  logger.info(`[AutomationHandler] Registered handlers for ${eventsToHandle.length} events`);
}

/**
 * Manually refresh the trigger cache (useful after automation changes)
 */
export async function refreshAutomationTriggerCache(): Promise<void> {
  await refreshTriggerCache();
}

/**
 * Clear the trigger cache (useful for testing)
 */
export function clearAutomationTriggerCache(): void {
  triggerCache.clear();
  lastCacheRefresh = 0;
}
