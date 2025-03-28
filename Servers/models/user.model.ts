/**
 * Represents a user in the system.
 *
 * @type User
 *
 * @property {number} id - The unique identifier for the user.
 * @property {string} name - The name of the user.
 * @property {string} email - The email address of the user.
 * @property {string} password_hash - The hashed password of the user.
 * @property {number} role - The role of the user, represented as a number.
 * @property {Date} created_at - The date and time when the user was created.
 * @property {Date} last_login - The date and time when the user last logged in.
 */

import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { RoleModel } from "./role.model";

export type User = {
  id?: number;
  name: string;
  surname: string;
  email: string;
  password_hash: string;
  role: number;
  created_at: Date;
  last_login: Date;
};

@Table({
  tableName: "users"
})
export class UserModel extends Model<User> {
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
  surname!: string;

  @Column({
    type: DataType.STRING
  })
  email!: string;

  @Column({
    type: DataType.STRING
  })
  password_hash!: string;

  @ForeignKey(() => RoleModel)
  @Column({
    type: DataType.INTEGER
  })
  role!: number;

  @Column({
    type: DataType.DATE
  })
  created_at!: Date;

  @Column({
    type: DataType.DATE
  })
  last_login!: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  is_demo?: boolean;
}
