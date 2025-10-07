import { IProjectAttributes } from "./i.project";
import { IComplianceDashboardWidget } from "./compliance/compliance.interface";

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
  compliance_score?: IComplianceDashboardWidget;
}