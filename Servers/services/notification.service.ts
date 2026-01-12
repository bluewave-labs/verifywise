import redisClient from "../database/redis";
import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";

interface Notification {
  title: string;
  message: string;
  type: "approval_request" | "approval_approved" | "approval_rejected" | "approval_complete";
  entityId: number;
  entityType?: string;
}

/**
 * Send notification to a specific user via Redis Pub/Sub
 * All server instances listening will receive and deliver to connected users
 */
export const sendNotification = async (
  tenantId: string,
  userId: number,
  notification: Notification
): Promise<void> => {
  try {
    console.log(`📤 Publishing notification to Redis:`, {
      tenantId,
      userId,
      type: notification.type,
      title: notification.title
    });

    // Publish to Redis - all server instances will receive
    const result = await redisClient.publish(
      "approval-notifications",
      JSON.stringify({
        tenantId,
        userId,
        notification,
        timestamp: new Date().toISOString(),
      })
    );

    console.log(`✅ Notification published (${result} subscribers received)`);
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    throw error;
  }
};

/**
 * Get all approvers for a specific workflow step
 */
const getApproversForStep = async (
  tenantId: string,
  requestId: number,
  stepNumber: number
): Promise<number[]> => {
  // tenantId is already a hash string, no need to convert
  console.log(`🔍 Fetching approvers for step ${stepNumber}, request ${requestId}, tenant ${tenantId}`);

  const approvers = (await sequelize.query(
    `SELECT DISTINCT asa.approver_id
     FROM "${tenantId}".approval_step_approvers asa
     INNER JOIN "${tenantId}".approval_workflow_steps aws
       ON asa.workflow_step_id = aws.id
     INNER JOIN "${tenantId}".approval_requests ar
       ON aws.workflow_id = ar.workflow_id
     WHERE ar.id = :requestId
       AND aws.step_number = :stepNumber`,
    {
      replacements: { requestId, stepNumber },
      type: QueryTypes.SELECT,
    }
  )) as Array<{ approver_id: number }>;

  console.log(`✅ Found ${approvers.length} approvers:`, approvers.map(a => a.approver_id));
  return approvers.map((a) => a.approver_id);
};

/**
 * Notify all approvers for a specific step of an approval workflow
 */
export const notifyStepApprovers = async (
  tenantId: string,
  requestId: number,
  stepNumber: number,
  requestName: string
): Promise<void> => {
  try {
    // Get approvers for this step
    const approverIds = await getApproversForStep(tenantId, requestId, stepNumber);

    console.log(
      `Notifying ${approverIds.length} approvers for Step ${stepNumber} of request: ${requestName}`
    );

    // Send notification to each approver
    const notificationPromises = approverIds.map((approverId) =>
      sendNotification(tenantId, approverId, {
        title: "New Approval Request",
        message: `${requestName} - You are an approver for Step ${stepNumber}`,
        type: "approval_request",
        entityId: requestId,
        entityType: "use_case",
      })
    );

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error("Error notifying step approvers:", error);
    throw error;
  }
};

/**
 * Notify the requester when their request is fully approved
 */
export const notifyRequesterApproved = async (
  tenantId: string,
  requesterId: number,
  requestId: number,
  requestName: string
): Promise<void> => {
  try {
    await sendNotification(tenantId, requesterId, {
      title: "Request Approved",
      message: `Your request "${requestName}" has been approved`,
      type: "approval_complete",
      entityId: requestId,
    });
  } catch (error) {
    console.error("Error notifying requester of approval:", error);
    throw error;
  }
};

/**
 * Notify the requester when their request is rejected
 */
export const notifyRequesterRejected = async (
  tenantId: string,
  requesterId: number,
  requestId: number,
  requestName: string
): Promise<void> => {
  try {
    await sendNotification(tenantId, requesterId, {
      title: "Request Rejected",
      message: `Your request "${requestName}" has been rejected`,
      type: "approval_rejected",
      entityId: requestId,
    });
  } catch (error) {
    console.error("Error notifying requester of rejection:", error);
    throw error;
  }
};
