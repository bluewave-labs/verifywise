/**
 * Shadow AI Alert Notification Service
 *
 * Sends in-app and email notifications when Shadow AI rules are triggered.
 * Integrates with the existing notification system.
 */

import {
  sendInAppNotification,
  sendBulkInAppNotifications,
} from "./inAppNotification.service";
import { EMAIL_TEMPLATES } from "../constants/emailTemplates";
import {
  IShadowAiRule,
  ShadowAiTriggerType,
} from "../domain.layer/interfaces/i.shadowAi";
import {
  NotificationType,
  NotificationEntityType,
} from "../domain.layer/interfaces/i.notification";
import { insertAlertHistoryQuery, getActiveRulesQuery } from "../utils/shadowAiRules.utils";
import { sequelize } from "../database/db";
import logger from "../utils/logger/fileLogger";

const TRIGGER_LABELS: Record<ShadowAiTriggerType, string> = {
  new_tool_detected: "New AI tool detected",
  usage_threshold_exceeded: "Usage threshold exceeded",
  sensitive_department: "Sensitive department using AI",
  blocked_attempt: "Blocked tool access attempt",
  risk_score_exceeded: "Risk score threshold exceeded",
  new_user_detected: "New user using AI tools",
};

interface AlertContext {
  toolName?: string;
  toolId?: number;
  userEmail?: string;
  department?: string;
  riskScore?: number;
  eventCount?: number;
  threshold?: number;
}

/**
 * Process triggered rules and send notifications.
 * Called during event ingestion when rules match.
 */
export async function processTriggeredRules(
  tenant: string,
  rules: IShadowAiRule[],
  context: AlertContext
): Promise<void> {
  for (const rule of rules) {
    try {
      await sendRuleAlert(tenant, rule, context);
    } catch (error) {
      logger.error(
        `Failed to process alert for rule ${rule.id}:`,
        error
      );
    }
  }
}

/**
 * Send alert for a single triggered rule.
 */
async function sendRuleAlert(
  tenant: string,
  rule: IShadowAiRule,
  context: AlertContext
): Promise<void> {
  const triggerLabel =
    TRIGGER_LABELS[rule.trigger_type] || rule.trigger_type;
  const description = buildAlertDescription(rule, context);
  const firedAt = new Date().toISOString();

  // 1. Record alert in history
  await insertAlertHistoryQuery(tenant, {
    rule_id: rule.id!,
    rule_name: rule.name,
    trigger_type: rule.trigger_type,
    trigger_data: {
      tool_name: context.toolName,
      tool_id: context.toolId,
      user_email: context.userEmail,
      department: context.department,
      risk_score: context.riskScore,
    },
    actions_taken: {
      types: rule.actions?.map((a) => a.type) || [],
      fired_at: firedAt,
    },
  });

  // 2. Send notifications to configured users
  const userIds = rule.notification_user_ids || [];
  if (userIds.length === 0) return;

  const emailConfig = {
    subject: `Shadow AI alert: ${triggerLabel}`,
    template: EMAIL_TEMPLATES.SHADOW_AI_ALERT,
    variables: {
      alert_title: triggerLabel,
      rule_name: rule.name,
      alert_description: description,
      trigger_type: triggerLabel,
      tool_name: context.toolName || "Unknown",
      fired_at: new Date(firedAt).toLocaleString(),
      action_url: `${process.env.FRONTEND_URL || ""}/shadow-ai/rules`,
    },
  };

  if (userIds.length === 1) {
    await sendInAppNotification(
      tenant,
      {
        user_id: userIds[0],
        type: NotificationType.SHADOW_AI_ALERT,
        title: `Shadow AI: ${triggerLabel}`,
        message: description,
        entity_type: NotificationEntityType.SHADOW_AI_TOOL,
        entity_id: context.toolId,
        entity_name: context.toolName,
        action_url: "/shadow-ai/rules",
        created_by: 0, // system
      },
      true,
      emailConfig
    );
  } else {
    await sendBulkInAppNotifications(
      tenant,
      {
        user_ids: userIds,
        type: NotificationType.SHADOW_AI_ALERT,
        title: `Shadow AI: ${triggerLabel}`,
        message: description,
        entity_type: NotificationEntityType.SHADOW_AI_TOOL,
        entity_id: context.toolId,
        entity_name: context.toolName,
        action_url: "/shadow-ai/rules",
        created_by: 0,
      },
      true,
      emailConfig
    );
  }
}

/**
 * Build human-readable description for the alert.
 */
function buildAlertDescription(
  rule: IShadowAiRule,
  context: AlertContext
): string {
  switch (rule.trigger_type) {
    case "new_tool_detected":
      return `A new AI tool "${context.toolName || "Unknown"}" has been detected in your organization.`;
    case "usage_threshold_exceeded":
      return `AI tool "${context.toolName || "Unknown"}" has exceeded the usage threshold (${context.eventCount || 0} events, threshold: ${context.threshold || "N/A"}).`;
    case "sensitive_department":
      return `AI tool usage detected in sensitive department "${context.department || "Unknown"}" by ${context.userEmail || "unknown user"}.`;
    case "blocked_attempt":
      return `An attempt to access blocked AI tool "${context.toolName || "Unknown"}" was detected from ${context.userEmail || "unknown user"}.`;
    case "risk_score_exceeded":
      return `AI tool "${context.toolName || "Unknown"}" has a risk score of ${context.riskScore || 0}, exceeding the threshold.`;
    case "new_user_detected":
      return `New user "${context.userEmail || "Unknown"}" detected using AI tools in ${context.department || "your organization"}.`;
    default:
      return `Rule "${rule.name}" was triggered.`;
  }
}

// ─── Batch Rule Evaluation ──────────────────────────────────────────

export interface BatchContext {
  newToolIds: Set<number>;
  newToolNames: Map<number, string>;
  toolEventCounts: Map<number, number>;
  toolDepartments: Map<number, Set<string>>;
  toolEmails: Map<number, Set<string>>;
  blockedAttempts: { toolId: number; toolName: string; userEmail: string }[];
  allDepartments: Set<string>;
  allEmails: Set<string>;
}

/**
 * Evaluate all active rules against the ingested batch data.
 * Called asynchronously after event ingestion completes.
 */
export async function evaluateRulesForBatch(
  tenant: string,
  batch: BatchContext
): Promise<void> {
  let rules: IShadowAiRule[];
  try {
    rules = await getActiveRulesQuery(tenant);
  } catch (error) {
    logger.debug("Rule evaluation skipped (rules table unavailable)");
    return;
  }

  if (rules.length === 0) return;

  const triggered: { rule: IShadowAiRule; context: AlertContext }[] = [];

  for (const rule of rules) {
    switch (rule.trigger_type) {
      case "new_tool_detected":
        // Fire once per newly detected tool
        for (const toolId of batch.newToolIds) {
          triggered.push({
            rule,
            context: {
              toolName: batch.newToolNames.get(toolId) || "Unknown",
              toolId,
            },
          });
        }
        break;

      case "usage_threshold_exceeded": {
        const threshold = (rule.trigger_config?.event_count_threshold as number) || 100;
        for (const [toolId, count] of batch.toolEventCounts) {
          if (count >= threshold) {
            triggered.push({
              rule,
              context: {
                toolId,
                toolName: batch.newToolNames.get(toolId) || `Tool #${toolId}`,
                eventCount: count,
                threshold,
              },
            });
          }
        }
        break;
      }

      case "sensitive_department": {
        const sensitiveList = (rule.trigger_config?.departments as string[]) || [];
        if (sensitiveList.length === 0) break;
        const sensitiveSet = new Set(sensitiveList.map((d) => d.toLowerCase()));
        for (const dept of batch.allDepartments) {
          if (sensitiveSet.has(dept.toLowerCase())) {
            triggered.push({
              rule,
              context: { department: dept },
            });
          }
        }
        break;
      }

      case "blocked_attempt":
        for (const attempt of batch.blockedAttempts) {
          triggered.push({
            rule,
            context: {
              toolId: attempt.toolId,
              toolName: attempt.toolName,
              userEmail: attempt.userEmail,
            },
          });
        }
        break;

      case "risk_score_exceeded": {
        const minScore = (rule.trigger_config?.risk_score_min as number) || 70;
        // Check risk scores of tools that received events in this batch
        for (const toolId of batch.toolEventCounts.keys()) {
          try {
            const [rows] = await sequelize.query(
              `SELECT risk_score, name FROM "${tenant}".shadow_ai_tools WHERE id = :toolId`,
              { replacements: { toolId } }
            );
            const tool = (rows as any[])[0];
            if (tool && tool.risk_score != null && tool.risk_score >= minScore) {
              triggered.push({
                rule,
                context: {
                  toolId,
                  toolName: tool.name,
                  riskScore: tool.risk_score,
                },
              });
            }
          } catch {
            // Skip if query fails
          }
        }
        break;
      }

      case "new_user_detected":
        // For simplicity, fire for each unique email in the batch.
        // A production system would track known users and only fire for truly new ones.
        // For now, this triggers when new events come from users not previously seen.
        for (const email of batch.allEmails) {
          try {
            const [rows] = await sequelize.query(
              `SELECT COUNT(*) as cnt FROM "${tenant}".shadow_ai_events
               WHERE user_email = :email AND ingested_at < NOW() - INTERVAL '1 minute'`,
              { replacements: { email } }
            );
            const count = parseInt((rows as any[])[0].cnt, 10);
            if (count === 0) {
              // First time seeing this user
              const deptArr = [...batch.allDepartments];
              triggered.push({
                rule,
                context: {
                  userEmail: email,
                  department: deptArr.length > 0 ? deptArr[0] : undefined,
                },
              });
            }
          } catch {
            // Skip if query fails
          }
        }
        break;
    }
  }

  // Send alerts for all triggered rules
  if (triggered.length > 0) {
    logger.debug(`🔔 ${triggered.length} alert(s) triggered for tenant ${tenant.substring(0, 4)}...`);
    for (const { rule, context } of triggered) {
      try {
        await sendRuleAlert(tenant, rule, context);
      } catch (error) {
        logger.error(`Failed to send alert for rule ${rule.id}:`, error);
      }
    }
  }
}
