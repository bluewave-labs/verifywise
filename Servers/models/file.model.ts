import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { UserModel } from "./user.model";
import { ProjectModel } from "./project.model";

export interface File {
  filename: string;
  content: Buffer;
  project_id: number;
  uploaded_by: number;
  uploaded_time: Date;
}

@Table({
  tableName: "files"
})
export class FileModel extends Model<File> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.STRING
  })
  filename!: string;

  @Column({
    type: DataType.BLOB
  })
  content!: Buffer;

  @ForeignKey(() => ProjectModel)
  @Column({
    type: DataType.INTEGER
  })
  project_id!: number;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER
  })
  uploaded_by!: number;

  @Column({
    type: DataType.DATE
  })
  uploaded_time!: Date;

  @Column({
    type: DataType.BOOLEAN,
  })
  is_demo?: boolean;
}
