import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { IToken } from "../../interfaces/i.tokens";
import { UserModel } from "../user/user.model";

@Table({
  tableName: "tokens",
})
export class TokenModel extends Model<TokenModel> implements IToken {
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
  token!: string;

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

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expires_at!: Date;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  created_by!: number;
}
