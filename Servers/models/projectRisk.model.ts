// projectRisk.model.ts

import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { ProjectModel } from "./project.model";
import { UserModel } from "./user.model";

export type ProjectRisk = {
  id?: number;
  project_id: number; // Foreign key to refer to the project
  risk_name: string;
  risk_owner: number;
  ai_lifecycle_phase:
  | "Problem definition & planning"
  | "Data collection & processing"
  | "Model development & training"
  | "Model validation & testing"
  | "Deployment & integration"
  | "Monitoring & maintenance"
  | "Decommissioning & retirement";
  risk_description: string;
  risk_category:
  | "Strategic risk"
  | "Operational risk"
  | "Compliance risk"
  | "Financial risk"
  | "Cybersecurity risk"
  | "Reputational risk"
  | "Legal risk"
  | "Technological risk"
  | "Third-party/vendor risk"
  | "Environmental risk"
  | "Human resources risk"
  | "Geopolitical risk"
  | "Fraud risk"
  | "Data privacy risk"
  | "Health and safety risk";
  impact: string;
  assessment_mapping: string;
  controls_mapping: string;
  likelihood: "Rare" | "Unlikely" | "Possible" | "Likely" | "Almost Certain";
  severity: "Negligible" | "Minor" | "Moderate" | "Major" | "Catastrophic";
  risk_level_autocalculated:
  | "No risk"
  | "Low risk"
  | "Medium risk"
  | "High risk"
  | "Very high risk";
  review_notes: string;
  mitigation_status:
  | "Not Started"
  | "In Progress"
  | "Completed"
  | "On Hold"
  | "Deferred"
  | "Canceled"
  | "Requires review";
  current_risk_level:
  | "Very Low risk"
  | "Low risk"
  | "Medium risk"
  | "High risk"
  | "Very high risk";
  deadline: Date;
  mitigation_plan: string;
  implementation_strategy: string;
  mitigation_evidence_document: string;
  likelihood_mitigation:
  | "Rare"
  | "Unlikely"
  | "Possible"
  | "Likely"
  | "Almost Certain";
  risk_severity: "Negligible" | "Minor" | "Moderate" | "Major" | "Critical";
  final_risk_level: string;
  risk_approval: number;
  approval_status: string;
  date_of_assessment: Date;
  created_at?: Date;
  recommendations?: string;
};

@Table({
  tableName: "project_risks"
})
export class ProjectRiskModel extends Model<ProjectRisk> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @ForeignKey(() => ProjectModel)
  @Column({
    type: DataType.INTEGER
  })
  project_id!: number;

  @Column({
    type: DataType.STRING
  })
  risk_name!: string;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER
  })
  risk_owner!: number;

  @Column({
    type: DataType.ENUM("Problem definition & planning", "Data collection & processing", "Model development & training", "Model validation & testing", "Deployment & integration", "Monitoring & maintenance", "Decommissioning & retirement")
  })
  ai_lifecycle_phase!: | "Problem definition & planning"
    | "Data collection & processing"
    | "Model development & training"
    | "Model validation & testing"
    | "Deployment & integration"
    | "Monitoring & maintenance"
    | "Decommissioning & retirement";

  @Column({
    type: DataType.STRING
  })
  risk_description!: string;

  @Column({
    type: DataType.ENUM("Strategic risk", "Operational risk", "Compliance risk", "Financial risk", "Cybersecurity risk", "Reputational risk", "Legal risk", "Technological risk", "Third-party/vendor risk", "Environmental risk", "Human resources risk", "Geopolitical risk", "Fraud risk", "Data privacy risk", "Health and safety risk")
  })
  risk_category!: | "Strategic risk"
    | "Operational risk"
    | "Compliance risk"
    | "Financial risk"
    | "Cybersecurity risk"
    | "Reputational risk"
    | "Legal risk"
    | "Technological risk"
    | "Third-party/vendor risk"
    | "Environmental risk"
    | "Human resources risk"
    | "Geopolitical risk"
    | "Fraud risk"
    | "Data privacy risk"
    | "Health and safety risk";

  @Column({
    type: DataType.STRING
  })
  impact!: string;

  @Column({
    type: DataType.STRING
  })
  assessment_mapping!: string;

  @Column({
    type: DataType.STRING
  })
  controls_mapping!: string;

  @Column({
    type: DataType.ENUM("Rare", "Unlikely", "Possible", "Likely", "Almost Certain")
  })
  likelihood!: "Rare" | "Unlikely" | "Possible" | "Likely" | "Almost Certain";

  @Column({
    type: DataType.ENUM("Negligible", "Minor", "Moderate", "Major", "Catastrophic")
  })
  severity!: "Negligible" | "Minor" | "Moderate" | "Major" | "Catastrophic";

  @Column({
    type: DataType.ENUM("No risk", "Low risk", "Medium risk", "High risk", "Very high risk")
  })
  risk_level_autocalculated!: | "No risk"
    | "Low risk"
    | "Medium risk"
    | "High risk"
    | "Very high risk";

  @Column({
    type: DataType.STRING
  })
  review_notes!: string;

  @Column({
    type: DataType.ENUM("Not Started", "In Progress", "Completed", "On Hold", "Deferred", "Canceled", "Requires review")
  })
  mitigation_status!: | "Not Started"
    | "In Progress"
    | "Completed"
    | "On Hold"
    | "Deferred"
    | "Canceled"
    | "Requires review";

  @Column({
    type: DataType.ENUM("Very Low risk", "Low risk", "Medium risk", "High risk", "Very high risk")
  })
  current_risk_level!: | "Very Low risk"
    | "Low risk"
    | "Medium risk"
    | "High risk"
    | "Very high risk";

  @Column({
    type: DataType.DATE
  })
  deadline!: Date;

  @Column({
    type: DataType.STRING
  })
  mitigation_plan!: string;

  @Column({
    type: DataType.STRING
  })
  implementation_strategy!: string;

  @Column({
    type: DataType.STRING
  })
  mitigation_evidence_document!: string;

  @Column({
    type: DataType.ENUM("Rare", "Unlikely", "Possible", "Likely", "Almost Certain")
  })
  likelihood_mitigation!: | "Rare"
    | "Unlikely"
    | "Possible"
    | "Likely"
    | "Almost Certain";

  @Column({
    type: DataType.ENUM("Negligible", "Minor", "Moderate", "Major", "Critical")
  })
  risk_severity!: "Negligible" | "Minor" | "Moderate" | "Major" | "Critical";

  @Column({
    type: DataType.STRING
  })
  final_risk_level!: string;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER
  })
  risk_approval!: number;

  @Column({
    type: DataType.STRING
  })
  approval_status!: string;

  @Column({
    type: DataType.DATE
  })
  date_of_assessment!: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  is_demo?: boolean;

  @Column({
    type: DataType.DATE
  })
  created_at?: Date;
}
