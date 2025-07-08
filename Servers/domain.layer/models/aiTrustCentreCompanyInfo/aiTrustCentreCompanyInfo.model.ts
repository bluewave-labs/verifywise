import { Column, DataType, Model, Table } from "sequelize-typescript";

export type AITrustCentreCompanyInfo = {
  id?: number;
  company_info_visible: boolean;
  background_visible: boolean;
  background_text?: string;
  core_benefit_visible: boolean;
  core_benefit_text?: string;
  compliance_doc_visible: boolean;
  compliance_doc_text?: string;
  organization_id: number;
  createdAt?: Date;
  updatedAt?: Date;
};

@Table({
  tableName: "ai_trust_Centre_company_info",
  timestamps: true,
})
export class AITrustCentreCompanyInfoModel extends Model<AITrustCentreCompanyInfo> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id?: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  company_info_visible!: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  background_visible!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  background_text?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  core_benefit_visible!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  core_benefit_text?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  compliance_doc_visible!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  compliance_doc_text?: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  organization_id!: number;
}