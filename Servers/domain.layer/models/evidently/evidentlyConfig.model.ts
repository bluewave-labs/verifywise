import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { UserModel } from "../user/user.model";
import { OrganizationModel } from "../organization/organization.model";

@Table({
  tableName: "evidently_configs",
  timestamps: true,
  underscored: true,
})
export class EvidentlyConfigModel extends Model<EvidentlyConfigModel> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id!: number;

  @ForeignKey(() => OrganizationModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  organization_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    defaultValue: "https://app.evidently.cloud",
  })
  evidently_url!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  api_token_encrypted!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  api_token_iv!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_configured!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  last_test_date?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  updated_at!: Date;
}
