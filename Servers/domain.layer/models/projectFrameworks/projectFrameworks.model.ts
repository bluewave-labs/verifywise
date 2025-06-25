import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { ProjectModel } from "../project/project.model";
import { FrameworkModel } from "../frameworks/frameworks.model";

export type ProjectFrameworks = {
  framework_id: number;
  project_id: number;
};

@Table({
  tableName: "project_frameworks",
})
export class ProjectFrameworksModel extends Model<ProjectFrameworks> {
  @ForeignKey(() => FrameworkModel)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  framework_id!: number;

  @ForeignKey(() => ProjectModel)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  project_id!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_demo?: boolean;
}
