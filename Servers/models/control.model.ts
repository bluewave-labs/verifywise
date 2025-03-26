import { Column, DataType, ForeignKey, Model, Table, Validate } from "sequelize-typescript";
import { Subcontrol } from "./subcontrol.model";
import { ControlCategoryModel } from "./controlCategory.model";

/*

This is the new Control model(Schema) and will be replaced with the new one.
Please align other files with this

*/
export type Control = {
  id?: number; // auto generated by database
  title: string; // gets assigned from the structure
  description: string; // gets assigned from the structure
  order_no?: number; // gets assigned from the structure
  status?: "Waiting" | "In progress" | "Done"; // won't get any values, will be filled by user
  approver?: number; // won't get any values, will be filled by user
  risk_review?: "Acceptable risk" | "Residual risk" | "Unacceptable risk"; // won't get any values, will be filled by user
  owner?: number; // won't get any values, will be filled by user
  reviewer?: number; // won't get any values, will be filled by user
  due_date?: Date; // won't get any values, will be filled by user
  implementation_details?: string; // won't get any values, will be filled by user
  control_category_id: number; // when control category is created, its id will be stored and assign here as FK
  numberOfSubcontrols?: number;
  numberOfDoneSubcontrols?: number;
  subControls?: Subcontrol[];
};

@Table({
  tableName: "controls"
})
export class ControlModel extends Model<Control> {
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
    type: DataType.ENUM("Acceptable risk", "Residual risk", "Unacceptable risk"),
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
    defaultValue: false
  })
  is_demo?: boolean;
}
