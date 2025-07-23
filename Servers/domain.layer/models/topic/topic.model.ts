import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { AssessmentModel } from "../assessment/assessment.model";
import { ITopic } from "../../interfaces/i.topic";

@Table({
  tableName: "topics",
})
export class TopicModel extends Model<TopicModel> implements ITopic {
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
    type: DataType.INTEGER,
  })
  order_no?: number;

  @ForeignKey(() => AssessmentModel)
  @Column({
    type: DataType.INTEGER,
  })
  assessment_id!: number;

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
