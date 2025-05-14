/**
 * Represents an organization in the system.
 *
 * @type Organization
 *
 * @property {number} id - The unique identifier for the organization.
 * @property {string} name - The name of the organization.
 * @property {string} logo - The logo URL of the organization.
 * @property {number[]} members - Array of user IDs who are members of this organization.
 * @property {number[]} projects - Array of project IDs associated with this organization.
 * @property {Date} created_at - The date and time when the organization was created.
 */

import { Column, DataType, Model, Table } from "sequelize-typescript";

export type Organization = {
  id?: number;
  name: string;
  logo?: string;
  members?: number[]; // IDs of users
  projects?: number[]; // IDs of projects
  created_at?: Date;
};

@Table({
  tableName: "organizations",
})
export class OrganizationModel extends Model<Organization> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.STRING,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
  })
  logo!: string;

  @Column({
    type: DataType.ARRAY(DataType.INTEGER),
  })
  members!: number[];

  @Column({
    type: DataType.ARRAY(DataType.INTEGER),
  })
  projects!: number[];

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
