import { IAITrustCentreOverview } from "../../interfaces/i.aiTrustCentreOverview";
import { Column, DataType, Model, Table } from "sequelize-typescript";

type IAITrustCentreOverviewTermsAndContact = IAITrustCentreOverview["terms_and_contact"];

@Table({
  tableName: "ai_trust_center_terms_and_contact",
})
export class AITrustCenterTermsAndContactModel extends Model<AITrustCenterTermsAndContactModel> implements IAITrustCentreOverviewTermsAndContact {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  terms_visible!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  terms_text!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  privacy_visible!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  privacy_text!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  email_visible!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  email_text!: string;
}