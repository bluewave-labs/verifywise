import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { NISTAIMRFFunctionModel } from "./nist_ai_rmf_function.model";

@Table({
  tableName: "nist_ai_rmf_categories",
  timestamps: false,
})
export class NISTAIMRFCategoryModel extends Model<NISTAIMRFCategoryModel> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.STRING,
  })
  title?: string;

  @Column({
    type: DataType.STRING,
  })
  description?: string;

  @ForeignKey(() => NISTAIMRFFunctionModel)
  @Column({
    type: DataType.INTEGER,
  })
  function_id?: number;
}
