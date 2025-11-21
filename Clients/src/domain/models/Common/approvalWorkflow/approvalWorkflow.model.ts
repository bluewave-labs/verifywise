import {
    ApprovalStatus,
} from "../../../enums/aiApprovalWorkflow.enum";
import { ApprovalWorkflowStepModel } from "./approvalWorkflowStepModel";

export class ApprovalWorkflowModel {
    id!: number;
    type!: string;
    workflow_title?: string;
    entity?: number;
    steps?: ApprovalWorkflowStepModel[];
    approval_status!: ApprovalStatus;
    date_updated?: Date;

    constructor(data: ApprovalWorkflowModel) {
        this.id = data.id;
        this.type = data.type;
        this.workflow_title = data.workflow_title;
        this.entity = data.entity;
        this.steps = data.steps;
        this.approval_status = data.approval_status;
        this.date_updated = data.date_updated;
    }
}
