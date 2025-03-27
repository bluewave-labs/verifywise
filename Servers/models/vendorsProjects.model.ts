import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { ProjectModel } from "./project.model";
import { VendorModel } from "./vendor.model";

export type VendorsProjects = {
  vendor_id: number;
  project_id: number;
};

@Table({
  tableName: "vendor_projects"
})
export class VendorsProjectsModel extends Model<VendorsProjects> {
  @ForeignKey(() => VendorModel)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true
  })
  vendor_id!: number;

  @ForeignKey(() => ProjectModel)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true
  })
  project_id!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  is_demo?: boolean;
}
