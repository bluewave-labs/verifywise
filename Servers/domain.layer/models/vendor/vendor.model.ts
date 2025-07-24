import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { UserModel } from "../user/user.model";
import { IVendor } from "../../interfaces/i.vendor";

@Table({
  tableName: "vendors",
})
export class VendorModel extends Model<VendorModel> implements IVendor {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.INTEGER,
  })
  order_no?: number;

  @Column({
    type: DataType.STRING,
  })
  vendor_name!: string;

  @Column({
    type: DataType.STRING,
  })
  vendor_provides!: string;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
  })
  assignee!: number;

  @Column({
    type: DataType.STRING,
  })
  website!: string;

  @Column({
    type: DataType.STRING,
  })
  vendor_contact_person!: string;

  @Column({
    type: DataType.STRING,
  })
  review_result!: string;

  @Column({
    type: DataType.ENUM(
      "Not started",
      "In review",
      "Reviewed",
      "Requires follow-up"
    ),
  })
  review_status!:
    | "Not started"
    | "In review"
    | "Reviewed"
    | "Requires follow-up";

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
  })
  reviewer!: number;

  @Column({
    type: DataType.ENUM(
      "Very high risk",
      "High risk",
      "Medium risk",
      "Low risk",
      "Very low risk"
    ),
  })
  risk_status!:
    | "Very high risk"
    | "High risk"
    | "Medium risk"
    | "Low risk"
    | "Very low risk";

  @Column({
    type: DataType.DATE,
  })
  review_date!: Date;

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
