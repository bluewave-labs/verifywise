/**
 * Shadow AI Reporting Service
 *
 * Orchestrates data collection → chart generation → PDF/DOCX output.
 */

import { ShadowAIReportDataCollector, ShadowAIReportData } from "./dataCollector";
import {
  generateToolRiskChart,
  generateTrendLineChart,
  generateDepartmentBarChart,
  generateComplianceDonutChart,
  generateStatusDonutChart,
  generateLegend,
} from "./chartUtils";
import { generateShadowAIPDF, ReportGenerationResult } from "./pdfGenerator";
import { generateShadowAIDOCX } from "./docxGenerator";
import { getUserByIdQuery } from "../../utils/user.utils";
import { getOrganizationByIdQuery } from "../../utils/organization.utils";

const VALID_SECTIONS = new Set([
  "executiveSummary",
  "toolInventory",
  "riskAnalysis",
  "usageTrends",
  "departmentBreakdown",
  "topUsers",
  "compliancePosture",
  "alertActivity",
]);

const PERIOD_LABELS: Record<string, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "365d": "Last 365 days",
  all: "All time",
};

export interface ShadowAIReportRequest {
  sections: string[];
  format: "pdf" | "docx";
  reportName?: string;
  period?: string;
}

export async function generateShadowAIReport(
  request: ShadowAIReportRequest,
  userId: number,
  tenantId: string
): Promise<ReportGenerationResult> {
  try {
    const period = request.period || "30d";

    // Validate sections
    const sections = request.sections.filter((s) => VALID_SECTIONS.has(s));
    if (sections.length === 0) {
      return {
        success: false,
        filename: "",
        content: Buffer.alloc(0),
        mimeType: "",
        error: "No valid sections selected",
      };
    }

    // Collect data
    const collector = new ShadowAIReportDataCollector(tenantId, userId, period);
    const sectionData = await collector.collectAllData(sections);

    // Get branding
    const user = await getUserByIdQuery(userId);
    let organizationName = "VerifyWise";
    if (user?.organization_id) {
      const org = await getOrganizationByIdQuery(user.organization_id);
      if (org?.name) organizationName = org.name;
    }

    const reportData: ShadowAIReportData = {
      metadata: {
        generatedAt: new Date(),
        generatedBy: user
          ? `${user.name || ""} ${user.surname || ""}`.trim()
          : "System",
        period: PERIOD_LABELS[period] || period,
        periodDays:
          period === "all"
            ? 3650
            : parseInt(period.replace("d", ""), 10) || 30,
        tenantId,
      },
      branding: {
        organizationName,
        primaryColor: "#13715B",
      },
      sections: sectionData,
    };

    // Generate charts for PDF
    const charts: Record<string, string> = {};

    if (sectionData.riskAnalysis) {
      charts.riskBarChart = generateToolRiskChart(
        sectionData.riskAnalysis.toolsByRisk,
        { title: "Tools by risk score" }
      );
    }

    if (sectionData.toolInventory) {
      charts.statusDonut = generateStatusDonutChart(
        sectionData.toolInventory.statusBreakdown,
        { title: "Tool status" }
      );
      charts.statusLegend = generateLegend(
        sectionData.toolInventory.statusBreakdown.map((s: any) => ({
          label: s.status,
          count: s.count,
          color: s.color,
        }))
      );
    }

    if (sectionData.usageTrends) {
      charts.trendLine = generateTrendLineChart(
        sectionData.usageTrends.dataPoints,
        { title: "Usage trend" }
      );
    }

    if (sectionData.departmentBreakdown) {
      charts.departmentBar = generateDepartmentBarChart(
        sectionData.departmentBreakdown.departments,
        { title: "Departments by activity" }
      );
    }

    if (sectionData.compliancePosture) {
      charts.complianceDonut = generateComplianceDonutChart(
        sectionData.compliancePosture.byStatus,
        { title: "Compliance posture" }
      );
      charts.complianceLegend = generateLegend(
        sectionData.compliancePosture.byStatus.map((s: any) => ({
          label: s.status,
          count: s.count,
          color: s.color,
        }))
      );
    }

    // Generate report
    let result: ReportGenerationResult;
    if (request.format === "pdf") {
      result = await generateShadowAIPDF(reportData, charts);
    } else {
      result = await generateShadowAIDOCX(reportData);
    }

    // Override filename if custom name provided
    if (request.reportName && result.success) {
      const ext = request.format === "pdf" ? ".pdf" : ".docx";
      result.filename = request.reportName.endsWith(ext)
        ? request.reportName
        : `${request.reportName}${ext}`;
    }

    return result;
  } catch (error) {
    console.error("[ShadowAI Reporting] Error generating report:", error);
    return {
      success: false,
      filename: "",
      content: Buffer.alloc(0),
      mimeType: "",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error generating report",
    };
  }
}
