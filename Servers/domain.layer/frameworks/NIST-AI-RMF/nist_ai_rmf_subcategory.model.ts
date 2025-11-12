import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { NISTAIMRFCategoryModel } from "./nist_ai_rmf_category.model";
import { Status, STATUSES } from "../../../types/status.type";
import { UserModel } from "../../models/user/user.model";

@Table({
  tableName: "nist_ai_rmf_subcategories",
  timestamps: false,
})
export class NISTAIMRFSubcategoryModel extends Model<NISTAIMRFSubcategoryModel> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  index?: number;

  @Column({
    type: DataType.STRING,
  })
  title?: string;

  @Column({
    type: DataType.STRING,
  })
  description?: string;

  @ForeignKey(() => NISTAIMRFCategoryModel)
  @Column({
    type: DataType.INTEGER,
  })
  category_id?: number;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  created_at?: Date;

  @Column({
    type: DataType.DATE,
  })
  updated_at?: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_demo?: boolean;

  @Column({
    type: DataType.ENUM(...STATUSES),
  })
  status!: Status;

  @Column({
    type: DataType.STRING,
  })
  auditor_feedback!: string;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
  })
  owner!: number;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
  })
  reviewer!: number;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
  })
  approver!: number;

  @Column({
    type: DataType.DATE,
  })
  due_date!: Date;

  @Column({
    type: DataType.JSONB,
  })
  evidence_links!: Object[];
}
