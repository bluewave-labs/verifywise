import { IAITrustCentreOverview } from "../../interfaces/i.aiTrustCentreOverview";
import { Column, DataType, Model, Table } from "sequelize-typescript";

type IAITrustCentreOverviewIntro = IAITrustCentreOverview["intro"]

@Table({
  tableName: "ai_trust_center_intro",
})
export class AITrustCenterIntroModel extends Model<AITrustCenterIntroModel> implements IAITrustCentreOverviewIntro {
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
  purpose_visible!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  purpose_text!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  our_statement_visible!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  our_statement_text!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  our_mission_visible!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  our_mission_text!: string;
}