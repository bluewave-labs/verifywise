import { Column, DataType, Model, Table } from "sequelize-typescript";

export type AITrustCenterComplianceBadges = {
  id?: number;
  badges_visible: boolean;
  SOC2_Type_I: boolean;
  SOC2_Type_II: boolean;
  ISO_27001: boolean;
  ISO_42001: boolean;
  CCPA: boolean;
  GDPR: boolean;
  HIPAA: boolean;
  EU_AI_Act: boolean;
  organization_id: number;
  createdAt?: Date;
  updatedAt?: Date;
};

@Table({
  tableName: "ai_trust_center_compliance_badges",
  timestamps: true,
})
export class AITrustCenterComplianceBadgesModel extends Model<AITrustCenterComplianceBadges> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id?: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  badges_visible!: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  SOC2_Type_I!: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  SOC2_Type_II!: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  ISO_27001!: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  ISO_42001!: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  CCPA!: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  GDPR!: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  HIPAA!: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  EU_AI_Act!: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false })
  organization_id!: number;
}