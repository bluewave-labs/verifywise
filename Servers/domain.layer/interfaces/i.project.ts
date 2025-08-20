import { AiRiskClassification } from "../enums/ai-risk-classification.enum";
import { HighRiskRole } from "../enums/high-risk-role.enum";
import { IProjectFramework } from "./i.projectFramework";

export interface IProjectAttributes {
  id?: number;
  project_title: string;
  owner: number;
  start_date: Date;
  ai_risk_classification: AiRiskClassification;
  type_of_high_risk_role: HighRiskRole;
  goal: string;
  last_updated: Date;
  last_updated_by: number;
  created_at?: Date;
  framework?: IProjectFramework[];

  // Statistical fields
  doneSubcontrols?: number;
  totalSubcontrols?: number;
  answeredAssessments?: number;
  totalAssessments?: number;
}
