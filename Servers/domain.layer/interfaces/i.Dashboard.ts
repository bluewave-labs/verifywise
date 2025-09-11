import { IProjectAttributes } from "./i.project";

export interface IDashboard {
  projects: number;
  trainings: number;
  models: number;
  reports: number;
  task_radar: {
    overdue: number;
    due: number;
    upcoming: number;
  };
  projects_list: IProjectAttributes[];
}

export interface IChartData {
  name: string;
  value: number;
  color: string;
}

export interface IComplianceTrendData {
  month: string;
  iso27001: number;
  iso42001: number;
}

export interface IExecutiveOverview {
  total_projects: {
    count: number;
    active_count: number;
    chart_data: IChartData[];
  };
  compliance_score: {
    score: number;
    iso27001_score: number;
    iso42001_score: number;
    chart_data: IComplianceTrendData[];
  };
  critical_risks: {
    count: number;
    chart_data: IChartData[];
  };
}

export interface IComplianceProjectDetail {
  project_id: number;
  project_name: string;
  completion_rate: number;
  total_controls: number;
  completed_controls: number;
  trend: number;
}

export interface IComplianceFrameworkDetail {
  framework: string;
  framework_id: number;
  average_completion: number;
  total_projects: number;
  projects: IComplianceProjectDetail[];
  completion_distribution: IChartData[];
}

export interface IComplianceAnalytics {
  iso27001: IComplianceFrameworkDetail;
  iso42001: IComplianceFrameworkDetail;
  overall_compliance: {
    score: number;
    total_projects: number;
    chart_data: IChartData[];
  };
  project_tracker: {
    projects: IComplianceProjectDetail[];
    completion_trends: Array<{
      date: string;
      iso27001: number;
      iso42001: number;
      overall: number;
    }>;
  };
}