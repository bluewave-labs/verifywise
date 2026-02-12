import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { ApprovalRequestModel } from "../domain.layer/models/approvalWorkflow/approvalRequest.model";
import { ApprovalRequestStepModel } from "../domain.layer/models/approvalWorkflow/approvalRequestStep.model";
import { ApprovalWorkflowStepModel } from "../domain.layer/models/approvalWorkflow/approvalWorkflowStep.model";
import { ApprovalRequestStatus, ApprovalStepStatus, ApprovalResult } from "../domain.layer/enums/approval-workflow.enum";

/**
 * Notification info to be sent after transaction commits
 */
export interface NotificationInfo {
  type: 'step_approvers' | 'requester_approved' | 'requester_rejected';
  tenantId: string;
  requestId: number;
  requesterId?: number;
  requestName: string;
  stepNumber?: number;
  // Additional fields for step completion notifications to requester
  completedStep?: number;
  totalSteps?: number;
}

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
  // Create request
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

  // Create request steps from workflow steps
  for (const workflowStep of workflowSteps) {
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

    // Create approval records for each approver
    // Get approvers from the Sequelize model properly
    const approvers = workflowStep.get ? workflowStep.get('approvers') : workflowStep.approvers;

    if (approvers && approvers.length > 0) {
      for (const approver of approvers) {
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
      }
    }
  }

  return request as ApprovalRequestModel;
};

/**
 * Get requests where user is an approver
 */
export const getPendingApprovalsQuery = async (
  userId: number,
  tenantId: string,
  transaction: Transaction | null = null
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
      ...(transaction && { transaction }),
    }
  );

  return requests as any[];
};

/**
 * Get user's own approval requests
 */
export const getMyApprovalRequestsQuery = async (
  userId: number,
  tenantId: string,
  transaction: Transaction | null = null
): Promise<any[]> => {
  const requests = await sequelize.query(
    `SELECT * FROM "${tenantId}".approval_requests
     WHERE requested_by = :userId
     ORDER BY created_at DESC`,
    {
      replacements: { userId },
      mapToModel: true,
      model: ApprovalRequestModel,
      ...(transaction && { transaction }),
    }
  );

  return requests as any[];
};

/**
 * Get approval request by ID with timeline
 */
export const getApprovalRequestByIdQuery = async (
  requestId: number,
  tenantId: string,
  transaction: Transaction | null = null
): Promise<any | null> => {
  // Get approval request with project/use-case/file details and workflow info
  const [requestData] = await sequelize.query(
    `SELECT
      ar.*,
      -- Project/use-case fields
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
      -- File fields
      f.filename as file_name,
      f.size as file_size,
      f.type as file_type,
      f.review_status as file_review_status,
      f.uploaded_time as file_uploaded_time,
      file_uploader.name as file_uploader_name,
      file_uploader.surname as file_uploader_surname,
      -- Common fields
      requester_user.name as requester_name,
      requester_user.surname as requester_surname,
      requester_user.email as requester_email,
      aw.workflow_title as workflow_name
     FROM "${tenantId}".approval_requests ar
     LEFT JOIN "${tenantId}".projects p ON ar.entity_id = p.id AND ar.entity_type = 'use_case'
     LEFT JOIN "${tenantId}".files f ON ar.entity_id = f.id AND ar.entity_type = 'file'
     LEFT JOIN public.users owner_user ON p.owner = owner_user.id
     LEFT JOIN public.users file_uploader ON f.uploaded_by = file_uploader.id
     LEFT JOIN public.users requester_user ON ar.requested_by = requester_user.id
     LEFT JOIN "${tenantId}".approval_workflows aw ON ar.workflow_id = aw.id
     WHERE ar.id = :requestId`,
    {
      replacements: { requestId },
      type: "SELECT",
      ...(transaction && { transaction }),
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
      ...(transaction && { transaction }),
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
        ...(transaction && { transaction }),
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
): Promise<NotificationInfo | null> => {
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

  // Get ALL approvals for this step AFTER the update
  // Query them directly instead of using COUNT to avoid transaction visibility issues
  const allApprovals = await sequelize.query(
    `SELECT approver_id, approval_result
     FROM "${tenantId}".approval_request_step_approvals
     WHERE request_step_id = :requestStepId`,
    {
      replacements: {
        requestStepId: (requestStep as any).id,
      },
      type: "SELECT",
      transaction,
    }
  ) as any[];

  // Count in code instead of SQL to ensure we see the updated values
  const pendingCount = allApprovals.filter((a: any) => a.approval_result === ApprovalResult.PENDING).length;
  const approvedCount = allApprovals.filter((a: any) => a.approval_result === ApprovalResult.APPROVED).length;

  const hasPending = pendingCount > 0;
  const hasApproved = approvedCount > 0;

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

    // ===== FILE STATUS UPDATE AFTER REJECTION =====
    const entityId = (request as any).entity_id;
    const entityType = (request as any).entity_type;

    if (entityType === "file" && entityId) {
      // Update file review_status to 'rejected'
      await sequelize.query(
        `UPDATE "${tenantId}".files
         SET review_status = 'rejected', updated_at = NOW()
         WHERE id = :entityId`,
        {
          replacements: { entityId },
          transaction,
        }
      );
    }

    // Return notification info for requester rejection
    return {
      type: 'requester_rejected',
      tenantId,
      requestId,
      requesterId: (request as any).requested_by,
      requestName: (request as any).request_name,
    };
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
        transaction,
      }
    );

    const stepCount = parseInt((totalSteps[0] as any).count, 10);

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

      // Return notification info for next step approvers AND requester progress update
      return {
        type: 'step_approvers',
        tenantId,
        requestId,
        requesterId: (request as any).requested_by,
        stepNumber: currentStep + 1,
        requestName: (request as any).request_name,
        completedStep: currentStep,
        totalSteps: stepCount,
      };
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

      // Store notification info to be sent after transaction commits
      const notificationInfo: NotificationInfo = {
        type: 'requester_approved',
        tenantId,
        requestId,
        requesterId: (request as any).requested_by,
        requestName: (request as any).request_name,
      };

      // ===== FRAMEWORK CREATION AFTER APPROVAL =====
      // Get the entity (use-case/project) to check if it has pending frameworks
      const entityId = (request as any).entity_id;
      const entityType = (request as any).entity_type;

      if (entityType === "use_case" && entityId) {
        // Get project details with pending frameworks
        const [projectData] = await sequelize.query(
          `SELECT id, pending_frameworks, enable_ai_data_insertion
           FROM "${tenantId}".projects
           WHERE id = :entityId`,
          {
            replacements: { entityId },
            type: "SELECT",
            transaction,
          }
        );

        if (projectData && (projectData as any).pending_frameworks) {
          const pendingFrameworks = (projectData as any).pending_frameworks as number[];
          const enableAiDataInsertion = (projectData as any).enable_ai_data_insertion || false;

          // Import framework creation utilities
          const { createEUFrameworkQuery } = require("./eu.utils");
          const { createISOFrameworkQuery } = require("./iso42001.utils");
          const { createISO27001FrameworkQuery } = require("./iso27001.utils");
          const { createNISTAI_RMFFrameworkQuery } = require("./nistAiRmfCorrect.utils");

          // Create frameworks
          for (const frameworkId of pendingFrameworks) {
            // Create project_framework record FIRST (required by framework creation functions)
            await sequelize.query(
              `INSERT INTO "${tenantId}".projects_frameworks (project_id, framework_id, is_demo)
               VALUES (:project_id, :framework_id, false)`,
              {
                replacements: {
                  project_id: entityId,
                  framework_id: frameworkId,
                },
                transaction,
              }
            );

            // Create framework-specific records
            if (frameworkId === 1) {
              await createEUFrameworkQuery(
                entityId,
                enableAiDataInsertion,
                tenantId,
                transaction
              );
            } else if (frameworkId === 2) {
              await createISOFrameworkQuery(
                entityId,
                enableAiDataInsertion,
                tenantId,
                transaction
              );
            } else if (frameworkId === 3) {
              await createISO27001FrameworkQuery(
                entityId,
                enableAiDataInsertion,
                tenantId,
                transaction
              );
            } else if (frameworkId === 4) {
              await createNISTAI_RMFFrameworkQuery(
                entityId,
                enableAiDataInsertion,
                tenantId,
                transaction
              );
            }
          }

          // Clear pending frameworks after creation
          await sequelize.query(
            `UPDATE "${tenantId}".projects
             SET pending_frameworks = NULL, enable_ai_data_insertion = FALSE
             WHERE id = :entityId`,
            {
              replacements: { entityId },
              transaction,
            }
          );
        }
      }

      // ===== FILE STATUS UPDATE AFTER APPROVAL =====
      if (entityType === "file" && entityId) {
        // Update file review_status to 'approved'
        await sequelize.query(
          `UPDATE "${tenantId}".files
           SET review_status = 'approved', updated_at = NOW()
           WHERE id = :entityId`,
          {
            replacements: { entityId },
            transaction,
          }
        );
      }

      // Return notification info after all processing is done
      return notificationInfo;
    }
  }

  // No notification needed if approval is pending (not all approvers have responded)
  return null;
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
  transaction: Transaction | null = null
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
      ...(transaction && { transaction }),
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
  transaction: Transaction | null = null
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
      ...(transaction && { transaction }),
    }
  );

  const count = parseInt((results[0] as any).count, 10);
  return count > 0;
};

/**
 * Get the approval status for a use-case
 * Returns 'pending', 'rejected', or null if no pending/rejected approval
 */
export const getApprovalStatusQuery = async (
  entityId: number,
  entityType: string,
  tenantId: string,
  transaction: Transaction | null = null
): Promise<'pending' | 'rejected' | null> => {
  const results = await sequelize.query(
    `SELECT status
     FROM "${tenantId}".approval_requests
     WHERE entity_id = :entityId
       AND entity_type = :entityType
       AND status IN (:pendingStatus, :rejectedStatus)
     ORDER BY updated_at DESC
     LIMIT 1`,
    {
      replacements: {
        entityId,
        entityType,
        pendingStatus: ApprovalRequestStatus.PENDING,
        rejectedStatus: ApprovalRequestStatus.REJECTED,
      },
      type: "SELECT",
      ...(transaction && { transaction }),
    }
  ) as any[];

  if (results.length === 0 || !results[0]) {
    return null;
  }

  const status = (results[0] as any).status;
  if (status === ApprovalRequestStatus.PENDING) {
    return 'pending';
  } else if (status === ApprovalRequestStatus.REJECTED) {
    return 'rejected';
  }

  return null;
};

/**
 * Reject an approval request when the associated entity is deleted
 * This is used when a file with a pending approval is deleted
 */
export const rejectApprovalRequestOnEntityDelete = async (
  approvalRequestId: number,
  tenantId: string,
  reason: string = "The associated entity has been deleted."
): Promise<NotificationInfo | null> => {
  const transaction = await sequelize.transaction();

  try {
    // Get the approval request
    const [request] = await sequelize.query(
      `SELECT id, request_name, requested_by, status
       FROM "${tenantId}".approval_requests
       WHERE id = :requestId`,
      {
        replacements: { requestId: approvalRequestId },
        type: "SELECT",
        transaction,
      }
    ) as any[];

    if (!request || request.status !== ApprovalRequestStatus.PENDING) {
      await transaction.rollback();
      return null; // Request doesn't exist or is not pending
    }

    // Update request status to Rejected
    await sequelize.query(
      `UPDATE "${tenantId}".approval_requests
       SET status = :status, updated_at = NOW()
       WHERE id = :requestId`,
      {
        replacements: {
          status: ApprovalRequestStatus.REJECTED,
          requestId: approvalRequestId,
        },
        transaction,
      }
    );

    // Update all pending steps to Rejected
    await sequelize.query(
      `UPDATE "${tenantId}".approval_request_steps
       SET status = :status, date_completed = NOW()
       WHERE request_id = :requestId AND status = :pendingStatus`,
      {
        replacements: {
          status: ApprovalStepStatus.REJECTED,
          requestId: approvalRequestId,
          pendingStatus: ApprovalStepStatus.PENDING,
        },
        transaction,
      }
    );

    // Update all pending step approvals with the rejection reason
    await sequelize.query(
      `UPDATE "${tenantId}".approval_request_step_approvals
       SET status = :status, comments = :reason, date_responded = NOW()
       WHERE request_step_id IN (
         SELECT id FROM "${tenantId}".approval_request_steps WHERE request_id = :requestId
       ) AND status = :pendingStatus`,
      {
        replacements: {
          status: ApprovalResult.REJECTED,
          reason,
          requestId: approvalRequestId,
          pendingStatus: ApprovalResult.PENDING,
        },
        transaction,
      }
    );

    await transaction.commit();

    console.log(`📋 Approval request ${approvalRequestId} rejected: ${reason}`);

    // Return notification info to notify the requester
    return {
      type: 'requester_rejected',
      tenantId,
      requestId: approvalRequestId,
      requesterId: request.requested_by,
      requestName: request.request_name,
    };
  } catch (error) {
    await transaction.rollback();
    console.error(`Failed to reject approval request ${approvalRequestId}:`, error);
    throw error;
  }
};
