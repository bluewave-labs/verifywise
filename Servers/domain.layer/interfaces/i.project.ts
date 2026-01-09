import { AiRiskClassification } from "../enums/ai-risk-classification.enum";
import { HighRiskRole } from "../enums/high-risk-role.enum";
import { ProjectStatus } from "../enums/project-status.enum";
import { IProjectFramework } from "./i.projectFramework";

export interface IProjectAttributes {
  id?: number;
  uc_id?: string;
  project_title: string;
  owner: number;
  start_date: Date;
  geography: number;
  ai_risk_classification: AiRiskClassification;
  type_of_high_risk_role: HighRiskRole;
  goal: string;
  target_industry: string;
  description: string;
  last_updated: Date;
  last_updated_by: number;
  created_at?: Date;
  framework?: IProjectFramework[];
  is_organizational?: boolean;
  status?: ProjectStatus;

  // Statistical fields
  doneSubcontrols?: number;
  totalSubcontrols?: number;
  answeredAssessments?: number;
  totalAssessments?: number;
}
