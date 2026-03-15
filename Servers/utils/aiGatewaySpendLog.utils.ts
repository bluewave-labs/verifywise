/**
 * AI Gateway Spend Log Utils
 *
 * Database utilities for recording and querying AI Gateway spend data.
 * Uses raw SQL queries with unqualified table names (resolved via search_path).
 */

import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";

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
    metadata?: object;
    request_messages?: object;
    response_text?: string;
    error_message?: string;
    virtual_key_id?: number;
  }
): Promise<IAiGatewaySpendLog> => {
  const result = (await sequelize.query(
    `INSERT INTO ai_gateway_spend_logs
       (organization_id, endpoint_id, user_id, provider, model,
        prompt_tokens, completion_tokens, total_tokens, cost_usd, latency_ms, status_code,
        metadata, request_messages, response_text, error_message, virtual_key_id, created_at)
     VALUES
       (:organizationId, :endpoint_id, :user_id, :provider, :model,
        :prompt_tokens, :completion_tokens, :total_tokens, :cost_usd, :latency_ms, :status_code,
        :metadata, :request_messages, :response_text, :error_message, :virtual_key_id, NOW())
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
        metadata: JSON.stringify(data.metadata || {}),
        request_messages: data.request_messages ? JSON.stringify(data.request_messages) : null,
        response_text: data.response_text || null,
        error_message: data.error_message || null,
        virtual_key_id: data.virtual_key_id || null,
      },
    }
  )) as [IAiGatewaySpendLog[], number];

  return result[0][0];
};

export interface ISpendLogFilters {
  endpoint_id?: number;
  status?: "success" | "error";
  source?: "playground" | "virtual-key";
  start_date?: string;
  end_date?: string;
  search?: string;
}

/**
 * Get paginated spend logs with full request/response data (for log viewer).
 * Supports optional server-side filters for endpoint, status, source, date range, and search.
 */
export const getSpendLogsDetailQuery = async (
  organizationId: number,
  limit: number = 50,
  offset: number = 0,
  filters?: ISpendLogFilters
): Promise<{ rows: any[]; total: number }> => {
  // Build dynamic WHERE conditions
  const conditions: string[] = ["s.organization_id = :organizationId"];
  const replacements: Record<string, any> = { organizationId, limit, offset };

  if (filters?.endpoint_id) {
    conditions.push("s.endpoint_id = :endpoint_id");
    replacements.endpoint_id = filters.endpoint_id;
  }

  if (filters?.status === "success") {
    conditions.push("s.status_code = 200");
  } else if (filters?.status === "error") {
    conditions.push("s.status_code != 200");
  }

  if (filters?.source === "playground") {
    conditions.push("s.user_id > 0 AND s.virtual_key_id IS NULL");
  } else if (filters?.source === "virtual-key") {
    conditions.push("s.virtual_key_id IS NOT NULL");
  }

  if (filters?.start_date) {
    conditions.push("s.created_at >= :start_date");
    replacements.start_date = filters.start_date;
  }

  if (filters?.end_date) {
    conditions.push("s.created_at <= :end_date");
    replacements.end_date = filters.end_date;
  }

  if (filters?.search) {
    conditions.push(
      `(e.display_name ILIKE :search OR s.model ILIKE :search
        OR COALESCE(u.name, '') || ' ' || COALESCE(u.surname, '') ILIKE :search
        OR vk.name ILIKE :search)`
    );
    replacements.search = `%${filters.search}%`;
  }

  const whereClause = conditions.join(" AND ");

  const [rows, countResult] = await Promise.all([
    sequelize.query(
      `SELECT s.id, s.endpoint_id, e.display_name AS endpoint_name, e.slug AS endpoint_slug,
              s.model, s.provider, s.prompt_tokens, s.completion_tokens, s.total_tokens,
              s.cost_usd, s.latency_ms, s.status_code, s.metadata,
              s.request_messages, s.response_text, s.error_message,
              s.created_at, s.virtual_key_id,
              COALESCE(NULLIF(TRIM(COALESCE(u.name, '') || ' ' || COALESCE(u.surname, '')), ''), 'unknown') AS user_name,
              vk.name AS virtual_key_name, vk.key_prefix AS virtual_key_prefix
       FROM ai_gateway_spend_logs s
       LEFT JOIN ai_gateway_endpoints e ON e.id = s.endpoint_id
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN ai_gateway_virtual_keys vk ON vk.id = s.virtual_key_id
       WHERE ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT :limit OFFSET :offset`,
      { replacements, type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT COUNT(*)::int AS total
       FROM ai_gateway_spend_logs s
       LEFT JOIN ai_gateway_endpoints e ON e.id = s.endpoint_id
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN ai_gateway_virtual_keys vk ON vk.id = s.virtual_key_id
       WHERE ${whereClause}`,
      { replacements, type: QueryTypes.SELECT }
    ),
  ]);
  return { rows: rows as any[], total: (countResult as any[])[0]?.total || 0 };
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
     GROUP BY s.user_id, u.name, u.surname
     ORDER BY total_cost DESC`,
    { replacements: { organizationId, startDate, endDate } }
  )) as [ISpendByGroup[], number];

  return result[0];
};

/**
 * Get spend breakdown by time bucket within a date range.
 * For "1d" period, groups by hour. Otherwise groups by day.
 */
export const getSpendByDayQuery = async (
  organizationId: number,
  startDate: string,
  endDate: string,
  period: string = "7d"
): Promise<ISpendByDay[]> => {
  if (period === "1d") {
    // Generate all 24 hours and LEFT JOIN with actual data
    const result = (await sequelize.query(
      `SELECT
         h.hour AS day,
         COALESCE(SUM(s.cost_usd), 0)::float AS total_cost,
         COUNT(s.id)::int AS total_requests,
         COALESCE(SUM(s.total_tokens), 0)::int AS total_tokens
       FROM generate_series(0, 23) AS h(hour)
       LEFT JOIN ai_gateway_spend_logs s
         ON s.organization_id = :organizationId
         AND s.created_at >= :startDate
         AND s.created_at <= :endDate
         AND EXTRACT(HOUR FROM s.created_at AT TIME ZONE 'UTC') = h.hour
       GROUP BY h.hour
       ORDER BY h.hour`,
      { replacements: { organizationId, startDate, endDate } }
    )) as [ISpendByDay[], number];

    // Format hour numbers to "HH:00"
    return result[0].map((r: any) => ({
      ...r,
      day: String(r.day).padStart(2, "0") + ":00",
    }));
  }

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

/**
 * Get spend grouped by a metadata tag key
 */
export const getSpendByTagQuery = async (
  organizationId: number,
  tagKey: string,
  startDate: string,
  endDate: string
): Promise<ISpendByGroup[]> => {
  const result = (await sequelize.query(
    `SELECT
       COALESCE(metadata->>:tagKey, 'untagged') AS group_key,
       COALESCE(SUM(cost_usd), 0)::float AS total_cost,
       COUNT(*)::int AS total_requests,
       COALESCE(SUM(total_tokens), 0)::int AS total_tokens
     FROM ai_gateway_spend_logs
     WHERE organization_id = :organizationId
       AND created_at >= :startDate
       AND created_at <= :endDate
     GROUP BY metadata->>:tagKey
     ORDER BY total_cost DESC`,
    { replacements: { organizationId, tagKey, startDate, endDate } }
  )) as [ISpendByGroup[], number];

  return result[0];
};

/**
 * Purge old spend logs based on retention period.
 * Batch deletes 1,000 at a time (same pattern as LiteLLM).
 */
export const purgeSpendLogsQuery = async (
  organizationId: number,
  retentionDays: number
): Promise<number> => {
  let totalDeleted = 0;
  const maxBatches = 50;

  for (let i = 0; i < maxBatches; i++) {
    const [, meta] = await sequelize.query(
      `DELETE FROM ai_gateway_spend_logs
       WHERE id IN (
         SELECT id FROM ai_gateway_spend_logs
         WHERE organization_id = :organizationId
           AND created_at < NOW() - (:days || ' days')::interval
         LIMIT 1000
       )`,
      { replacements: { organizationId, days: retentionDays } }
    );
    const deleted = (meta as any)?.rowCount || 0;
    totalDeleted += deleted;
    if (deleted < 1000) break;
  }

  return totalDeleted;
};
