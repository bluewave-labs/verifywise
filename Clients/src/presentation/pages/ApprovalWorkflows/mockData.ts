import { ApprovalStatus } from "../../../domain/enums/aiApprovalWorkflow.enum";
import { ApprovalWorkflowModel } from "../../../domain/models/Common/approvalWorkflow/approvalWorkflow.model";

   export const MOCK_WORKFLOWS: ApprovalWorkflowModel[] = [
        new ApprovalWorkflowModel({
            id: 1,
            type: "approval",
            workflow_title: "Model Deployment Approval",
            entity: 1,
            steps: [
                {
                    step_name: "Initial Review",
                    approver: 1,
                    conditions: 1,
                    description: "Review the model deployment request and initial documentation"
                },
                {
                    step_name: "Technical Validation",
                    approver: 2,
                    conditions: 2,
                    description: "Validate technical requirements and compliance"
                }
            ],
            approval_status: ApprovalStatus.PENDING,
            date_updated: new Date(),
        }),
        new ApprovalWorkflowModel({
            id: 2,
            type: "approval",
            workflow_title: "Risk Assessment Approval",
            entity: 1,
            steps: [
                {
                    step_name: "Risk Analysis",
                    approver: 2,
                    conditions: 1,
                    description: "Analyze potential risks and impacts"
                }
            ],
            approval_status: ApprovalStatus.APPROVED,
            date_updated: new Date(),
        }),
    ];