import { Column, DataType, Model, Table } from "sequelize-typescript";
import { IRoleAttributes } from "../../interfaces/i.role";

export type Role = {
  id?: number;
  name: string;
  description: string;
  created_at?: Date;
}

@Table({
  tableName: "roles"
})
export class RoleModel extends Model<Role> implements IRoleAttributes {

  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.STRING
  })
  name!: string;

  @Column({
    type: DataType.STRING
  })
  description!: string;

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

  static async createRole(
    name: string,
    description: string
  ): Promise<RoleModel> {
    const role = new RoleModel()
    role.name = name
    role.description = description
    role.created_at = new Date()
    return role
  }
}
