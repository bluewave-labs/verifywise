/**
 * Shadow AI Report Data Collector
 *
 * Queries shadow_ai_* tables and structures data for report generation.
 * Reuses existing query functions where possible.
 */

import { sequelize } from "../../database/db";
import {
  getInsightsSummaryQuery,
  getTrendQuery,
  getUserActivityQuery,
  getDepartmentActivityQuery,
} from "../../utils/shadowAiInsights.utils";
import { getAllToolsQuery } from "../../utils/shadowAiTools.utils";

// ─── Interfaces ──────────────────────────────────────────────────────────

export interface ShadowAIReportData {
  metadata: ShadowAIReportMetadata;
  branding: { organizationName: string; primaryColor: string };
  sections: Record<string, any>;
}

export interface ShadowAIReportMetadata {
  generatedAt: Date;
  generatedBy: string;
  period: string;
  periodDays: number;
  tenantId: string;
}

interface ExecutiveSummaryData {
  uniqueApps: number;
  totalUsers: number;
  departments: number;
  highestRiskTool: { name: string; risk_score: number } | null;
  mostActiveDepartment: string | null;
}

interface ToolInventoryData {
  tools: Array<{
    name: string;
    vendor: string;
    status: string;
    riskScore: number;
    totalUsers: number;
    totalEvents: number;
    complianceFlags: string[];
  }>;
  statusBreakdown: Array<{ status: string; count: number; color: string }>;
  riskBreakdown: Array<{ level: string; count: number; color: string }>;
}

interface RiskAnalysisData {
  toolsByRisk: Array<{
    name: string;
    riskScore: number;
    status: string;
  }>;
  riskDistribution: Array<{ level: string; count: number; color: string }>;
}

interface UsageTrendData {
  dataPoints: Array<{
    date: string;
    totalEvents: number;
    uniqueUsers: number;
    newTools: number;
  }>;
  periodSummary: {
    totalEvents: number;
    avgDailyEvents: number;
    peakDay: string;
    peakEvents: number;
  };
}

interface DepartmentBreakdownData {
  departments: Array<{
    name: string;
    users: number;
    prompts: number;
    topTool: string;
    maxRisk: number;
  }>;
}

interface TopUsersData {
  users: Array<{
    email: string;
    prompts: number;
    department: string;
    riskScore: number;
  }>;
}

interface CompliancePostureData {
  compliant: number;
  nonCompliant: number;
  total: number;
  byStatus: Array<{ status: string; count: number; color: string }>;
}

interface AlertActivityData {
  rules: Array<{
    name: string;
    triggerType: string;
    isActive: boolean;
    fireCount: number;
  }>;
  recentAlerts: Array<{
    ruleName: string;
    firedAt: string;
    details: string;
  }>;
}

// ─── Risk level helpers ──────────────────────────────────────────────────

const RISK_COLORS: Record<string, string> = {
  critical: "#B42318",
  high: "#C4320A",
  medium: "#B54708",
  low: "#027A48",
  none: "#667085",
};

const STATUS_COLORS: Record<string, string> = {
  detected: "#B54708",
  under_review: "#026AA2",
  approved: "#027A48",
  restricted: "#C4320A",
  blocked: "#B42318",
  dismissed: "#667085",
};

function getRiskLevel(score: number): string {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  if (score >= 1) return "low";
  return "none";
}

function parsePeriodToDays(period: string): number {
  const map: Record<string, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "365d": 365,
    all: 3650,
  };
  return map[period] || 30;
}

// ─── Data Collector ──────────────────────────────────────────────────────

export class ShadowAIReportDataCollector {
  private tenantId: string;
  private periodDays: number;

  constructor(tenantId: string, _userId: number, period: string = "30d") {
    this.tenantId = tenantId;
    this.periodDays = parsePeriodToDays(period);
  }

  async collectAllData(sections: string[]): Promise<Record<string, any>> {
    const sectionData: Record<string, any> = {};

    const collectors: Array<[string, () => Promise<any>]> = [
      ["executiveSummary", () => this.collectExecutiveSummary()],
      ["toolInventory", () => this.collectToolInventory()],
      ["riskAnalysis", () => this.collectRiskAnalysis()],
      ["usageTrends", () => this.collectUsageTrends()],
      ["departmentBreakdown", () => this.collectDepartmentBreakdown()],
      ["topUsers", () => this.collectTopUsers()],
      ["compliancePosture", () => this.collectCompliancePosture()],
      ["alertActivity", () => this.collectAlertActivity()],
    ];

    // Run only requested sections in parallel
    const promises = collectors
      .filter(([key]) => sections.includes(key))
      .map(async ([key, fn]) => {
        try {
          sectionData[key] = await fn();
        } catch (error) {
          console.error(
            `[ShadowAIReportDataCollector] Error collecting ${key}:`,
            error
          );
          sectionData[key] = null;
        }
      });

    await Promise.all(promises);
    return sectionData;
  }

  async collectExecutiveSummary(): Promise<ExecutiveSummaryData> {
    const summary = await getInsightsSummaryQuery(
      this.tenantId,
      this.periodDays
    );

    return {
      uniqueApps: summary.unique_apps,
      totalUsers: summary.total_ai_users,
      departments: summary.departments_using_ai,
      highestRiskTool: summary.highest_risk_tool,
      mostActiveDepartment: summary.most_active_department,
    };
  }

  async collectToolInventory(): Promise<ToolInventoryData> {
    const { tools } = await getAllToolsQuery(this.tenantId, {
      page: 1,
      limit: 500,
    });

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    const riskCounts: Record<string, number> = {};

    const mappedTools = tools.map((t: any) => {
      const status = t.status || "detected";
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      const riskLevel = getRiskLevel(t.risk_score || 0);
      riskCounts[riskLevel] = (riskCounts[riskLevel] || 0) + 1;

      return {
        name: t.name || "Unknown",
        vendor: t.vendor || "Unknown",
        status,
        riskScore: t.risk_score || 0,
        totalUsers: t.total_users || 0,
        totalEvents: t.total_events || 0,
        complianceFlags: t.compliance_flags || [],
      };
    });

    return {
      tools: mappedTools,
      statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        color: STATUS_COLORS[status] || "#667085",
      })),
      riskBreakdown: Object.entries(riskCounts).map(([level, count]) => ({
        level,
        count,
        color: RISK_COLORS[level] || "#667085",
      })),
    };
  }

  async collectRiskAnalysis(): Promise<RiskAnalysisData> {
    const { tools } = await getAllToolsQuery(this.tenantId, {
      sort: "risk",
      page: 1,
      limit: 500,
    });

    const riskCounts: Record<string, number> = {};

    const toolsByRisk = tools
      .filter((t: any) => (t.risk_score || 0) > 0)
      .map((t: any) => {
        const level = getRiskLevel(t.risk_score || 0);
        riskCounts[level] = (riskCounts[level] || 0) + 1;
        return {
          name: t.name || "Unknown",
          riskScore: t.risk_score || 0,
          status: t.status || "detected",
        };
      });

    return {
      toolsByRisk,
      riskDistribution: Object.entries(riskCounts).map(([level, count]) => ({
        level,
        count,
        color: RISK_COLORS[level] || "#667085",
      })),
    };
  }

  async collectUsageTrends(): Promise<UsageTrendData> {
    const granularity =
      this.periodDays <= 30
        ? "daily"
        : this.periodDays <= 90
          ? "weekly"
          : "monthly";

    const trendData = await getTrendQuery(
      this.tenantId,
      this.periodDays,
      granularity
    );

    const dataPoints = trendData.map((point) => ({
      date: point.date,
      totalEvents: point.total_events,
      uniqueUsers: point.unique_users,
      newTools: point.new_tools,
    }));

    const totalEvents = dataPoints.reduce((sum, p) => sum + p.totalEvents, 0);
    const peakPoint = dataPoints.reduce(
      (max, p) => (p.totalEvents > max.totalEvents ? p : max),
      { date: "N/A", totalEvents: 0, uniqueUsers: 0, newTools: 0 }
    );

    return {
      dataPoints,
      periodSummary: {
        totalEvents,
        avgDailyEvents:
          dataPoints.length > 0
            ? Math.round(totalEvents / dataPoints.length)
            : 0,
        peakDay: peakPoint.date,
        peakEvents: peakPoint.totalEvents,
      },
    };
  }

  async collectDepartmentBreakdown(): Promise<DepartmentBreakdownData> {
    const departments = await getDepartmentActivityQuery(this.tenantId);

    return {
      departments: departments.map((d) => ({
        name: d.department,
        users: d.users,
        prompts: d.total_prompts,
        topTool: d.top_tool,
        maxRisk: d.risk_score,
      })),
    };
  }

  async collectTopUsers(): Promise<TopUsersData> {
    const { users } = await getUserActivityQuery(this.tenantId, {
      page: 1,
      limit: 25,
      sort: "risk",
    });

    return {
      users: users.map((u) => ({
        email: u.user_email,
        prompts: u.total_prompts,
        department: u.department,
        riskScore: u.risk_score,
      })),
    };
  }

  async collectCompliancePosture(): Promise<CompliancePostureData> {
    const { tools } = await getAllToolsQuery(this.tenantId, {
      page: 1,
      limit: 500,
    });

    let compliant = 0;
    let nonCompliant = 0;

    const statusCounts: Record<string, number> = {};

    tools.forEach((t: any) => {
      const status = t.status || "detected";
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (status === "approved") {
        compliant++;
      } else if (
        status === "blocked" ||
        status === "restricted"
      ) {
        nonCompliant++;
      }
    });

    return {
      compliant,
      nonCompliant,
      total: tools.length,
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        color: STATUS_COLORS[status] || "#667085",
      })),
    };
  }

  async collectAlertActivity(): Promise<AlertActivityData> {
    // Query rules
    const [rulesRows] = await sequelize.query(
      `SELECT r.id, r.name, r.trigger_type, r.is_active,
              COALESCE(ah.fire_count, 0) as fire_count
       FROM "${this.tenantId}".shadow_ai_rules r
       LEFT JOIN (
         SELECT rule_id, COUNT(*) as fire_count
         FROM "${this.tenantId}".shadow_ai_alert_history
         GROUP BY rule_id
       ) ah ON r.id = ah.rule_id
       ORDER BY fire_count DESC`
    );

    // Recent alerts
    const [alertRows] = await sequelize.query(
      `SELECT ah.fired_at, ah.details,
              r.name as rule_name
       FROM "${this.tenantId}".shadow_ai_alert_history ah
       JOIN "${this.tenantId}".shadow_ai_rules r ON ah.rule_id = r.id
       ORDER BY ah.fired_at DESC
       LIMIT 20`
    );

    return {
      rules: (rulesRows as any[]).map((r) => ({
        name: r.name,
        triggerType: r.trigger_type,
        isActive: r.is_active,
        fireCount: parseInt(r.fire_count, 10),
      })),
      recentAlerts: (alertRows as any[]).map((a) => ({
        ruleName: a.rule_name,
        firedAt: a.fired_at
          ? new Date(a.fired_at).toLocaleString()
          : "Unknown",
        details:
          typeof a.details === "object"
            ? JSON.stringify(a.details)
            : a.details || "",
      })),
    };
  }
}
