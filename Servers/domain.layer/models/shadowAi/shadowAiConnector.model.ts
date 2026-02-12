import { Column, DataType, Model, Table } from "sequelize-typescript";

@Table({
  tableName: "shadow_ai_connectors",
  timestamps: true,
  underscored: true,
})
export class ShadowAiConnectorModel extends Model<ShadowAiConnectorModel> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id?: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({
    type: DataType.ENUM("splunk", "sentinel", "qradar", "zscaler", "netskope", "syslog", "webhook"),
    allowNull: false,
  })
  type!: string;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  config!: Record<string, unknown>;

  @Column({
    type: DataType.ENUM("active", "paused", "error", "configuring"),
    allowNull: false,
    defaultValue: "configuring",
  })
  status!: string;

  @Column({ type: DataType.DATE, allowNull: true })
  last_sync_at?: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  last_error?: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  events_ingested!: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  created_by?: number;

  @Column({ type: DataType.DATE, allowNull: false })
  created_at?: Date;

  @Column({ type: DataType.DATE })
  updated_at?: Date;
}
