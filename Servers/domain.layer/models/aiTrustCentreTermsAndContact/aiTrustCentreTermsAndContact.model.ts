// CREATE TABLE ai_trust_center_terms_and_contact (
//     id SERIAL PRIMARY KEY,
//     is_visible BOOLEAN NOT NULL DEFAULT FALSE,
//     has_terms_of_service BOOLEAN NOT NULL DEFAULT FALSE,
//     terms_of_service TEXT,
//     has_privacy_policy BOOLEAN NOT NULL DEFAULT FALSE,
//     privacy_policy TEXT,
//     has_company_email BOOLEAN NOT NULL DEFAULT FALSE,
//     company_email VARCHAR(255),
//     organization_id INTEGER NOT NULL REFERENCES organizations(id) ON UPDATE CASCADE ON DELETE CASCADE,
//     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//     CONSTRAINT unique_org_id_terms_and_contact UNIQUE (organization_id)
//   );

import { Column, DataType, Model, Table } from "sequelize-typescript";

export type AITrustCenterTermsAndContact = {
  id?: number;
  is_visible: boolean;
  has_terms_of_service: boolean;
  terms_of_service?: string;
  has_privacy_policy: boolean;
  privacy_policy?: string;
  has_company_email: boolean;
  company_email?: string;
  organization_id: number;
  created_at?: Date;
  updated_at?: Date;
};

@Table({
  tableName: "ai_trust_center_terms_and_contact",
  timestamps: true,
})
export class AITrustCenterTermsAndContactModel extends Model<AITrustCenterTermsAndContact> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id?: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  is_visible!: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  has_terms_of_service!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  terms_of_service?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  has_privacy_policy!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  privacy_policy?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  has_company_email!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  company_email?: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  organization_id!: number;
}