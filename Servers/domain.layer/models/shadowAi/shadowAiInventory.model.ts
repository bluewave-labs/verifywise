import { Column, DataType, Model, Table } from "sequelize-typescript";

@Table({
  tableName: "shadow_ai_inventory",
  timestamps: true,
  underscored: true,
})
export class ShadowAiInventoryModel extends Model<ShadowAiInventoryModel> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id?: number;

  @Column({ type: DataType.STRING, allowNull: false })
  tool_name!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  tool_domain!: string;

  @Column({
    type: DataType.ENUM(
      "generative_ai", "code_assistant", "image_generation", "video_generation",
      "voice_ai", "translation", "data_analysis", "search_ai",
      "writing_assistant", "chatbot", "automation", "ml_platform", "other"
    ),
    allowNull: false,
    defaultValue: "other",
  })
  category!: string;

  @Column({ type: DataType.DATE, allowNull: false })
  first_seen!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  last_seen!: Date;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  total_events!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  unique_users!: number;

  @Column({ type: DataType.JSONB, allowNull: true, defaultValue: [] })
  departments?: string[];

  @Column({
    type: DataType.ENUM("critical", "high", "medium", "low", "unclassified"),
    allowNull: false,
    defaultValue: "unclassified",
  })
  risk_classification!: string;

  @Column({
    type: DataType.ENUM("discovered", "under_review", "approved", "blocked"),
    allowNull: false,
    defaultValue: "discovered",
  })
  approval_status!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes?: string;

  @Column({ type: DataType.DATE, allowNull: false })
  created_at?: Date;

  @Column({ type: DataType.DATE })
  updated_at?: Date;
}
