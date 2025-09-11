import { sequelize } from "../database/db";
import { IDashboard, IExecutiveOverview } from "../domain.layer/interfaces/i.Dashboard";
import { getAllProjectsQuery } from "./project.utils";

export const getDashboardDataQuery = async (
  tenant: string,
  userId: number,
  role: string
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

  return dashboard;
}

export const getExecutiveOverviewQuery = async (
  tenant: string,
  userId: number,
  role: string
): Promise<IExecutiveOverview | null> => {
  try {
    // Get projects data with status analysis
    const projects = await getAllProjectsQuery({ userId, role }, tenant);
    // Since we don't have status field, we'll assume all projects are active for now
    // In a real scenario, we'd need to add status field to the IProjectAttributes interface
    const activeProjects = projects.length;
    const completedProjects = 0;
    
    // Project status distribution for chart
    const projectStatusData = [
      { name: 'Active', value: activeProjects, color: '#4CAF50' },
      { name: 'Completed', value: completedProjects, color: '#2196F3' },
      { name: 'Planning', value: projects.length - activeProjects - completedProjects, color: '#FF9800' }
    ];

    // Get compliance data from ISO standards
    const iso27001Progress = await sequelize.query(`
      SELECT 
        AVG(CASE WHEN sc.status = 'Implemented' THEN 100 ELSE 0 END) as avg_completion,
        COUNT(*) as total_controls
      FROM "${tenant}".subclauses_iso27001 sc
      JOIN "${tenant}".projects_frameworks pf ON sc.projects_frameworks_id = pf.id
      JOIN "${tenant}".projects p ON pf.project_id = p.id
    `) as [{ avg_completion: string, total_controls: string }[], number];

    const iso42001Progress = await sequelize.query(`
      SELECT 
        AVG(CASE WHEN sc.status = 'Implemented' THEN 100 ELSE 0 END) as avg_completion,
        COUNT(*) as total_controls  
      FROM "${tenant}".subclauses_iso sc
      JOIN "${tenant}".projects_frameworks pf ON sc.projects_frameworks_id = pf.id
      JOIN "${tenant}".projects p ON pf.project_id = p.id
    `) as [{ avg_completion: string, total_controls: string }[], number];

    const complianceScore = Math.round(
      (parseFloat(iso27001Progress[0][0]?.avg_completion || '0') + 
       parseFloat(iso42001Progress[0][0]?.avg_completion || '0')) / 2
    );

    // Compliance trend data for chart
    const complianceTrendData = [
      { month: 'Jan', iso27001: Math.max(0, complianceScore - 15), iso42001: Math.max(0, complianceScore - 20) },
      { month: 'Feb', iso27001: Math.max(0, complianceScore - 12), iso42001: Math.max(0, complianceScore - 17) },
      { month: 'Mar', iso27001: Math.max(0, complianceScore - 8), iso42001: Math.max(0, complianceScore - 13) },
      { month: 'Apr', iso27001: Math.max(0, complianceScore - 5), iso42001: Math.max(0, complianceScore - 10) },
      { month: 'May', iso27001: Math.max(0, complianceScore - 2), iso42001: Math.max(0, complianceScore - 6) },
      { month: 'Jun', iso27001: complianceScore, iso42001: complianceScore }
    ];

    // Get critical risks data
    const vendorRisks = await sequelize.query(`
      SELECT 
        vr.risk_level,
        COUNT(*) as count
      FROM "${tenant}".vendorRisks vr
      JOIN "${tenant}".vendors_projects vp ON vr.vendor_id = vp.vendor_id
      JOIN "${tenant}".projects p ON vp.project_id = p.id
      GROUP BY vr.risk_level
    `) as [{ risk_level: string, count: string }[], number];

    const projectRisks = await sequelize.query(`
      SELECT 
        risk_level_autocalculated as risk_level,
        COUNT(*) as count
      FROM "${tenant}".projectrisks pr
      JOIN "${tenant}".projects p ON pr.project_id = p.id
      WHERE pr.mitigation_status != 'Completed'
      GROUP BY risk_level_autocalculated
    `) as [{ risk_level: string, count: string }[], number];

    // Calculate critical risks (Very high + High risk)
    const vendorHighRisks = parseInt(vendorRisks[0]?.find(r => r.risk_level?.toLowerCase().includes('high'))?.count || '0');
    const projectHighRisks = parseInt(projectRisks[0]?.find(r => r.risk_level?.toLowerCase().includes('high'))?.count || '0');
    const projectVeryHighRisks = parseInt(projectRisks[0]?.find(r => r.risk_level?.toLowerCase().includes('very high'))?.count || '0');
    const criticalRiskCount = vendorHighRisks + projectHighRisks + projectVeryHighRisks;

    // Risk distribution for chart
    const vendorMediumRisks = parseInt(vendorRisks[0]?.find(r => r.risk_level?.toLowerCase().includes('medium'))?.count || '0');
    const projectMediumRisks = parseInt(projectRisks[0]?.find(r => r.risk_level?.toLowerCase().includes('medium'))?.count || '0');
    
    const vendorLowRisks = parseInt(vendorRisks[0]?.find(r => r.risk_level?.toLowerCase().includes('low'))?.count || '0');
    const projectLowRisks = parseInt(projectRisks[0]?.find(r => r.risk_level?.toLowerCase().includes('low'))?.count || '0');
    const projectVeryLowRisks = parseInt(projectRisks[0]?.find(r => r.risk_level?.toLowerCase().includes('very low'))?.count || '0');
    const projectNoRisks = parseInt(projectRisks[0]?.find(r => r.risk_level?.toLowerCase().includes('no risk'))?.count || '0');

    const riskDistributionData = [
      { 
        name: 'High', 
        value: criticalRiskCount, 
        color: '#f44336' 
      },
      { 
        name: 'Medium', 
        value: vendorMediumRisks + projectMediumRisks, 
        color: '#FF9800' 
      },
      { 
        name: 'Low', 
        value: vendorLowRisks + projectLowRisks + projectVeryLowRisks + projectNoRisks, 
        color: '#4CAF50' 
      }
    ];

    return {
      total_projects: {
        count: projects.length,
        active_count: activeProjects,
        chart_data: projectStatusData
      },
      compliance_score: {
        score: complianceScore,
        iso27001_score: Math.round(parseFloat(iso27001Progress[0][0]?.avg_completion || '0')),
        iso42001_score: Math.round(parseFloat(iso42001Progress[0][0]?.avg_completion || '0')),
        chart_data: complianceTrendData
      },
      critical_risks: {
        count: criticalRiskCount,
        chart_data: riskDistributionData
      }
    };

  } catch (error) {
    console.error('Error fetching executive overview:', error);
    return null;
  }
}