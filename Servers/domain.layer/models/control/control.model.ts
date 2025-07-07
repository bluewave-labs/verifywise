import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { ControlCategoryModel } from "../controlCategory/controlCategory.model";
import { IControl } from "../../interfaces/i.control";

@Table({
  tableName: "controls",
})
export class ControlModel extends Model<ControlModel> implements IControl {
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
  order_no?: number;

  @Column({
    // define ENUM constraint at DB level
    type: DataType.ENUM("Waiting", "In progress", "Done"),
  })
  status?: "Waiting" | "In progress" | "Done";

  @Column({
    type: DataType.INTEGER,
  })
  approver?: number;

  @Column({
    type: DataType.ENUM(
      "Acceptable risk",
      "Residual risk",
      "Unacceptable risk"
    ),
  })
  risk_review?: "Acceptable risk" | "Residual risk" | "Unacceptable risk";

  @Column({
    type: DataType.INTEGER,
  })
  owner?: number;

  @Column({
    type: DataType.INTEGER,
  })
  reviewer?: number;

  @Column({
    type: DataType.DATE,
  })
  due_date?: Date;

  @Column({
    type: DataType.STRING,
  })
  implementation_details?: string;

  @ForeignKey(() => ControlCategoryModel)
  @Column({
    type: DataType.INTEGER,
  })
  control_category_id!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_demo?: boolean;

  @Column({
    type: DataType.DATE,
  })
  created_at?: Date;
}
