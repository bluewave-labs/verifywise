import { ProjectRisk } from "../types/ProjectRisk";

export interface ICategoryGroup {
  name: string;
  risks: ProjectRisk[];
  count: number;
  riskLevels: {
    veryHigh: number;
    high: number;
    medium: number;
    low: number;
    veryLow: number;
  };
}
