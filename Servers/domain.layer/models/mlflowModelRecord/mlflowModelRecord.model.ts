import {
  Column,
  DataType,
  ForeignKey,
  Index,
  Model,
  Table,
} from "sequelize-typescript";
import { IMLFlowModelRecord } from "../../interfaces/i.mlflowModelRecord";
import { OrganizationModel } from "../organization/organization.model";

@Table({
  tableName: "mlflow_model_records",
  timestamps: true,
  underscored: true,
})
export class MLFlowModelRecordModel
  extends Model<MLFlowModelRecordModel>
  implements IMLFlowModelRecord
{
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  model_name!: string;

  @Index("mlflow_model_records_org_model_version")
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  version!: string;

  @Column({
    type: DataType.STRING,
  })
  lifecycle_stage?: string | null;

  @Column({
    type: DataType.STRING,
  })
  run_id?: string | null;

  @Column({
    type: DataType.TEXT,
  })
  description?: string | null;

  @Column({
    type: DataType.STRING,
  })
  source?: string | null;

  @Column({
    type: DataType.STRING,
  })
  status?: string | null;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  tags?: Record<string, string>;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  metrics?: Record<string, number>;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
  })
  parameters?: Record<string, string>;

  @Column({
    type: DataType.STRING,
  })
  experiment_id?: string | null;

  @Column({
    type: DataType.STRING,
  })
  experiment_name?: string | null;

  @Column({
    type: DataType.TEXT,
  })
  artifact_location?: string | null;

  @Column({
    type: DataType.STRING,
  })
  training_status?: string | null;

  @Column({
    type: DataType.DATE,
  })
  training_started_at?: Date | null;

  @Column({
    type: DataType.DATE,
  })
  training_ended_at?: Date | null;

  @Column({
    type: DataType.STRING,
  })
  source_version?: string | null;

  @Column({
    type: DataType.DATE,
  })
  model_created_at?: Date | null;

  @Column({
    type: DataType.DATE,
  })
  model_updated_at?: Date | null;

  @Column({
    type: DataType.DATE,
  })
  last_synced_at?: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  updated_at?: Date;
}
