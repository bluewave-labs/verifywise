import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { OrganizationModel } from "../organization/organization.model";

@Table({
  tableName: "evidently_models",
  timestamps: true,
  underscored: true,
})
export class EvidentlyModelModel extends Model<EvidentlyModelModel> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @ForeignKey(() => OrganizationModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  organization_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  project_id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  project_name!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  model_name!: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  last_sync_at?: Date;

  @Column({
    type: DataType.ENUM("healthy", "warning", "critical", "unknown"),
    allowNull: false,
    defaultValue: "unknown",
  })
  drift_status!: string;

  @Column({
    type: DataType.ENUM("healthy", "warning", "critical", "unknown"),
    allowNull: false,
    defaultValue: "unknown",
  })
  performance_status!: string;

  @Column({
    type: DataType.ENUM("healthy", "warning", "critical", "unknown"),
    allowNull: false,
    defaultValue: "unknown",
  })
  fairness_status!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  metrics_count!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  updated_at!: Date;
}
