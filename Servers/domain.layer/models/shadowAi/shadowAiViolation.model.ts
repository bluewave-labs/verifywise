import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { ShadowAiEventModel } from "./shadowAiEvent.model";
import { ShadowAiPolicyModel } from "./shadowAiPolicy.model";

@Table({
  tableName: "shadow_ai_violations",
  timestamps: true,
  underscored: true,
})
export class ShadowAiViolationModel extends Model<ShadowAiViolationModel> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id?: number;

  @ForeignKey(() => ShadowAiEventModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  event_id!: number;

  @ForeignKey(() => ShadowAiPolicyModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  policy_id!: number;

  @Column({ type: DataType.STRING, allowNull: true })
  user_identifier?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  department?: string;

  @Column({
    type: DataType.ENUM("critical", "high", "medium", "low"),
    allowNull: false,
  })
  severity!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  description!: string;

  @Column({
    type: DataType.ENUM("open", "acknowledged", "resolved", "excepted"),
    allowNull: false,
    defaultValue: "open",
  })
  status!: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  resolved_by?: number;

  @Column({ type: DataType.DATE, allowNull: true })
  resolved_at?: Date;

  @Column({ type: DataType.INTEGER, allowNull: true })
  exception_id?: number;

  @Column({ type: DataType.DATE, allowNull: false })
  created_at?: Date;

  @Column({ type: DataType.DATE })
  updated_at?: Date;
}
