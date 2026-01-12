import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import { IApprovalWorkflowStepAttributes } from "../../interfaces/i.approvalWorkflow";
import { ApprovalWorkflowModel } from "./approvalWorkflow.model";
import { ApprovalStepApproversModel } from "./approvalStepApprovers.model";

@Table({
  tableName: "approval_workflow_steps",
  timestamps: false,
  underscored: true,
})
export class ApprovalWorkflowStepModel
  extends Model<ApprovalWorkflowStepModel>
  implements IApprovalWorkflowStepAttributes
{
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @ForeignKey(() => ApprovalWorkflowModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  workflow_id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  step_number!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  step_name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  requires_all_approvers?: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at?: Date;

  @BelongsTo(() => ApprovalWorkflowModel, "workflow_id")
  workflow?: ApprovalWorkflowModel;

  @HasMany(() => ApprovalStepApproversModel, "workflow_step_id")
  approvers?: ApprovalStepApproversModel[];

  toJSON() {
    const values = this.get({ plain: true });
    return values;
  }
}
