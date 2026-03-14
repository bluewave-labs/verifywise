/**
 * AI Gateway Spend Log Utils
 *
 * Database utilities for recording and querying AI Gateway spend data.
 * Uses raw SQL queries with unqualified table names (resolved via search_path).
 */

import { sequelize } from "../database/db";

export interface IAiGatewaySpendLog {
  id: number;
  organization_id: number;
  endpoint_id: number;
  user_id: number;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  latency_ms: number;
  status_code: number;
  created_at: string;
}

export interface ISpendSummary {
  total_cost: number;
  total_requests: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  avg_latency_ms: number;
}

export interface ISpendByGroup {
  group_key: string;
  total_cost: number;
  total_requests: number;
  total_tokens: number;
}

export interface ISpendByDay {
  day: string;
  total_cost: number;
  total_requests: number;
  total_tokens: number;
}

/**
 * Insert a spend log record
 */
export const insertSpendLogQuery = async (
  organizationId: number,
  data: {
    endpoint_id: number;
    user_id: number;
    provider: string;
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_usd: number;
    latency_ms: number;
    status_code: number;
  }
): Promise<IAiGatewaySpendLog> => {
  const result = (await sequelize.query(
    `INSERT INTO ai_gateway_spend_logs
       (organization_id, endpoint_id, user_id, provider, model,
        prompt_tokens, completion_tokens, total_tokens, cost_usd, latency_ms, status_code, created_at)
     VALUES
       (:organizationId, :endpoint_id, :user_id, :provider, :model,
        :prompt_tokens, :completion_tokens, :total_tokens, :cost_usd, :latency_ms, :status_code, NOW())
     RETURNING *`,
    {
      replacements: {
        organizationId,
        endpoint_id: data.endpoint_id,
        user_id: data.user_id,
        provider: data.provider,
        model: data.model,
        prompt_tokens: data.prompt_tokens,
        completion_tokens: data.completion_tokens,
        total_tokens: data.total_tokens,
        cost_usd: data.cost_usd,
        latency_ms: data.latency_ms,
        status_code: data.status_code,
      },
    }
  )) as [IAiGatewaySpendLog[], number];

  return result[0][0];
};

/**
 * Get spend summary (total cost, requests, tokens) within a date range
 */
export const getSpendSummaryQuery = async (
  organizationId: number,
  startDate: string,
  endDate: string
): Promise<ISpendSummary> => {
  const result = (await sequelize.query(
    `SELECT
       COALESCE(SUM(cost_usd), 0)::float AS total_cost,
       COUNT(*)::int AS total_requests,
       COALESCE(SUM(prompt_tokens), 0)::int AS total_prompt_tokens,
       COALESCE(SUM(completion_tokens), 0)::int AS total_completion_tokens,
       COALESCE(SUM(total_tokens), 0)::int AS total_tokens,
       COALESCE(AVG(latency_ms), 0)::float AS avg_latency_ms
     FROM ai_gateway_spend_logs
     WHERE organization_id = :organizationId
       AND created_at >= :startDate
       AND created_at <= :endDate`,
    { replacements: { organizationId, startDate, endDate } }
  )) as [ISpendSummary[], number];

  return result[0][0];
};

/**
 * Get spend grouped by model within a date range
 */
export const getSpendByModelQuery = async (
  organizationId: number,
  startDate: string,
  endDate: string
): Promise<ISpendByGroup[]> => {
  const result = (await sequelize.query(
    `SELECT
       model AS group_key,
       COALESCE(SUM(cost_usd), 0)::float AS total_cost,
       COUNT(*)::int AS total_requests,
       COALESCE(SUM(total_tokens), 0)::int AS total_tokens
     FROM ai_gateway_spend_logs
     WHERE organization_id = :organizationId
       AND created_at >= :startDate
       AND created_at <= :endDate
     GROUP BY model
     ORDER BY total_cost DESC`,
    { replacements: { organizationId, startDate, endDate } }
  )) as [ISpendByGroup[], number];

  return result[0];
};

/**
 * Get spend grouped by endpoint within a date range
 */
export const getSpendByEndpointQuery = async (
  organizationId: number,
  startDate: string,
  endDate: string
): Promise<ISpendByGroup[]> => {
  const result = (await sequelize.query(
    `SELECT
       COALESCE(e.display_name, 'unknown') AS group_key,
       COALESCE(SUM(s.cost_usd), 0)::float AS total_cost,
       COUNT(*)::int AS total_requests,
       COALESCE(SUM(s.total_tokens), 0)::int AS total_tokens
     FROM ai_gateway_spend_logs s
     LEFT JOIN ai_gateway_endpoints e ON e.id = s.endpoint_id AND e.organization_id = s.organization_id
     WHERE s.organization_id = :organizationId
       AND s.created_at >= :startDate
       AND s.created_at <= :endDate
     GROUP BY e.id, e.display_name
     ORDER BY total_cost DESC`,
    { replacements: { organizationId, startDate, endDate } }
  )) as [ISpendByGroup[], number];

  return result[0];
};

/**
 * Get spend grouped by user within a date range
 */
export const getSpendByUserQuery = async (
  organizationId: number,
  startDate: string,
  endDate: string
): Promise<ISpendByGroup[]> => {
  const result = (await sequelize.query(
    `SELECT
       COALESCE(NULLIF(TRIM(COALESCE(u.name, '') || ' ' || COALESCE(u.surname, '')), ''), 'unknown') AS group_key,
       COALESCE(SUM(s.cost_usd), 0)::float AS total_cost,
       COUNT(*)::int AS total_requests,
       COALESCE(SUM(s.total_tokens), 0)::int AS total_tokens
     FROM ai_gateway_spend_logs s
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.organization_id = :organizationId
       AND s.created_at >= :startDate
       AND s.created_at <= :endDate
     GROUP BY u.name, u.surname
     ORDER BY total_cost DESC`,
    { replacements: { organizationId, startDate, endDate } }
  )) as [ISpendByGroup[], number];

  return result[0];
};

/**
 * Get daily spend breakdown within a date range
 */
export const getSpendByDayQuery = async (
  organizationId: number,
  startDate: string,
  endDate: string
): Promise<ISpendByDay[]> => {
  const result = (await sequelize.query(
    `SELECT
       DATE(created_at)::text AS day,
       COALESCE(SUM(cost_usd), 0)::float AS total_cost,
       COUNT(*)::int AS total_requests,
       COALESCE(SUM(total_tokens), 0)::int AS total_tokens
     FROM ai_gateway_spend_logs
     WHERE organization_id = :organizationId
       AND created_at >= :startDate
       AND created_at <= :endDate
     GROUP BY DATE(created_at)
     ORDER BY day ASC`,
    { replacements: { organizationId, startDate, endDate } }
  )) as [ISpendByDay[], number];

  return result[0];
};
