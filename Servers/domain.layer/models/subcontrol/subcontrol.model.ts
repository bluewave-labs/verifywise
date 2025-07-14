import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { ControlModel } from "../control/control.model";
import { UserModel } from "../user/user.model";
import { ISubcontrol } from "../../interfaces/i.subcontrol";

@Table({
  tableName: "subcontrols",
})
export class SubcontrolModel
  extends Model<SubcontrolModel>
  implements ISubcontrol
{
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
    type: DataType.ENUM("Waiting", "In progress", "Done"),
  })
  status?: "Waiting" | "In progress" | "Done";

  @ForeignKey(() => UserModel)
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

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
  })
  owner?: number;

  @ForeignKey(() => UserModel)
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

  @Column({
    type: DataType.STRING,
  })
  evidence_description?: string;

  @Column({
    type: DataType.STRING,
  })
  feedback_description?: string;

  @Column({
    type: DataType.JSONB,
  })
  evidence_files?: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[];

  @Column({
    type: DataType.JSONB,
  })
  feedback_files?: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[];

  @ForeignKey(() => ControlModel)
  @Column({
    type: DataType.INTEGER,
  })
  control_id!: number;

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
