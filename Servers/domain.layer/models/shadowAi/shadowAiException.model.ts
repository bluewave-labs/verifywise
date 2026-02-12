import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { ShadowAiPolicyModel } from "./shadowAiPolicy.model";

@Table({
  tableName: "shadow_ai_exceptions",
  timestamps: true,
  underscored: true,
})
export class ShadowAiExceptionModel extends Model<ShadowAiExceptionModel> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id?: number;

  @ForeignKey(() => ShadowAiPolicyModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  policy_id!: number;

  @Column({ type: DataType.STRING, allowNull: true })
  department?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  user_identifier?: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  reason!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  compensating_controls?: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  approved_by?: number;

  @Column({ type: DataType.DATE, allowNull: true })
  approved_at?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  expires_at?: Date;

  @Column({
    type: DataType.ENUM("pending", "approved", "expired", "revoked"),
    allowNull: false,
    defaultValue: "pending",
  })
  status!: string;

  @Column({ type: DataType.DATE, allowNull: false })
  created_at?: Date;

  @Column({ type: DataType.DATE })
  updated_at?: Date;
}
