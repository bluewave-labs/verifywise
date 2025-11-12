import { Column, DataType, ForeignKey, Table } from "sequelize-typescript";
import { NISTAIMRFFunctionType } from "../../enums/nist-ai-rmf-function.enum";
import { FrameworkModel } from "../../models/frameworks/frameworks.model";

@Table({
  tableName: "nist_ai_rmf_functions",
  timestamps: false,
})
export class NISTAIMRFFunctionModel {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.ENUM(...Object.values(NISTAIMRFFunctionType)),
  })
  type!: NISTAIMRFFunctionType;

  @Column({
    type: DataType.STRING,
  })
  title!: string;

  @Column({
    type: DataType.STRING,
  })
  description!: string;

  @ForeignKey(() => FrameworkModel)
  @Column({
    type: DataType.INTEGER,
  })
  framework_id!: number;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  created_at!: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_demo?: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  index!: number;
}
