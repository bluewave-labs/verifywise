export class ApprovalWorkflowStepModel {
    step_name?: string;
    approver?: string;
    conditions?: string;
    description?: string;

    constructor(data?: ApprovalWorkflowStepModel) {
        this.step_name = data?.step_name;
        this.approver = data?.approver;
        this.conditions = data?.conditions;
        this.description = data?.description;
    }
}