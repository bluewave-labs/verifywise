import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { TopicModel } from "../topic/topic.model";
import { ISubtopic } from "../../interfaces/i.subtopic";

@Table({
  tableName: "subtopics",
})
export class SubtopicModel extends Model<SubtopicModel> implements ISubtopic {
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

  @ForeignKey(() => TopicModel)
  @Column({
    type: DataType.INTEGER,
  })
  topic_id!: number;

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
