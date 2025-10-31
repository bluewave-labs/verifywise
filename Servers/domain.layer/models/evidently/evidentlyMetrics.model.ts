import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { EvidentlyModelModel } from "./evidentlyModel.model";

@Table({
  tableName: "evidently_metrics",
  timestamps: true,
  underscored: true,
  createdAt: "created_at",
  updatedAt: false, // This table doesn't have updated_at
})
export class EvidentlyMetricsModel extends Model<EvidentlyMetricsModel> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @ForeignKey(() => EvidentlyModelModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  model_id!: number;

  @Column({
    type: DataType.ENUM("drift", "performance", "fairness"),
    allowNull: false,
  })
  metric_type!: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  metric_data!: any;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  captured_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;
}
