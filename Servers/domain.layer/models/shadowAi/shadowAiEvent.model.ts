import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { ShadowAiConnectorModel } from "./shadowAiConnector.model";

@Table({
  tableName: "shadow_ai_events",
  timestamps: true,
  underscored: true,
})
export class ShadowAiEventModel extends Model<ShadowAiEventModel> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id?: number;

  @ForeignKey(() => ShadowAiConnectorModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  connector_id!: number;

  @Column({ type: DataType.STRING, allowNull: true })
  raw_event_id?: string;

  @Column({ type: DataType.DATE, allowNull: false })
  timestamp!: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  user_identifier?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  department?: string;

  @Column({ type: DataType.STRING, allowNull: false })
  ai_tool_name!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  ai_tool_category?: string;

  @Column({
    type: DataType.ENUM("access", "upload", "download", "prompt", "api_call", "login", "data_share", "other"),
    allowNull: false,
    defaultValue: "access",
  })
  action_type!: string;

  @Column({
    type: DataType.ENUM("public", "internal", "confidential", "restricted", "pii", "phi", "financial", "unknown"),
    allowNull: true,
    defaultValue: "unknown",
  })
  data_classification?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  source_ip?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  destination_url?: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  metadata?: Record<string, unknown>;

  @Column({ type: DataType.INTEGER, allowNull: true })
  risk_score?: number;

  @Column({
    type: DataType.ENUM("critical", "high", "medium", "low", "info"),
    allowNull: true,
  })
  risk_level?: string;

  @Column({ type: DataType.DATE, allowNull: false })
  created_at?: Date;

  @Column({ type: DataType.DATE })
  updated_at?: Date;
}
