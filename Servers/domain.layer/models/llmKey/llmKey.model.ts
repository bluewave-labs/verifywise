import { Column, DataType, Model, Table } from "sequelize-typescript";
import { ILLMKey, LLMProvider } from "../../interfaces/i.llmKey";

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
    type: DataType.ENUM("Anthropic", "OpenAI", "OpenRouter"),
    allowNull: false,
  })
  name!: LLMProvider;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  url!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  model!: string;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  created_at!: Date;
}
