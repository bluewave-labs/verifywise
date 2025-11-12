import { Column, DataType, ForeignKey, Table } from "sequelize-typescript";

@Table({
  tableName: "nist_ai_rmf_categories",
  timestamps: false,
})
export class NISTAIMRFCategoryModel {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.STRING,
  })
  title!: string;

  @Column({
    type: DataType.STRING,
  })
  description!: string;

  @Column({
    type: DataType.INTEGER,
  })
  function_id!: number;
}
