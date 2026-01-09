import { AiRiskClassification } from "../../../enums/aiRiskClassification.enum";
import { HighRiskRole } from "../../../enums/highRiskRole.enum";

export class ProjectModel {
  id?: number;
  uc_id?: string;
  project_title!: string;
  owner!: number;
  start_date!: Date;
  ai_risk_classification!: AiRiskClassification;
  type_of_high_risk_role!: HighRiskRole;
  goal!: string;
  last_updated!: Date;
  last_updated_by!: number;
  is_demo?: boolean;
  created_at?: Date;
  is_organizational!: boolean;

  constructor(data: ProjectModel) {
    this.id = data.id;
    this.uc_id = data.uc_id;
    this.project_title = data.project_title;
    this.owner = data.owner;
    this.start_date = data.start_date;
    this.ai_risk_classification = data.ai_risk_classification;
    this.type_of_high_risk_role = data.type_of_high_risk_role;
    this.goal = data.goal;
    this.last_updated = data.last_updated;
    this.last_updated_by = data.last_updated_by;
    this.is_demo = data.is_demo;
    this.created_at = data.created_at;
    this.is_organizational = data.is_organizational;
  }

  static createNewProject(data: ProjectModel): ProjectModel {
    return new ProjectModel(data);
  }
}
