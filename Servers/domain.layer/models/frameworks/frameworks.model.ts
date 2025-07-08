import { Model, Column, DataType, Table } from "sequelize-typescript";
import { IFramework } from "../../interfaces/i.framework";

export interface Framework {
  id?: number;
  name: string;
  description: string;
  created_at: Date;
}

@Table({
  tableName: "frameworks",
})
export class FrameworkModel
  extends Model<FrameworkModel>
  implements IFramework
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
  name!: string;

  @Column({
    type: DataType.STRING,
  })
  description!: string;

  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;
}
