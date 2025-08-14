import {
  Table,
  Column,
  DataType,
  Model,
  ForeignKey,
} from "sequelize-typescript";
import { UserModel } from "../user/user.model";
import { IPolicy, PolicyTag } from "../../interfaces/i.policy";

@Table({
  tableName: "policy_manager",
})
export class PolicyManagerModel extends Model<PolicyManagerModel> implements IPolicy {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content_html!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  status!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
  })
  tags?: PolicyTag[];

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  next_review_date?: Date;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  author_id!: number;

  @Column({
    type: DataType.ARRAY(DataType.INTEGER),
    allowNull: true,
  })
  assigned_reviewer_ids?: number[];

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  last_updated_by!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  last_updated_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: Date;

  toJSON(): any {
    return {
      id: this.id,
      title: this.title,
      content_html: this.content_html,
      status: this.status,
      tags: this.tags,
      next_review_date: this.next_review_date,
      author_id: this.author_id,
      assigned_reviewer_ids: this.assigned_reviewer_ids,
      last_updated_by: this.last_updated_by,
      last_updated_at: this.last_updated_at,
    };
  }

  /**
   * Static method to create organization from JSON data
   */
  static fromJSON(json: any): PolicyManagerModel {
    return new PolicyManagerModel(json);
  }
}