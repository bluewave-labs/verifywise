import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { IAITrustCentreResources } from "../../interfaces/i.aiTrustCentreResources";
import { FileModel } from "../file/file.model";

@Table({
  tableName: "ai_trust_center_resources",
})
export class AITrustCenterResourcesModel extends Model<AITrustCenterResourcesModel> implements IAITrustCentreResources {
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
  description!: string;

  @ForeignKey(() => FileModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  file_id!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  visible!: boolean;

}