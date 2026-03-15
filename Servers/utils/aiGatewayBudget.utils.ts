/**
 * AI Gateway Budget Utils
 *
 * Database utilities for managing AI Gateway budgets with atomic operations.
 * Uses raw SQL queries with unqualified table names (resolved via search_path).
 */

import { sequelize } from "../database/db";

export interface IAiGatewayBudget {
  id: number;
  organization_id: number;
  monthly_limit_usd: number;
  current_spend_usd: number;
  alert_threshold_pct: number;
  is_hard_limit: boolean;
  period_start: string;
  alert_email_enabled: boolean;
  alert_slack_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get the budget for an organization
 */
export const getBudgetQuery = async (
  organizationId: number
): Promise<IAiGatewayBudget | null> => {
  const result = (await sequelize.query(
    `SELECT id, organization_id, monthly_limit_usd, current_spend_usd,
            alert_threshold_pct, is_hard_limit, period_start, created_at, updated_at
     FROM ai_gateway_budgets
     WHERE organization_id = :organizationId`,
    { replacements: { organizationId } }
  )) as [IAiGatewayBudget[], number];

  return result[0].length > 0 ? result[0][0] : null;
};

/**
 * Create or update an organization budget (upsert)
 */
export const upsertBudgetQuery = async (
  organizationId: number,
  data: {
    monthly_limit_usd: number;
    alert_threshold_pct?: number;
    is_hard_limit?: boolean;
  }
): Promise<IAiGatewayBudget> => {
  const result = (await sequelize.query(
    `INSERT INTO ai_gateway_budgets
       (organization_id, monthly_limit_usd, current_spend_usd, alert_threshold_pct, is_hard_limit, period_start, created_at, updated_at)
     VALUES
       (:organizationId, :monthly_limit_usd, 0, :alert_threshold_pct, :is_hard_limit, DATE_TRUNC('month', NOW()), NOW(), NOW())
     ON CONFLICT (organization_id)
     DO UPDATE SET
       monthly_limit_usd = :monthly_limit_usd,
       alert_threshold_pct = :alert_threshold_pct,
       is_hard_limit = :is_hard_limit,
       updated_at = NOW()
     RETURNING id, organization_id, monthly_limit_usd, current_spend_usd,
               alert_threshold_pct, is_hard_limit, period_start, created_at, updated_at`,
    {
      replacements: {
        organizationId,
        monthly_limit_usd: data.monthly_limit_usd,
        alert_threshold_pct: data.alert_threshold_pct ?? 80,
        is_hard_limit: data.is_hard_limit ?? false,
      },
    }
  )) as [IAiGatewayBudget[], number];

  return result[0][0];
};

/**
 * Atomic budget reservation: only succeeds if current_spend + estimated does not exceed limit.
 * Returns true if reservation succeeded, false if budget would be exceeded.
 */
export const reserveBudgetQuery = async (
  organizationId: number,
  estimatedCost: number
): Promise<boolean> => {
  const result = (await sequelize.query(
    `UPDATE ai_gateway_budgets
     SET current_spend_usd = current_spend_usd + :estimatedCost,
         updated_at = NOW()
     WHERE organization_id = :organizationId
       AND (
         is_hard_limit = false
         OR current_spend_usd + :estimatedCost <= monthly_limit_usd
       )
     RETURNING id`,
    { replacements: { organizationId, estimatedCost } }
  )) as [{ id: number }[], number];

  return (result[0] as any[]).length > 0;
};

/**
 * Adjust budget spend after a request completes.
 * Removes the estimated cost and adds the actual cost.
 */
export const adjustBudgetSpendQuery = async (
  organizationId: number,
  estimatedCost: number,
  actualCost: number
): Promise<void> => {
  const adjustment = actualCost - estimatedCost;

  await sequelize.query(
    `UPDATE ai_gateway_budgets
     SET current_spend_usd = GREATEST(0, current_spend_usd + :adjustment),
         updated_at = NOW()
     WHERE organization_id = :organizationId`,
    { replacements: { organizationId, adjustment } }
  );
};

/**
 * Reset budget spend to 0 and update period_start.
 * If organizationId is provided, resets that org only.
 * If omitted, resets all orgs where period_start is before the current month
 * (used by the monthly BullMQ cron job).
 */
export const resetBudgetSpend = async (
  organizationId?: number
): Promise<number> => {
  const where = organizationId
    ? "organization_id = :organizationId"
    : "period_start < DATE_TRUNC('month', NOW())";
  const [, meta] = await sequelize.query(
    `UPDATE ai_gateway_budgets
     SET current_spend_usd = 0,
         period_start = DATE_TRUNC('month', NOW()),
         updated_at = NOW()
     WHERE ${where}`,
    { replacements: organizationId ? { organizationId } : {} }
  );
  return (meta as any)?.rowCount || 0;
};

// Aliases for backward compatibility
export const resetBudgetSpendQuery = (organizationId: number) => resetBudgetSpend(organizationId);
export const resetAllBudgets = () => resetBudgetSpend();
