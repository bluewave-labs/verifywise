import {
  Table,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";
import { v4 as uuidv4 } from "uuid";
import { UserModel } from "../user/user.model";
import { IPolicy } from "../../interfaces/i.policy";

@Table({
  tableName: "policies",
  timestamps: true,
})
export class PolicyModel extends Model<PolicyModel> implements IPolicy {
  @PrimaryKey
  @Default(() => uuidv4())
  @Column(DataType.UUID)
  id!: string;

  @Column(DataType.STRING)
  title!: string;

  @Default("")
  @Column(DataType.TEXT)
  content_html!: string;

  @Default("Draft")
  @Column(DataType.STRING)
  status!: string;

  @Column(DataType.ARRAY(DataType.STRING))
  tags?: string[];

  @Column(DataType.DATE)
  next_review_date?: Date;

  @ForeignKey(() => UserModel)
  @Column(DataType.UUID)
  author_id!: number;

  @Column(DataType.ARRAY(DataType.UUID))
  assigned_reviewer_ids?: number[];

  @ForeignKey(() => UserModel)
  @Column(DataType.UUID)
  last_updated_by!: number;

  @UpdatedAt
  @Column(DataType.DATE)
  last_updated_at!: Date;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  // Associations
  @BelongsTo(() => UserModel, 'author_id')
  author!: UserModel;

  @BelongsTo(() => UserModel, 'last_updated_by')
  lastUpdatedByUser!: UserModel;

  // Instance methods
  async createPolicy(policyData: any, userId: string): Promise<PolicyModel> {
    const policy = await PolicyModel.create({
      ...policyData,
      author_id: userId,
      last_updated_by: userId,
      status: 'Draft',
    });
    return policy;
  }

  async updatePolicy(policyId: string, policyData: any, userId: string): Promise<PolicyModel | null> {
    const policy = await PolicyModel.findByPk(policyId);
    if (!policy) {
      return null;
    }

    await policy.update({
      ...policyData,
      last_updated_by: userId,
    });

    return policy;
  }
}