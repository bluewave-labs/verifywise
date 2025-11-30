import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { UserModel } from "../user/user.model";
import { IProjectAttributes } from "../../interfaces/i.project";
import { AiRiskClassification } from "../../enums/ai-risk-classification.enum";
import { HighRiskRole } from "../../enums/high-risk-role.enum";
import { ProjectStatus } from "../../enums/project-status.enum";

@Table({
  tableName: "projects",
  timestamps: true,
  underscored: true,
})
export class ProjectModel
  extends Model<ProjectModel>
  implements IProjectAttributes
{
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  uc_id?: string;

  @Column({
    type: DataType.STRING,
  })
  project_title!: string;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
  })
  owner!: number;

  @Column({
    type: DataType.DATE,
  })
  start_date!: Date;

  @Column({
    type: DataType.INTEGER,
  })
  geography!: number;

  @Column({
    type: DataType.ENUM(...Object.values(AiRiskClassification)),
  })
  ai_risk_classification!: AiRiskClassification;

  @Column({
    type: DataType.ENUM(...Object.values(HighRiskRole)),
  })
  type_of_high_risk_role!: HighRiskRole;

  @Column({
    type: DataType.STRING,
  })
  goal!: string;

  @Column({
    type: DataType.STRING,
  })
  target_industry!: string;

  @Column({
    type: DataType.STRING,
  })
  description!: string;

  @Column({
    type: DataType.DATE,
  })
  last_updated!: Date;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
  })
  last_updated_by!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_demo?: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  updated_at?: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_organizational!: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(ProjectStatus)),
    allowNull: false,
    defaultValue: ProjectStatus.NOT_STARTED,
  })
  status!: ProjectStatus;

  static async CreateNewProject(
    projectAttributes: Partial<IProjectAttributes>
  ) {
    // Convert Partial<IProjectAttributes> to Optional<ProjectModel, NullishPropertiesOf<ProjectModel>>
    const attributes = projectAttributes as any;
    return await ProjectModel.create(attributes);
  }

  static async UpdateProject(
    projectId: number,
    projectAttributes: Partial<IProjectAttributes>
  ) {
    return await ProjectModel.update(projectAttributes, {
      where: {
        id: projectId,
      },
    });
  }

  constructor(init?: Partial<IProjectAttributes>) {
    super();
    Object.assign(this, init);
  }
}
