// this model will be replaced by the one inside structures/new-mock-data/projects.mock.ts directory

import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { UserModel } from "./user.model";

export type Project = {
  id?: number;
  project_title: string;
  owner: number;
  start_date: Date;
  ai_risk_classification: "High risk" | "Limited risk" | "Minimal risk";
  type_of_high_risk_role:
  | "Deployer"
  | "Provider"
  | "Distributor"
  | "Importer"
  | "Product manufacturer"
  | "Authorized representative";
  goal: string;
  last_updated: Date;
  last_updated_by: number;
  created_at?: Date;
  // vendors: string[];

  // statistical fields
  doneSubcontrols?: number;
  totalSubcontrols?: number;
  answeredAssessments?: number;
  totalAssessments?: number;
};

@Table({
  tableName: "projects"
})
export class ProjectModel extends Model<Project> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

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
    type: DataType.ENUM("High risk", "Limited risk", "Minimal risk"),
  })
  ai_risk_classification!: "High risk" | "Limited risk" | "Minimal risk";

  @Column({
    type: DataType.ENUM("Deployer", "Provider", "Distributor", "Importer", "Product manufacturer", "Authorized representative"),
  })
  type_of_high_risk_role!: | "Deployer"
    | "Provider"
    | "Distributor"
    | "Importer"
    | "Product manufacturer"
    | "Authorized representative";

  @Column({
    type: DataType.STRING,
  })
  goal!: string;

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
    defaultValue: false
  })
  is_demo?: boolean;

  @Column({
    type: DataType.DATE
  })
  created_at?: Date;
}
