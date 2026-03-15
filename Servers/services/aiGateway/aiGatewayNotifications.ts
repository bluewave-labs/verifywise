/**
 * AI Gateway Email Notifications
 *
 * Sends in-app + email notifications for budget and guardrail events.
 * Uses the same dual-notification pattern as other VerifyWise modules.
 */

import { sendInAppNotification } from "../inAppNotification.service";
import {
  NotificationType,
  NotificationEntityType,
} from "../../domain.layer/interfaces/i.notification";
import { EMAIL_TEMPLATES } from "../../constants/emailTemplates";
import { sequelize } from "../../database/db";
import { QueryTypes } from "sequelize";
import logger from "../../utils/logger/fileLogger";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Get all admin user IDs for an organization.
 */
async function getOrgAdminIds(organizationId: number): Promise<number[]> {
  const users = await sequelize.query(
    `SELECT id FROM users WHERE organization_id = :organizationId AND role_id = 1`,
    { replacements: { organizationId }, type: QueryTypes.SELECT }
  );
  return (users as any[]).map((u) => u.id);
}

/**
 * Notify: Budget threshold crossed (e.g., 80% of limit reached)
 */
export async function notifyBudgetWarning(
  organizationId: number,
  budget: {
    current_spend_usd: number;
    monthly_limit_usd: number;
    alert_threshold_pct: number;
    is_hard_limit: boolean;
  }
): Promise<void> {
  const adminIds = await getOrgAdminIds(organizationId);
  const spendPct = Math.round(
    (Number(budget.current_spend_usd) / Number(budget.monthly_limit_usd)) * 100
  );

  for (const adminId of adminIds) {
    try {
      await sendInAppNotification(
        organizationId,
        {
          user_id: adminId,
          type: NotificationType.AI_GATEWAY_BUDGET_WARNING,
          title: "AI Gateway budget warning",
          message: `Spend has reached ${spendPct}% of the $${Number(budget.monthly_limit_usd).toFixed(2)} monthly limit.`,
          entity_type: NotificationEntityType.AI_GATEWAY,
          action_url: `${FRONTEND_URL}/ai-gateway/settings`,
        },
        true,
        {
          template: EMAIL_TEMPLATES.AI_GATEWAY_BUDGET_WARNING,
          subject: `AI Gateway: spend at ${spendPct}% of monthly budget`,
          variables: {
            recipient_name: "Admin",
            spend_percentage: String(spendPct),
            current_spend: Number(budget.current_spend_usd).toFixed(2),
            monthly_limit: Number(budget.monthly_limit_usd).toFixed(2),
            threshold: String(budget.alert_threshold_pct),
            hard_limit_status: budget.is_hard_limit
              ? "Enabled (requests will be rejected)"
              : "Disabled (requests continue)",
            total_requests: "—",
            gateway_url: `${FRONTEND_URL}/ai-gateway/analytics`,
          },
        }
      );
    } catch (err) {
      logger.error(`Failed to send budget warning to admin ${adminId}:`, err);
    }
  }
}

/**
 * Notify: Budget exhausted with hard limit (all requests rejected)
 */
export async function notifyBudgetExhausted(
  organizationId: number,
  budget: {
    current_spend_usd: number;
    monthly_limit_usd: number;
  }
): Promise<void> {
  const adminIds = await getOrgAdminIds(organizationId);

  for (const adminId of adminIds) {
    try {
      await sendInAppNotification(
        organizationId,
        {
          user_id: adminId,
          type: NotificationType.AI_GATEWAY_BUDGET_EXHAUSTED,
          title: "AI Gateway budget exhausted",
          message: `Monthly budget of $${Number(budget.monthly_limit_usd).toFixed(2)} is exhausted. All requests are being rejected.`,
          entity_type: NotificationEntityType.AI_GATEWAY,
          action_url: `${FRONTEND_URL}/ai-gateway/settings`,
        },
        true,
        {
          template: EMAIL_TEMPLATES.AI_GATEWAY_BUDGET_EXHAUSTED,
          subject: "AI Gateway: budget exhausted, requests rejected",
          variables: {
            recipient_name: "Admin",
            current_spend: Number(budget.current_spend_usd).toFixed(2),
            monthly_limit: Number(budget.monthly_limit_usd).toFixed(2),
            settings_url: `${FRONTEND_URL}/ai-gateway/settings`,
          },
        }
      );
    } catch (err) {
      logger.error(`Failed to send budget exhausted to admin ${adminId}:`, err);
    }
  }
}

/**
 * Notify: Guardrail activity spike (many blocks/masks in a short period)
 */
export async function notifyGuardrailSpike(
  organizationId: number,
  stats: {
    blocked_count: number;
    masked_count: number;
    pii_count: number;
    content_filter_count: number;
    active_rules: number;
  }
): Promise<void> {
  const adminIds = await getOrgAdminIds(organizationId);

  for (const adminId of adminIds) {
    try {
      await sendInAppNotification(
        organizationId,
        {
          user_id: adminId,
          type: NotificationType.AI_GATEWAY_GUARDRAIL_SPIKE,
          title: "Guardrail activity spike",
          message: `${stats.blocked_count} blocked and ${stats.masked_count} masked requests in the last hour.`,
          entity_type: NotificationEntityType.AI_GATEWAY,
          action_url: `${FRONTEND_URL}/ai-gateway/guardrails`,
        },
        true,
        {
          template: EMAIL_TEMPLATES.AI_GATEWAY_GUARDRAIL_SPIKE,
          subject: `AI Gateway: ${stats.blocked_count + stats.masked_count} guardrail triggers in the last hour`,
          variables: {
            recipient_name: "Admin",
            blocked_count: String(stats.blocked_count),
            masked_count: String(stats.masked_count),
            pii_count: String(stats.pii_count),
            content_filter_count: String(stats.content_filter_count),
            active_rules: String(stats.active_rules),
            guardrails_url: `${FRONTEND_URL}/ai-gateway/guardrails`,
          },
        }
      );
    } catch (err) {
      logger.error(`Failed to send guardrail spike to admin ${adminId}:`, err);
    }
  }
}
