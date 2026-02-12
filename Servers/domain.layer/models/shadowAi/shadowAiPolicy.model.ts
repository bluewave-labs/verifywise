import { Column, DataType, Model, Table } from "sequelize-typescript";

@Table({
  tableName: "shadow_ai_policies",
  timestamps: true,
  underscored: true,
})
export class ShadowAiPolicyModel extends Model<ShadowAiPolicyModel> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id?: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description?: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  department_scope?: string[];

  @Column({ type: DataType.JSONB, allowNull: false })
  rules!: Record<string, unknown>;

  @Column({
    type: DataType.ENUM("critical", "high", "medium", "low"),
    allowNull: false,
    defaultValue: "medium",
  })
  severity!: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  is_active!: boolean;

  @Column({ type: DataType.INTEGER, allowNull: true })
  created_by?: number;

  @Column({ type: DataType.DATE, allowNull: false })
  created_at?: Date;

  @Column({ type: DataType.DATE })
  updated_at?: Date;
}
