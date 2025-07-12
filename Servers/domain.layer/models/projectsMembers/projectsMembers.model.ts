import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { ProjectModel } from "../project/project.model";
import { UserModel } from "../user/user.model";
import { IProjectsMembers } from "../../interfaces/i.projectMember";

@Table({
  tableName: "project_members",
})
export class ProjectsMembersModel
  extends Model<ProjectsMembersModel>
  implements IProjectsMembers
{
  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  user_id!: number;

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
