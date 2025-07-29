import { Column, DataType, Model, Table } from "sequelize-typescript";
import { IAITrustCentreSubprocessors } from "../../interfaces/i.aiTrustCentreSubprocessors";

@Table({
  tableName: "ai_trust_center_subprocessors",
})
export class AITrustCenterSubprocessorsModel extends Model<AITrustCenterSubprocessorsModel> implements IAITrustCentreSubprocessors {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  purpose!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  location!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  url!: string;

}