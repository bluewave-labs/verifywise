/**
 * @fileoverview Approval Request Controller
 *
 * Handles approval request operations for use-case and project approval flows.
 * Manages request lifecycle including creation, approval, rejection, and withdrawal.
 *
 * Key Features:
 * - Request creation and tracking
 * - Step-based approval process
 * - Multiple approvers per step
 * - Requestor and approver views
 * - Withdraw functionality
 *
 * @module controllers/approvalRequest
 */

import { Request, Response } from "express";
import { sequelize } from "../database/db";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { logStructured } from "../utils/logger/fileLogger";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";
import {
  createApprovalRequestQuery,
  getMyApprovalRequestsQuery,
  getPendingApprovalsQuery,
  getApprovalRequestByIdQuery,
  processApprovalQuery,
  withdrawApprovalRequestQuery,
} from "../utils/approvalRequest.utils";
// SSE notifications disabled for now - can be re-enabled later if needed
// import { notifyRequesterRejected, notifyStepApprovers, notifyRequesterApproved } from "../services/notification.service";
import { getApprovalWorkflowByIdQuery, getWorkflowStepsQuery } from "../utils/approvalWorkflow.utils";
import { ApprovalResult } from "../domain.layer/enums/approval-workflow.enum";

/**
 * Create new approval request
 * @route POST /api/approval-requests
 * @access All authenticated users
 */
export async function createApprovalRequest(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();

  logStructured(
    "processing",
    "creating approval request",
    "createApprovalRequest",
    "approvalRequest.ctrl.ts"
  );

  try {
    const { userId, tenantId } = req;
    const { request_name, workflow_id, entity_id, entity_type, entity_data } =
      req.body;

    if (!userId || !tenantId) {
      await transaction.rollback();
      return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
    }

    // Validation
    if (!request_name?.trim()) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]("Request name is required"));
    }

    if (!workflow_id) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]("Workflow ID is required"));
    }

    // Get workflow and steps
    const workflow = await getApprovalWorkflowByIdQuery(
      workflow_id,
      tenantId,
      transaction
    );

    if (!workflow) {
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Workflow not found"));
    }

    const workflowSteps = await getWorkflowStepsQuery(
      workflow_id,
      tenantId,
      transaction
    );

    if (!workflowSteps || workflowSteps.length === 0) {
      await transaction.rollback();
      return res
        .status(400)
        .json(STATUS_CODE[400]("Workflow must have at least one step"));
    }

    // Create request
    const request = await createApprovalRequestQuery(
      {
        request_name,
        workflow_id,
        entity_id,
        entity_type,
        entity_data,
        status: "Pending",
        requested_by: userId,
      },
      workflowSteps,
      tenantId,
      transaction
    );

    await transaction.commit();

    logStructured(
      "successful",
      `created approval request ${request.id}`,
      "createApprovalRequest",
      "approvalRequest.ctrl.ts"
    );

    return res.status(201).json(STATUS_CODE[201](request.toJSON()));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      "failed to create approval request",
      "createApprovalRequest",
      "approvalRequest.ctrl.ts"
    );

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get user's own approval requests
 * @route GET /api/approval-requests/my-requests
 * @access All authenticated users
 */
export async function getMyApprovalRequests(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "fetching my approval requests",
    "getMyApprovalRequests",
    "approvalRequest.ctrl.ts"
  );

  try {
    const { userId, tenantId } = req;

    if (!userId || !tenantId) {
      return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
    }

    const requests = await getMyApprovalRequestsQuery(userId, tenantId);

    logStructured(
      "successful",
      `fetched ${requests.length} requests`,
      "getMyApprovalRequests",
      "approvalRequest.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200](requests));
  } catch (error) {
    logStructured(
      "error",
      "failed to fetch my requests",
      "getMyApprovalRequests",
      "approvalRequest.ctrl.ts"
    );
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get pending approval requests for current user
 * @route GET /api/approval-requests/pending-approvals
 * @access All authenticated users
 */
export async function getPendingApprovals(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "fetching pending approvals",
    "getPendingApprovals",
    "approvalRequest.ctrl.ts"
  );

  try {
    const { userId, tenantId } = req;

    if (!userId || !tenantId) {
      return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
    }

    const requests = await getPendingApprovalsQuery(userId, tenantId);

    logStructured(
      "successful",
      `fetched ${requests.length} pending approvals`,
      "getPendingApprovals",
      "approvalRequest.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200](requests));
  } catch (error) {
    logStructured(
      "error",
      "failed to fetch pending approvals",
      "getPendingApprovals",
      "approvalRequest.ctrl.ts"
    );
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get approval request by ID with timeline
 * @route GET /api/approval-requests/:id
 * @access All authenticated users (must be requestor or approver)
 */
export async function getApprovalRequestById(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "fetching approval request by ID",
    "getApprovalRequestById",
    "approvalRequest.ctrl.ts"
  );

  try {
    const { userId, tenantId } = req;
    const { id } = req.params;

    if (!userId || !tenantId) {
      return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
    }

    const requestId = parseInt(id, 10);
    if (isNaN(requestId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid request ID"));
    }

    const request = await getApprovalRequestByIdQuery(requestId, tenantId);

    if (!request) {
      return res.status(404).json(STATUS_CODE[404]("Request not found"));
    }

    logStructured(
      "successful",
      `fetched approval request ${requestId}`,
      "getApprovalRequestById",
      "approvalRequest.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200](request));
  } catch (error) {
    logStructured(
      "error",
      "failed to fetch approval request",
      "getApprovalRequestById",
      "approvalRequest.ctrl.ts"
    );
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Approve a request
 * @route POST /api/approval-requests/:id/approve
 * @access Approvers only
 */
export async function approveRequest(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();

  logStructured(
    "processing",
    "approving request",
    "approveRequest",
    "approvalRequest.ctrl.ts"
  );

  try {
    const { userId, tenantId } = req;
    const { id } = req.params;
    const { comments } = req.body;

    if (!userId || !tenantId) {
      await transaction.rollback();
      return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
    }

    const requestId = parseInt(id, 10);
    if (isNaN(requestId)) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]("Invalid request ID"));
    }

    // Process the approval (SSE notifications disabled, so we ignore the return value)
    await processApprovalQuery(
      requestId,
      userId,
      ApprovalResult.APPROVED,
      comments,
      tenantId,
      transaction
    );

    await transaction.commit();

    logStructured(
      "successful",
      `approved request ${requestId}`,
      "approveRequest",
      "approvalRequest.ctrl.ts"
    );

    // SSE notifications disabled for now - can be re-enabled later if needed
    // if (notificationInfo) {
    //   if (notificationInfo.type === 'step_approvers') {
    //     notifyStepApprovers(
    //       notificationInfo.tenantId,
    //       notificationInfo.requestId,
    //       notificationInfo.stepNumber!,
    //       notificationInfo.requestName
    //     ).catch(error => {
    //       console.error("Error sending step approvers notification:", error);
    //     });
    //   } else if (notificationInfo.type === 'requester_approved') {
    //     notifyRequesterApproved(
    //       notificationInfo.tenantId,
    //       notificationInfo.requesterId!,
    //       notificationInfo.requestId,
    //       notificationInfo.requestName
    //     ).catch(error => {
    //       console.error("Error sending requester approved notification:", error);
    //     });
    //   }
    // }

    return res
      .status(200)
      .json(STATUS_CODE[200]({ message: "Request approved successfully" }));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      "failed to approve request",
      "approveRequest",
      "approvalRequest.ctrl.ts"
    );
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Reject a request
 * @route POST /api/approval-requests/:id/reject
 * @access Approvers only
 */
export async function rejectRequest(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();

  logStructured(
    "processing",
    "rejecting request",
    "rejectRequest",
    "approvalRequest.ctrl.ts"
  );

  try {
    const { userId, tenantId } = req;
    const { id } = req.params;
    const { comments } = req.body;

    if (!userId || !tenantId) {
      await transaction.rollback();
      return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
    }

    const requestId = parseInt(id, 10);
    if (isNaN(requestId)) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]("Invalid request ID"));
    }

    // Process the rejection (SSE notifications disabled, so we ignore the return value)
    await processApprovalQuery(
      requestId,
      userId,
      ApprovalResult.REJECTED,
      comments,
      tenantId,
      transaction
    );

    await transaction.commit();

    logStructured(
      "successful",
      `rejected request ${requestId}`,
      "rejectRequest",
      "approvalRequest.ctrl.ts"
    );

    // SSE notifications disabled for now - can be re-enabled later if needed
    // if (notificationInfo && notificationInfo.type === 'requester_rejected') {
    //   notifyRequesterRejected(
    //     notificationInfo.tenantId,
    //     notificationInfo.requesterId!,
    //     notificationInfo.requestId,
    //     notificationInfo.requestName
    //   ).catch(error => {
    //     console.error("Error sending requester rejected notification:", error);
    //   });
    // }

    return res
      .status(200)
      .json(STATUS_CODE[200]({ message: "Request rejected successfully" }));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      "failed to reject request",
      "rejectRequest",
      "approvalRequest.ctrl.ts"
    );
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Withdraw a request
 * @route POST /api/approval-requests/:id/withdraw
 * @access Requestor only
 */
export async function withdrawRequest(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();

  logStructured(
    "processing",
    "withdrawing request",
    "withdrawRequest",
    "approvalRequest.ctrl.ts"
  );

  try {
    const { userId, tenantId } = req;
    const { id } = req.params;

    if (!userId || !tenantId) {
      await transaction.rollback();
      return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
    }

    const requestId = parseInt(id, 10);
    if (isNaN(requestId)) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]("Invalid request ID"));
    }

    // Verify user is the requestor
    const request = await getApprovalRequestByIdQuery(requestId, tenantId, transaction);
    if (!request || request.requested_by !== userId) {
      await transaction.rollback();
      return res
        .status(403)
        .json(
          STATUS_CODE[403]("Only the requestor can withdraw this request")
        );
    }

    await withdrawApprovalRequestQuery(requestId, tenantId, transaction);

    await transaction.commit();

    logStructured(
      "successful",
      `withdrew request ${requestId}`,
      "withdrawRequest",
      "approvalRequest.ctrl.ts"
    );

    return res
      .status(200)
      .json(STATUS_CODE[200]({ message: "Request withdrawn successfully" }));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      "failed to withdraw request",
      "withdrawRequest",
      "approvalRequest.ctrl.ts"
    );
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get all approval requests (admin view)
 * @route GET /api/approval-requests
 * @access Admin only
 */
export async function getAllApprovalRequests(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "fetching all approval requests",
    "getAllApprovalRequests",
    "approvalRequest.ctrl.ts"
  );

  try {
    const { tenantId } = req;

    if (!tenantId) {
      return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
    }

    const requests = await sequelize.query(
      `SELECT * FROM "${tenantId}".approval_requests ORDER BY created_at DESC`,
      {
        type: "SELECT",
      }
    );

    logStructured(
      "successful",
      `fetched ${requests.length} requests`,
      "getAllApprovalRequests",
      "approvalRequest.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200](requests));
  } catch (error) {
    logStructured(
      "error",
      "failed to fetch all requests",
      "getAllApprovalRequests",
      "approvalRequest.ctrl.ts"
    );
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
