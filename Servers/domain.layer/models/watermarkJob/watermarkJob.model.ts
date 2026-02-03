import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { UserModel } from "../user/user.model";

export type WatermarkJobType = "embed" | "detect";
export type WatermarkJobStatus = "pending" | "processing" | "completed" | "failed";

export interface WatermarkJob {
  id?: number;
  user_id: number;
  type: WatermarkJobType;
  status: WatermarkJobStatus;
  input_file_id?: number;
  input_file_name: string;
  input_file_type: string;
  input_file_size?: number;
  output_file_id?: number;
  model_id?: number;
  project_id?: number;
  evidence_id?: number;
  settings?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error_message?: string;
  processing_time_ms?: number;
  created_at?: Date;
  completed_at?: Date;
  is_demo?: boolean;
}

@Table({
  tableName: "watermark_jobs",
})
export class WatermarkJobModel extends Model<WatermarkJob> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id!: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  type!: WatermarkJobType;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: "pending",
  })
  status!: WatermarkJobStatus;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  input_file_id?: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  input_file_name!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  input_file_type!: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  input_file_size?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  output_file_id?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  model_id?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  project_id?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  evidence_id?: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  settings?: Record<string, unknown>;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  result?: Record<string, unknown>;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  error_message?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  processing_time_ms?: number;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  created_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  completed_at?: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_demo?: boolean;
}
