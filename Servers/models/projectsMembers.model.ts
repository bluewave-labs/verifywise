import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { ProjectModel } from "./project.model";
import { UserModel } from "./user.model";

export type ProjectsMembers = {
  user_id: number;
  project_id: number;
};

@Table({
  tableName: "project_members"
})
export class ProjectsMembersModel extends Model<ProjectsMembers> {
  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true
  })
  user_id!: number;

  @ForeignKey(() => ProjectModel)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true
  })
  project_id!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  is_demo?: boolean;
}
