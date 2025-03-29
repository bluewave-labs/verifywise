import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Control } from "./control.model";
import { ProjectModel } from "./project.model";

/*

This is the new ControlCategory model(Schema) and will be replaced with the new one.
Please align other files with this

*/
export type ControlCategory = {
  id?: number; //automatically created by database
  project_id: number; // FK to the project table
  title: string; // gets assigned from the structure
  order_no?: number; // gets assigned from the structure
  controls?: Control[];
  created_at?: Date;
};

@Table({
  tableName: "control_categories"
})
export class ControlCategoryModel extends Model<ControlCategory> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @ForeignKey(() => ProjectModel)
  @Column({
    type: DataType.INTEGER,
  })
  project_id!: number;

  @Column({
    type: DataType.STRING,
  })
  title!: string;

  @Column({
    type: DataType.INTEGER,
  })
  order_no?: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  is_demo?: boolean;

  @Column({
    type: DataType.DATE
  })
  created_at?: Date;
}