import { Column, DataType, Model, Table } from "sequelize-typescript";

@Table({
  tableName: "shadow_ai_evidence_exports",
  timestamps: true,
  underscored: true,
})
export class ShadowAiEvidenceExportModel extends Model<ShadowAiEvidenceExportModel> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id?: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ type: DataType.DATE, allowNull: false })
  date_range_start!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  date_range_end!: Date;

  @Column({ type: DataType.JSONB, allowNull: true })
  filters?: Record<string, unknown>;

  @Column({
    type: DataType.ENUM("pdf", "csv", "json"),
    allowNull: false,
    defaultValue: "csv",
  })
  export_format!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  file_path?: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  generated_by?: number;

  @Column({ type: DataType.DATE, allowNull: true })
  generated_at?: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  created_at?: Date;

  @Column({ type: DataType.DATE })
  updated_at?: Date;
}
