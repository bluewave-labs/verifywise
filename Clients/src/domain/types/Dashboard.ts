import { Project } from "./Project";

export type Dashboard = {
  projects: number;
  trainings: number;
  models: number;
  reports: number;
  task_radar: {
    overdue: number;
    due: number;
    upcoming: number;
  };
  projects_list: Project[];
  compliance_score?: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    trendValue: number;
    lastCalculated: Date;
    moduleBreakdown: Array<{
      name: string;
      score: number;
      weight: number;
    }>;
    drillDownUrl: string;
  };
}