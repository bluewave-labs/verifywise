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
import { insertAlertHistoryQuery } from "../utils/shadowAiRules.utils";

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
      console.error(
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
  await insertAlertHistoryQuery(
    tenant,
    rule.id,
    rule.trigger_type,
    {
      tool_name: context.toolName,
      tool_id: context.toolId,
      user_email: context.userEmail,
      department: context.department,
      risk_score: context.riskScore,
    },
    rule.actions?.map((a) => a.type) || []
  );

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
