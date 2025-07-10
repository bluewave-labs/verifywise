import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { ProjectModel } from "../project/project.model";
import { UserModel } from "../user/user.model";
import { IProjectRisk } from "../../interfaces/I.projectRisk";

@Table({
  tableName: "project_risks",
})
export class ProjectRiskModel
  extends Model<ProjectRiskModel>
  implements IProjectRisk
{
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @ForeignKey(() => ProjectModel)
  @Column({
    type: DataType.INTEGER,
  })
  project_id!: number;

  @Column({
    type: DataType.STRING,
  })
  risk_name!: string;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
  })
  risk_owner!: number;

  @Column({
    type: DataType.ENUM(
      "Problem definition & planning",
      "Data collection & processing",
      "Model development & training",
      "Model validation & testing",
      "Deployment & integration",
      "Monitoring & maintenance",
      "Decommissioning & retirement"
    ),
  })
  ai_lifecycle_phase!:
    | "Problem definition & planning"
    | "Data collection & processing"
    | "Model development & training"
    | "Model validation & testing"
    | "Deployment & integration"
    | "Monitoring & maintenance"
    | "Decommissioning & retirement";

  @Column({
    type: DataType.STRING,
  })
  risk_description!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
  })
  risk_category!: string[];

  @Column({
    type: DataType.STRING,
  })
  impact!: string;

  @Column({
    type: DataType.STRING,
  })
  assessment_mapping!: string;

  @Column({
    type: DataType.STRING,
  })
  controls_mapping!: string;

  @Column({
    type: DataType.ENUM(
      "Rare",
      "Unlikely",
      "Possible",
      "Likely",
      "Almost Certain"
    ),
  })
  likelihood!: "Rare" | "Unlikely" | "Possible" | "Likely" | "Almost Certain";

  @Column({
    type: DataType.ENUM(
      "Negligible",
      "Minor",
      "Moderate",
      "Major",
      "Catastrophic"
    ),
  })
  severity!: "Negligible" | "Minor" | "Moderate" | "Major" | "Catastrophic";

  @Column({
    type: DataType.ENUM(
      "No risk",
      "Low risk",
      "Medium risk",
      "High risk",
      "Very high risk"
    ),
  })
  risk_level_autocalculated!:
    | "No risk"
    | "Low risk"
    | "Medium risk"
    | "High risk"
    | "Very high risk";

  @Column({
    type: DataType.STRING,
  })
  review_notes!: string;

  @Column({
    type: DataType.ENUM(
      "Not Started",
      "In Progress",
      "Completed",
      "On Hold",
      "Deferred",
      "Canceled",
      "Requires review"
    ),
  })
  mitigation_status!:
    | "Not Started"
    | "In Progress"
    | "Completed"
    | "On Hold"
    | "Deferred"
    | "Canceled"
    | "Requires review";

  @Column({
    type: DataType.ENUM(
      "Very Low risk",
      "Low risk",
      "Medium risk",
      "High risk",
      "Very high risk"
    ),
  })
  current_risk_level!:
    | "Very Low risk"
    | "Low risk"
    | "Medium risk"
    | "High risk"
    | "Very high risk";

  @Column({
    type: DataType.DATE,
  })
  deadline!: Date;

  @Column({
    type: DataType.STRING,
  })
  mitigation_plan!: string;

  @Column({
    type: DataType.STRING,
  })
  implementation_strategy!: string;

  @Column({
    type: DataType.STRING,
  })
  mitigation_evidence_document!: string;

  @Column({
    type: DataType.ENUM(
      "Rare",
      "Unlikely",
      "Possible",
      "Likely",
      "Almost Certain"
    ),
  })
  likelihood_mitigation!:
    | "Rare"
    | "Unlikely"
    | "Possible"
    | "Likely"
    | "Almost Certain";

  @Column({
    type: DataType.ENUM("Negligible", "Minor", "Moderate", "Major", "Critical"),
  })
  risk_severity!: "Negligible" | "Minor" | "Moderate" | "Major" | "Critical";

  @Column({
    type: DataType.STRING,
  })
  final_risk_level!: string;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
  })
  risk_approval!: number;

  @Column({
    type: DataType.STRING,
  })
  approval_status!: string;

  @Column({
    type: DataType.DATE,
  })
  date_of_assessment!: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_demo?: boolean;

  @Column({
    type: DataType.DATE,
  })
  created_at?: Date;
}
