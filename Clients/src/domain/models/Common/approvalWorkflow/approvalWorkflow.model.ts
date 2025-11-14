import {
    ApprovalStatus,
    // approvalWorkflow,
    // Severity,
} from "../../../enums/approvalWorkflow.enum";

export class ApprovalWorkflowModel {
    id!: number;
    type!: string;
    workflow_title?: string;
    entity_name?: string;
    steps?: string[];
    conditions?: string[];
    approval_status!: ApprovalStatus;
    date_updated?: Date;



    constructor(data: ApprovalWorkflowModel) {
        this.id = data.id;
        this.type = data.type;
        this.workflow_title = data.workflow_title;
        this.entity_name = data.entity_name;
        this.steps = data.steps;
        this.conditions = data.conditions;
        this.approval_status = data.approval_status;
        this.date_updated = data.date_updated;
    }

    static createNewIncident(data: ApprovalWorkflowModel): ApprovalWorkflowModel {
        return new ApprovalWorkflowModel(data);
    }
}
