import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { ApprovalRequestModel } from "../domain.layer/models/approvalWorkflow/approvalRequest.model";
import { ApprovalRequestStepModel } from "../domain.layer/models/approvalWorkflow/approvalRequestStep.model";
import { ApprovalWorkflowStepModel } from "../domain.layer/models/approvalWorkflow/approvalWorkflowStep.model";
import { ApprovalRequestStatus, ApprovalStepStatus, ApprovalResult } from "../domain.layer/enums/approval-workflow.enum";

/**
 * Create approval request
 */
export const createApprovalRequestQuery = async (
  requestData: {
    request_name: string;
    workflow_id: number;
    entity_id?: number;
    entity_type?: string;
    entity_data?: any;
    status: string;
    requested_by: number;
  },
  workflowSteps: ApprovalWorkflowStepModel[],
  tenantId: string,
  transaction: Transaction
): Promise<ApprovalRequestModel> => {
  console.log("=== createApprovalRequestQuery START ===");
  console.log("tenantId:", tenantId);
  console.log("requestData:", JSON.stringify(requestData, null, 2));
  console.log("workflowSteps count:", workflowSteps.length);
  console.log("workflowSteps:", JSON.stringify(workflowSteps, null, 2));

  // Create request
  console.log("Creating approval request in database...");
  const [request] = await sequelize.query(
    `INSERT INTO "${tenantId}".approval_requests
     (request_name, workflow_id, entity_id, entity_type, entity_data, status, requested_by, current_step, created_at, updated_at)
     VALUES (:request_name, :workflow_id, :entity_id, :entity_type, :entity_data, :status, :requested_by, 1, NOW(), NOW())
     RETURNING *`,
    {
      replacements: {
        request_name: requestData.request_name,
        workflow_id: requestData.workflow_id,
        entity_id: requestData.entity_id || null,
        entity_type: requestData.entity_type || null,
        entity_data: requestData.entity_data ? JSON.stringify(requestData.entity_data) : null,
        status: requestData.status,
        requested_by: requestData.requested_by,
      },
      mapToModel: true,
      model: ApprovalRequestModel,
      transaction,
    }
  );

  console.log("Approval request created with ID:", (request as any).id);
  console.log("Request object:", JSON.stringify(request, null, 2));

  // Create request steps from workflow steps
  console.log(`Creating ${workflowSteps.length} request steps...`);
  for (const workflowStep of workflowSteps) {
    console.log(`Processing workflow step:`, JSON.stringify(workflowStep, null, 2));

    const [requestStep] = await sequelize.query(
      `INSERT INTO "${tenantId}".approval_request_steps
       (request_id, step_number, step_name, status, date_assigned, created_at)
       VALUES (:request_id, :step_number, :step_name, :status, NOW(), NOW())
       RETURNING *`,
      {
        replacements: {
          request_id: (request as any).id,
          step_number: workflowStep.step_number,
          step_name: workflowStep.step_name,
          status: workflowStep.step_number === 1 ? ApprovalStepStatus.PENDING : ApprovalStepStatus.PENDING,
        },
        mapToModel: true,
        model: ApprovalRequestStepModel,
        transaction,
      }
    );

    console.log(`Request step created with ID:`, (requestStep as any).id);
    console.log(`Request step object:`, JSON.stringify(requestStep, null, 2));

    // Create approval records for each approver
    // Get approvers from the Sequelize model properly
    const approvers = workflowStep.get ? workflowStep.get('approvers') : workflowStep.approvers;
    console.log(`Creating ${approvers?.length || 0} approver records for step ${workflowStep.step_number}...`);
    console.log(`Approvers:`, JSON.stringify(approvers, null, 2));

    if (approvers && approvers.length > 0) {
      for (const approver of approvers) {
        console.log(`  Creating approval record for approver ${approver.approver_id}`);
        await sequelize.query(
          `INSERT INTO "${tenantId}".approval_request_step_approvals
           (request_step_id, approver_id, approval_result, created_at)
           VALUES (:request_step_id, :approver_id, :approval_result, NOW())`,
          {
            replacements: {
              request_step_id: (requestStep as any).id,
              approver_id: approver.approver_id,
              approval_result: ApprovalResult.PENDING,
            },
            transaction,
          }
        );
        console.log(`  Approval record created for approver ${approver.approver_id}`);
      }
    } else {
      console.log(`  WARNING: No approvers found for step ${workflowStep.step_number}!`);
    }
  }

  console.log("All approval request steps and approver records created successfully!");
  console.log("=== createApprovalRequestQuery END ===");

  return request as ApprovalRequestModel;
};

/**
 * Get requests where user is an approver
 */
export const getPendingApprovalsQuery = async (
  userId: number,
  tenantId: string
): Promise<any[]> => {
  const requests = await sequelize.query(
    `SELECT DISTINCT
       ar.id,
       ar.request_name,
       ar.workflow_id,
       ar.entity_id,
       ar.entity_type,
       ar.status,
       ar.requested_by,
       ar.current_step,
       ar.created_at,
       ar.updated_at
     FROM "${tenantId}".approval_requests ar
     JOIN "${tenantId}".approval_request_steps ars ON ar.id = ars.request_id
     JOIN "${tenantId}".approval_request_step_approvals arsa ON ars.id = arsa.request_step_id
     WHERE arsa.approver_id = :userId
       AND ars.step_number = ar.current_step
       AND ar.status = :status
     ORDER BY ar.created_at DESC`,
    {
      replacements: {
        userId,
        status: ApprovalRequestStatus.PENDING,
      },
      type: "SELECT",
    }
  );

  return requests as any[];
};

/**
 * Get user's own approval requests
 */
export const getMyApprovalRequestsQuery = async (
  userId: number,
  tenantId: string
): Promise<any[]> => {
  const requests = await sequelize.query(
    `SELECT * FROM "${tenantId}".approval_requests
     WHERE requested_by = :userId
     ORDER BY created_at DESC`,
    {
      replacements: { userId },
      mapToModel: true,
      model: ApprovalRequestModel,
    }
  );

  return requests as any[];
};

/**
 * Get approval request by ID with timeline
 */
export const getApprovalRequestByIdQuery = async (
  requestId: number,
  tenantId: string
): Promise<any | null> => {
  // Get approval request with project/use-case details and workflow info
  const [requestData] = await sequelize.query(
    `SELECT
      ar.*,
      p.project_title,
      p.uc_id,
      p.description as project_description,
      p.owner as project_owner_id,
      p.status as project_status,
      p.goal,
      p.target_industry,
      p.ai_risk_classification,
      p.type_of_high_risk_role,
      p.start_date,
      p.geography,
      owner_user.name as owner_name,
      owner_user.surname as owner_surname,
      owner_user.email as owner_email,
      requester_user.name as requester_name,
      requester_user.surname as requester_surname,
      requester_user.email as requester_email,
      aw.workflow_title as workflow_name
     FROM "${tenantId}".approval_requests ar
     LEFT JOIN "${tenantId}".projects p ON ar.entity_id = p.id AND ar.entity_type = 'use_case'
     LEFT JOIN public.users owner_user ON p.owner = owner_user.id
     LEFT JOIN public.users requester_user ON ar.requested_by = requester_user.id
     LEFT JOIN "${tenantId}".approval_workflows aw ON ar.workflow_id = aw.id
     WHERE ar.id = :requestId`,
    {
      replacements: { requestId },
      type: "SELECT",
    }
  );

  if (!requestData) {
    return null;
  }

  const request = requestData as any;

  // Load steps
  const steps = await sequelize.query(
    `SELECT * FROM "${tenantId}".approval_request_steps
     WHERE request_id = :requestId
     ORDER BY step_number ASC`,
    {
      replacements: { requestId },
      mapToModel: true,
      model: ApprovalRequestStepModel,
    }
  );

  // Load approvals for each step
  for (const step of steps) {
    const approvals = await sequelize.query(
      `SELECT arsa.*, u.name, u.surname, u.email
       FROM "${tenantId}".approval_request_step_approvals arsa
       JOIN public.users u ON arsa.approver_id = u.id
       WHERE arsa.request_step_id = :stepId`,
      {
        replacements: { stepId: (step as any).id },
        type: "SELECT",
      }
    );
    (step as any).approvals = approvals;
  }

  request.steps = steps;

  return request;
};

/**
 * Approve or reject a request step
 */
export const processApprovalQuery = async (
  requestId: number,
  userId: number,
  approvalResult: ApprovalResult,
  comments: string | undefined,
  tenantId: string,
  transaction: Transaction
): Promise<void> => {
  // Get current request
  const [request] = await sequelize.query(
    `SELECT * FROM "${tenantId}".approval_requests WHERE id = :requestId`,
    {
      replacements: { requestId },
      mapToModel: true,
      model: ApprovalRequestModel,
      transaction,
    }
  );

  if (!request) {
    throw new Error("Request not found");
  }

  const currentStep = (request as any).current_step;

  // Get current step
  const [requestStep] = await sequelize.query(
    `SELECT * FROM "${tenantId}".approval_request_steps
     WHERE request_id = :requestId AND step_number = :stepNumber`,
    {
      replacements: { requestId, stepNumber: currentStep },
      mapToModel: true,
      model: ApprovalRequestStepModel,
      transaction,
    }
  );

  if (!requestStep) {
    throw new Error("Request step not found");
  }

  // Update approval record
  await sequelize.query(
    `UPDATE "${tenantId}".approval_request_step_approvals
     SET approval_result = :approvalResult,
         comments = :comments,
         approved_at = NOW()
     WHERE request_step_id = :requestStepId
       AND approver_id = :userId`,
    {
      replacements: {
        requestStepId: (requestStep as any).id,
        userId,
        approvalResult,
        comments: comments || null,
      },
      transaction,
    }
  );

  // Get the workflow step to check requires_all_approvers
  const [workflowStep] = await sequelize.query(
    `SELECT aws.requires_all_approvers
     FROM "${tenantId}".approval_workflow_steps aws
     JOIN "${tenantId}".approval_request_steps ars ON ars.step_number = aws.step_number
     WHERE ars.id = :requestStepId
       AND aws.workflow_id = (
         SELECT workflow_id FROM "${tenantId}".approval_requests WHERE id = :requestId
       )`,
    {
      replacements: {
        requestStepId: (requestStep as any).id,
        requestId,
      },
      type: "SELECT",
      transaction,
    }
  );

  const requiresAllApprovers = workflowStep ? (workflowStep as any).requires_all_approvers : true;

  // Check if all approvers for this step have responded
  const pendingApprovals = await sequelize.query(
    `SELECT COUNT(*) as count
     FROM "${tenantId}".approval_request_step_approvals
     WHERE request_step_id = :requestStepId
       AND approval_result = :pending`,
    {
      replacements: {
        requestStepId: (requestStep as any).id,
        pending: ApprovalResult.PENDING,
      },
      type: "SELECT",
    }
  );

  const hasPending = (pendingApprovals[0] as any).count > 0;

  // Check if at least one approver has approved (for "Any" condition)
  const approvedCount = await sequelize.query(
    `SELECT COUNT(*) as count
     FROM "${tenantId}".approval_request_step_approvals
     WHERE request_step_id = :requestStepId
       AND approval_result = :approved`,
    {
      replacements: {
        requestStepId: (requestStep as any).id,
        approved: ApprovalResult.APPROVED,
      },
      type: "SELECT",
    }
  );

  const hasApproved = (approvedCount[0] as any).count > 0;

  // Determine if step should be completed based on requires_all_approvers setting
  const shouldComplete = requiresAllApprovers
    ? !hasPending  // All approvers must respond
    : hasApproved; // At least one approver must approve

  // If rejected, mark step and request as rejected
  if (approvalResult === ApprovalResult.REJECTED) {
    await sequelize.query(
      `UPDATE "${tenantId}".approval_request_steps
       SET status = :status, date_completed = NOW()
       WHERE id = :requestStepId`,
      {
        replacements: {
          requestStepId: (requestStep as any).id,
          status: ApprovalStepStatus.REJECTED,
        },
        transaction,
      }
    );

    await sequelize.query(
      `UPDATE "${tenantId}".approval_requests
       SET status = :status, updated_at = NOW()
       WHERE id = :requestId`,
      {
        replacements: {
          requestId,
          status: ApprovalRequestStatus.REJECTED,
        },
        transaction,
      }
    );
  }
  // If approved and conditions met (all/any), move to next step or complete
  else if (approvalResult === ApprovalResult.APPROVED && shouldComplete) {
    await sequelize.query(
      `UPDATE "${tenantId}".approval_request_steps
       SET status = :status, date_completed = NOW()
       WHERE id = :requestStepId`,
      {
        replacements: {
          requestStepId: (requestStep as any).id,
          status: ApprovalStepStatus.COMPLETED,
        },
        transaction,
      }
    );

    // Check if there are more steps
    const totalSteps = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${tenantId}".approval_request_steps WHERE request_id = :requestId`,
      {
        replacements: { requestId },
        type: "SELECT",
      }
    );

    const stepCount = (totalSteps[0] as any).count;

    if (currentStep < stepCount) {
      // Move to next step
      await sequelize.query(
        `UPDATE "${tenantId}".approval_requests
         SET current_step = :nextStep, updated_at = NOW()
         WHERE id = :requestId`,
        {
          replacements: {
            requestId,
            nextStep: currentStep + 1,
          },
          transaction,
        }
      );
    } else {
      // All steps completed - mark as approved
      await sequelize.query(
        `UPDATE "${tenantId}".approval_requests
         SET status = :status, updated_at = NOW()
         WHERE id = :requestId`,
        {
          replacements: {
            requestId,
            status: ApprovalRequestStatus.APPROVED,
          },
          transaction,
        }
      );
    }
  }
};

/**
 * Withdraw approval request
 */
export const withdrawApprovalRequestQuery = async (
  requestId: number,
  tenantId: string,
  transaction: Transaction
): Promise<void> => {
  await sequelize.query(
    `UPDATE "${tenantId}".approval_requests
     SET status = :status, updated_at = NOW()
     WHERE id = :requestId`,
    {
      replacements: {
        requestId,
        status: ApprovalRequestStatus.WITHDRAWN,
      },
      transaction,
    }
  );
};

/**
 * Get pending approval request ID by entity
 */
export const getPendingApprovalRequestIdQuery = async (
  entityId: number,
  entityType: string,
  tenantId: string,
  transaction?: Transaction
): Promise<number | null> => {
  const results = await sequelize.query(
    `SELECT id
     FROM "${tenantId}".approval_requests
     WHERE entity_id = :entityId
       AND entity_type = :entityType
       AND status = :status
     LIMIT 1`,
    {
      replacements: {
        entityId,
        entityType,
        status: ApprovalRequestStatus.PENDING,
      },
      type: "SELECT",
      transaction,
    }
  );

  if (results && results.length > 0) {
    return (results[0] as any).id;
  }
  return null;
};

/**
 * Check if an entity has a pending approval request
 */
export const hasPendingApprovalQuery = async (
  entityId: number,
  entityType: string,
  tenantId: string,
  transaction?: Transaction
): Promise<boolean> => {
  const results = await sequelize.query(
    `SELECT COUNT(*) as count
     FROM "${tenantId}".approval_requests
     WHERE entity_id = :entityId
       AND entity_type = :entityType
       AND status = :status`,
    {
      replacements: {
        entityId,
        entityType,
        status: ApprovalRequestStatus.PENDING,
      },
      type: "SELECT",
      transaction,
    }
  );

  const hasPending = (results[0] as any).count > 0;
  return hasPending;
};
