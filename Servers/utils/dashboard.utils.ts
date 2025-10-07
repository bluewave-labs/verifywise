import { sequelize } from "../database/db";
import { IDashboard } from "../domain.layer/interfaces/i.Dashboard";
import { getAllProjectsQuery } from "./project.utils";
import { calculateComplianceScore } from "./compliance.utils";
import { IComplianceDashboardWidget } from "../domain.layer/interfaces/compliance/compliance.interface";

export const getDashboardDataQuery = async (
  tenant: string,
  userId: number,
  role: string,
  organizationId?: number
): Promise<IDashboard | null> => {
  const dashboard = {
    projects: 0,
    trainings: 0,
    models: 0,
    reports: 0,
    task_radar: {
      overdue: 0,
      due: 0,
      upcoming: 0,
    },
    projects_list: [],
  } as IDashboard;
  const projects = await getAllProjectsQuery({ userId, role }, tenant);
  dashboard.projects_list = projects;
  dashboard.projects = projects.length;

  const trainings = await sequelize.query(
    `SELECT COUNT(*) FROM "${tenant}".trainingregistar`
  ) as [{ count: string }[], number];
  dashboard.trainings = parseInt(trainings[0][0].count);

 //Models data fetching from model_inventories table

  const models = await sequelize.query(
    `SELECT COUNT(*) FROM "${tenant}".model_inventories`
  ) as [{ count: string }[], number];
  dashboard.models = parseInt(models[0][0].count);

  const reports = await sequelize.query(
    `SELECT COUNT(*) FROM "${tenant}".files AS f WHERE f.source::TEXT ILIKE '%report%'`
  ) as [{ count: string }[], number];
  dashboard.reports = parseInt(reports[0][0].count);

  // Calculate compliance score if organizationId is provided
  if (organizationId) {
    try {
      const complianceScore = await calculateComplianceScore(organizationId, tenant);

      const complianceWidget: IComplianceDashboardWidget = {
        score: complianceScore.overallScore,
        trend: 'stable', // TODO: Implement trend calculation based on historical data
        trendValue: 0,
        lastCalculated: complianceScore.calculatedAt,
        moduleBreakdown: [
          {
            name: 'Risk management',
            score: complianceScore.modules.riskManagement.score,
            weight: complianceScore.modules.riskManagement.weight
          },
          {
            name: 'Vendor management',
            score: complianceScore.modules.vendorManagement.score,
            weight: complianceScore.modules.vendorManagement.weight
          },
          {
            name: 'Project governance',
            score: complianceScore.modules.projectGovernance.score,
            weight: complianceScore.modules.projectGovernance.weight
          },
          {
            name: 'Model lifecycle',
            score: complianceScore.modules.modelLifecycle.score,
            weight: complianceScore.modules.modelLifecycle.weight
          },
          {
            name: 'Policy & documentation',
            score: complianceScore.modules.policyDocumentation.score,
            weight: complianceScore.modules.policyDocumentation.weight
          }
        ],
        drillDownUrl: `/compliance/details/${organizationId}`
      };

      dashboard.compliance_score = complianceWidget;
    } catch (error) {
      console.error('Error calculating compliance score for dashboard:', error);
      // Don't fail the entire dashboard if compliance calculation fails
    }
  }

  return dashboard;
}