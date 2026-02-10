/**
 * Shadow AI Insights Utils
 *
 * Database queries for insights dashboard: summary stats,
 * top tools, department breakdowns, and trends.
 */

import { sequelize } from "../database/db";
import {
  ShadowAiInsightsSummary,
  ShadowAiToolByEvents,
  ShadowAiToolByUsers,
  ShadowAiUsersByDepartment,
  ShadowAiTrendPoint,
  ShadowAiUserActivity,
  ShadowAiDepartmentActivity,
} from "../domain.layer/interfaces/i.shadowAi";

/**
 * Get summary stats for the insights dashboard.
 */
export async function getInsightsSummaryQuery(
  tenant: string
): Promise<ShadowAiInsightsSummary> {
  // Unique apps
  const [appsResult] = await sequelize.query(
    `SELECT COUNT(*) as count FROM "${tenant}".shadow_ai_tools`
  );
  const uniqueApps = parseInt((appsResult as any[])[0].count, 10);

  // Total AI users (distinct emails in last 30 days)
  const [usersResult] = await sequelize.query(
    `SELECT COUNT(DISTINCT user_email) as count
     FROM "${tenant}".shadow_ai_events
     WHERE event_timestamp > NOW() - INTERVAL '30 days'`
  );
  const totalAiUsers = parseInt((usersResult as any[])[0].count, 10);

  // Highest risk tool
  const [riskResult] = await sequelize.query(
    `SELECT name, risk_score
     FROM "${tenant}".shadow_ai_tools
     WHERE risk_score IS NOT NULL
     ORDER BY risk_score DESC
     LIMIT 1`
  );
  const highestRiskTool =
    (riskResult as any[]).length > 0
      ? {
          name: (riskResult as any[])[0].name,
          risk_score: (riskResult as any[])[0].risk_score,
        }
      : null;

  // Most active department
  const [deptResult] = await sequelize.query(
    `SELECT department, COUNT(*) as event_count
     FROM "${tenant}".shadow_ai_events
     WHERE department IS NOT NULL
       AND event_timestamp > NOW() - INTERVAL '30 days'
     GROUP BY department
     ORDER BY event_count DESC
     LIMIT 1`
  );
  const mostActiveDepartment =
    (deptResult as any[]).length > 0
      ? (deptResult as any[])[0].department
      : null;

  // Departments using AI
  const [deptCountResult] = await sequelize.query(
    `SELECT COUNT(DISTINCT department) as count
     FROM "${tenant}".shadow_ai_events
     WHERE department IS NOT NULL
       AND event_timestamp > NOW() - INTERVAL '30 days'`
  );
  const departmentsUsingAi = parseInt(
    (deptCountResult as any[])[0].count,
    10
  );

  return {
    unique_apps: uniqueApps,
    total_ai_users: totalAiUsers,
    highest_risk_tool: highestRiskTool,
    most_active_department: mostActiveDepartment,
    departments_using_ai: departmentsUsingAi,
  };
}

/**
 * Get top tools by event count.
 */
export async function getToolsByEventsQuery(
  tenant: string,
  periodDays: number = 30,
  limit: number = 6
): Promise<ShadowAiToolByEvents[]> {
  const [rows] = await sequelize.query(
    `SELECT t.name as tool_name, COUNT(e.id) as event_count
     FROM "${tenant}".shadow_ai_events e
     JOIN "${tenant}".shadow_ai_tools t ON e.detected_tool_id = t.id
     WHERE e.event_timestamp > NOW() - INTERVAL '1 day' * :periodDays
     GROUP BY t.name
     ORDER BY event_count DESC
     LIMIT :limit`,
    { replacements: { periodDays, limit } }
  );

  return (rows as any[]).map((r) => ({
    tool_name: r.tool_name,
    event_count: parseInt(r.event_count, 10),
  }));
}

/**
 * Get top tools by unique user count.
 */
export async function getToolsByUsersQuery(
  tenant: string,
  periodDays: number = 30,
  limit: number = 6
): Promise<ShadowAiToolByUsers[]> {
  const [rows] = await sequelize.query(
    `SELECT t.name as tool_name, COUNT(DISTINCT e.user_email) as user_count
     FROM "${tenant}".shadow_ai_events e
     JOIN "${tenant}".shadow_ai_tools t ON e.detected_tool_id = t.id
     WHERE e.event_timestamp > NOW() - INTERVAL '1 day' * :periodDays
     GROUP BY t.name
     ORDER BY user_count DESC
     LIMIT :limit`,
    { replacements: { periodDays, limit } }
  );

  return (rows as any[]).map((r) => ({
    tool_name: r.tool_name,
    user_count: parseInt(r.user_count, 10),
  }));
}

/**
 * Get users by department for pie chart.
 */
export async function getUsersByDepartmentQuery(
  tenant: string,
  periodDays: number = 30
): Promise<ShadowAiUsersByDepartment[]> {
  const [rows] = await sequelize.query(
    `SELECT
       COALESCE(department, 'Unknown') as department,
       COUNT(DISTINCT user_email) as user_count
     FROM "${tenant}".shadow_ai_events
     WHERE event_timestamp > NOW() - INTERVAL '1 day' * :periodDays
     GROUP BY department
     ORDER BY user_count DESC`,
    { replacements: { periodDays } }
  );

  return (rows as any[]).map((r) => ({
    department: r.department,
    user_count: parseInt(r.user_count, 10),
  }));
}

/**
 * Get trend data for the line chart.
 */
export async function getTrendQuery(
  tenant: string,
  periodDays: number = 90,
  granularity: "daily" | "weekly" | "monthly" = "daily"
): Promise<ShadowAiTrendPoint[]> {
  const DATE_FORMAT_MAP: Record<string, string> = {
    monthly: "YYYY-MM-01",
    weekly: "IYYY-IW",
    daily: "YYYY-MM-DD",
  };
  const dateFormat = DATE_FORMAT_MAP[granularity] || DATE_FORMAT_MAP.daily;

  const [rows] = await sequelize.query(
    `SELECT
       TO_CHAR(event_timestamp, :dateFormat) as date,
       COUNT(*) as total_events,
       COUNT(DISTINCT user_email) as unique_users,
       COUNT(DISTINCT CASE
         WHEN detected_tool_id IN (
           SELECT id FROM "${tenant}".shadow_ai_tools
           WHERE DATE(first_detected_at) = DATE(event_timestamp)
         ) THEN detected_tool_id
       END) as new_tools
     FROM "${tenant}".shadow_ai_events
     WHERE event_timestamp > NOW() - INTERVAL '1 day' * :periodDays
     GROUP BY TO_CHAR(event_timestamp, :dateFormat)
     ORDER BY date ASC`,
    { replacements: { periodDays, dateFormat } }
  );

  return (rows as any[]).map((r) => ({
    date: r.date,
    total_events: parseInt(r.total_events, 10),
    unique_users: parseInt(r.unique_users, 10),
    new_tools: parseInt(r.new_tools, 10),
  }));
}

/**
 * Get user activity for the user activity table.
 */
export async function getUserActivityQuery(
  tenant: string,
  options?: {
    page?: number;
    limit?: number;
    sort?: string;
    department?: string;
  }
): Promise<{ users: ShadowAiUserActivity[]; total: number }> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = (page - 1) * limit;

  let whereClause =
    "WHERE e.event_timestamp > NOW() - INTERVAL '30 days'";
  const replacements: Record<string, any> = { limit, offset };

  if (options?.department) {
    whereClause += " AND e.department = :department";
    replacements.department = options.department;
  }

  const SORT_MAP: Record<string, string> = {
    risk: "risk_score DESC",
    email: "user_email ASC",
  };
  const sortColumn = SORT_MAP[options?.sort || ""] || "total_prompts DESC";

  const [rows] = await sequelize.query(
    `SELECT
       e.user_email,
       COUNT(CASE WHEN e.http_method = 'POST' THEN 1 END) as total_prompts,
       COALESCE(MAX(t.risk_score), 0) as risk_score,
       COALESCE(MAX(e.department), 'Unknown') as department
     FROM "${tenant}".shadow_ai_events e
     LEFT JOIN "${tenant}".shadow_ai_tools t ON e.detected_tool_id = t.id
     ${whereClause}
     GROUP BY e.user_email
     ORDER BY ${sortColumn}
     LIMIT :limit OFFSET :offset`,
    { replacements }
  );

  const [countResult] = await sequelize.query(
    `SELECT COUNT(DISTINCT user_email) as total
     FROM "${tenant}".shadow_ai_events e
     ${whereClause}`,
    { replacements }
  );

  return {
    users: (rows as any[]).map((r) => ({
      user_email: r.user_email,
      total_prompts: parseInt(r.total_prompts, 10),
      risk_score: parseInt(r.risk_score, 10),
      department: r.department,
    })),
    total: parseInt((countResult as any[])[0].total, 10),
  };
}

/**
 * Get department activity breakdown.
 */
export async function getDepartmentActivityQuery(
  tenant: string
): Promise<ShadowAiDepartmentActivity[]> {
  const [rows] = await sequelize.query(
    `SELECT
       COALESCE(e.department, 'Unknown') as department,
       COUNT(DISTINCT e.user_email) as users,
       COUNT(CASE WHEN e.http_method = 'POST' THEN 1 END) as total_prompts,
       (SELECT t2.name FROM "${tenant}".shadow_ai_tools t2
        WHERE t2.id = (
          SELECT e2.detected_tool_id FROM "${tenant}".shadow_ai_events e2
          WHERE e2.department = e.department
            AND e2.event_timestamp > NOW() - INTERVAL '30 days'
          GROUP BY e2.detected_tool_id
          ORDER BY COUNT(*) DESC LIMIT 1
        )
       ) as top_tool,
       COALESCE(MAX(t.risk_score), 0) as risk_score
     FROM "${tenant}".shadow_ai_events e
     LEFT JOIN "${tenant}".shadow_ai_tools t ON e.detected_tool_id = t.id
     WHERE e.event_timestamp > NOW() - INTERVAL '30 days'
     GROUP BY e.department
     ORDER BY total_prompts DESC`
  );

  return (rows as any[]).map((r) => ({
    department: r.department,
    users: parseInt(r.users, 10),
    total_prompts: parseInt(r.total_prompts, 10),
    top_tool: r.top_tool || "N/A",
    risk_score: parseInt(r.risk_score, 10),
  }));
}

/**
 * Get detailed activity for a specific user.
 */
export async function getUserDetailQuery(
  tenant: string,
  userEmail: string,
  periodDays: number = 30
): Promise<
  Array<{
    tool_name: string;
    event_count: number;
    last_used: string;
  }>
> {
  const [rows] = await sequelize.query(
    `SELECT
       t.name as tool_name,
       COUNT(*) as event_count,
       MAX(e.event_timestamp) as last_used
     FROM "${tenant}".shadow_ai_events e
     JOIN "${tenant}".shadow_ai_tools t ON e.detected_tool_id = t.id
     WHERE e.user_email = :userEmail
       AND e.event_timestamp > NOW() - INTERVAL '1 day' * :periodDays
     GROUP BY t.name
     ORDER BY event_count DESC`,
    { replacements: { userEmail, periodDays } }
  );

  return rows as any[];
}
