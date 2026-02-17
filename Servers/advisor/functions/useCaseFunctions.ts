import { getUserProjects } from "../../utils/project.utils";
import { calculateProjectRisks } from "../../utils/project.utils";
import logger from "../../utils/logger/fileLogger";

export interface FetchUseCasesParams {
  status?: string;
  ai_risk_classification?: string;
  limit?: number;
}

/**
 * Fetch all projects as use cases. Uses Admin role to get all projects
 * since the advisor operates at the tenant level.
 */
const getAllProjects = async (tenant: string) => {
  // Use a high-privilege view (Admin role, userId=0) so the advisor can see all projects
  const projects = await getUserProjects({ userId: 0, role: "Admin" }, tenant);
  return projects || [];
};

const fetchUseCases = async (
  params: FetchUseCasesParams,
  tenant: string
): Promise<any[]> => {
  try {
    let projects = await getAllProjects(tenant);

    // Apply filters
    if (params.status) {
      projects = projects.filter((p: any) => p.status === params.status);
    }
    if (params.ai_risk_classification) {
      projects = projects.filter(
        (p: any) => p.ai_risk_classification === params.ai_risk_classification
      );
    }

    // Limit results
    if (params.limit && params.limit > 0) {
      projects = projects.slice(0, params.limit);
    }

    // Return lightweight projections
    return projects.map((p: any) => ({
      id: p.id,
      uc_id: p.uc_id,
      project_title: p.project_title,
      status: p.status,
      ai_risk_classification: p.ai_risk_classification,
      owner: p.owner,
      start_date: p.start_date,
      goal: p.goal,
      target_industry: p.target_industry,
      last_updated: p.last_updated,
    }));
  } catch (error) {
    logger.error("Error fetching use cases:", error);
    throw new Error(
      `Failed to fetch use cases: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

const getUseCaseAnalytics = async (
  _params: Record<string, unknown>,
  tenant: string
): Promise<any> => {
  try {
    const projects = await getAllProjects(tenant);
    const total = projects.length;

    // Status distribution
    const statusDistribution: Record<string, number> = {};
    projects.forEach((p: any) => {
      const status = p.status || "Draft";
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });

    // Risk classification distribution
    const riskClassificationDistribution: Record<string, number> = {};
    projects.forEach((p: any) => {
      const classification = p.ai_risk_classification || "Unclassified";
      riskClassificationDistribution[classification] =
        (riskClassificationDistribution[classification] || 0) + 1;
    });

    // Industry distribution
    const industryDistribution: Record<string, number> = {};
    projects.forEach((p: any) => {
      if (p.target_industry) {
        industryDistribution[p.target_industry] =
          (industryDistribution[p.target_industry] || 0) + 1;
      }
    });

    return {
      totalUseCases: total,
      statusDistribution,
      riskClassificationDistribution,
      industryDistribution,
    };
  } catch (error) {
    logger.error("Error getting use case analytics:", error);
    throw new Error(
      `Failed to get use case analytics: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

const getUseCaseExecutiveSummary = async (
  _params: Record<string, unknown>,
  tenant: string
): Promise<any> => {
  try {
    const projects = await getAllProjects(tenant);
    const total = projects.length;

    const activeCount = projects.filter(
      (p: any) => p.status === "Active" || p.status === "In Progress"
    ).length;
    const draftCount = projects.filter(
      (p: any) => p.status === "Draft"
    ).length;
    const completedCount = projects.filter(
      (p: any) => p.status === "Completed"
    ).length;

    const highRiskCount = projects.filter(
      (p: any) =>
        p.ai_risk_classification === "High risk" ||
        p.ai_risk_classification === "Unacceptable risk"
    ).length;

    // Get risk counts for each project
    const projectRiskSummaries = [];
    for (const project of projects.slice(0, 10)) {
      if (!project.id) continue;
      try {
        const risks = await calculateProjectRisks(project.id, tenant);
        if (risks && (risks as any).totalRisks > 0) {
          projectRiskSummaries.push({
            id: project.id,
            title: project.project_title,
            riskClassification: project.ai_risk_classification,
            totalRisks: (risks as any).totalRisks || 0,
          });
        }
      } catch {
        // Skip projects with no risk data
      }
    }

    return {
      totalUseCases: total,
      activeUseCases: activeCount,
      draftUseCases: draftCount,
      completedUseCases: completedCount,
      highRiskUseCases: highRiskCount,
      topProjectsByRisk: projectRiskSummaries
        .sort((a, b) => b.totalRisks - a.totalRisks)
        .slice(0, 5),
    };
  } catch (error) {
    logger.error("Error getting use case executive summary:", error);
    throw new Error(
      `Failed to get use case executive summary: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

const availableUseCaseTools: Record<string, Function> = {
  fetch_use_cases: fetchUseCases,
  get_use_case_analytics: getUseCaseAnalytics,
  get_use_case_executive_summary: getUseCaseExecutiveSummary,
};

export { availableUseCaseTools };
