import { Column, DataType, Model, Table } from "sequelize-typescript";

@Table({
  tableName: "shadow_ai_reviews",
  timestamps: true,
  underscored: true,
})
export class ShadowAiReviewModel extends Model<ShadowAiReviewModel> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id?: number;

  @Column({
    type: DataType.ENUM("tool_approval", "violation_review", "exception_request", "periodic_audit"),
    allowNull: false,
  })
  review_type!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  subject_id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  subject_type!: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  assigned_to?: number;

  @Column({
    type: DataType.ENUM("pending", "in_progress", "completed", "escalated"),
    allowNull: false,
    defaultValue: "pending",
  })
  status!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  decision?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes?: string;

  @Column({ type: DataType.DATE, allowNull: true })
  completed_at?: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  created_at?: Date;

  @Column({ type: DataType.DATE })
  updated_at?: Date;
}
