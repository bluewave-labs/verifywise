import { Column, DataType, Model, Table } from "sequelize-typescript";
import { IProjectScope } from "../../interfaces/i.projectScope";

@Table({
  tableName: "project_scopes",
})
export class ProjectScopeModel
  extends Model<ProjectScopeModel>
  implements IProjectScope
{
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.INTEGER,
    field: "assessment_id",
  })
  assessmentId!: number;

  @Column({
    type: DataType.STRING,
    field: "describe_ai_environment",
  })
  describeAiEnvironment!: string;

  @Column({
    type: DataType.BOOLEAN,
    field: "is_new_ai_technology",
  })
  isNewAiTechnology!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    field: "uses_personal_data",
  })
  usesPersonalData!: boolean;

  @Column({
    type: DataType.STRING,
    field: "project_scope_documents",
  })
  projectScopeDocuments!: string;

  @Column({
    type: DataType.STRING,
    field: "technology_type",
  })
  technologyType!: string;

  @Column({
    type: DataType.BOOLEAN,
    field: "has_ongoing_monitoring",
  })
  hasOngoingMonitoring!: boolean;

  @Column({
    type: DataType.STRING,
    field: "unintended_outcomes",
  })
  unintendedOutcomes!: string;

  @Column({
    type: DataType.STRING,
    field: "technology_documentation",
  })
  technologyDocumentation!: string;

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
