import { Column, DataType, Model, Table } from "sequelize-typescript";

export type Role = {
  id?: number;
  name: string;
  description: string;
}

@Table({
  tableName: "roles"
})
export class RoleModel extends Model<Role> {

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
}
