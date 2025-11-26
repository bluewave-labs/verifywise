import { Column, DataType, Model, Table } from "sequelize-typescript";
import { ILLMKey } from "../../interfaces/i.llmKey";

@Table({
  tableName: "llm_keys",
})
export class LLMKeyModel extends Model<LLMKeyModel> implements ILLMKey {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  key!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  created_at!: Date;
}
