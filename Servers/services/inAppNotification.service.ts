import redisClient from "../database/redis";
import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";
import {
  createNotificationQuery,
  createBulkNotificationsQuery,
} from "../utils/notification.utils";
import {
  ICreateNotification,
  IBulkNotification,
  INotificationJSON,
  NotificationType,
  NotificationEntityType,
  IEmailNotificationConfig,
} from "../domain.layer/interfaces/i.notification";
import { notificationService } from "./notificationService";
import { EMAIL_TEMPLATES } from "../constants/emailTemplates";

/**
 * Send a notification to a user via both in-app storage and real-time SSE
 * Optionally also sends an email notification
 */
export const sendInAppNotification = async (
  tenantId: string,
  notification: ICreateNotification,
  sendEmailNotification?: boolean,
  emailConfig?: IEmailNotificationConfig
): Promise<INotificationJSON> => {
  try {
    // 1. Store notification in database
    const storedNotification = await createNotificationQuery(notification, tenantId);

    // 2. Publish to Redis for real-time delivery
    await redisClient.publish(
      "in-app-notifications",
      JSON.stringify({
        tenantId,
        userId: notification.user_id,
        notification: storedNotification,
        timestamp: new Date().toISOString(),
      })
    );

    console.log(`📤 In-app notification sent to user ${notification.user_id}: ${notification.title}`);

    // 3. Optionally send email notification using existing NotificationService (with rate limiting)
    if (sendEmailNotification && emailConfig) {
      try {
        // Get user email
        const user = await getUserEmail(notification.user_id);
        if (user?.email) {
          await notificationService.sendEmailWithTemplate(
            user.email,
            emailConfig.subject,
            emailConfig.template,
            emailConfig.variables
          );
          console.log(`📧 Email notification sent to ${user.email}`);
        }
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the whole notification if email fails
      }
    }

    return storedNotification;
  } catch (error) {
    console.error("❌ Error sending in-app notification:", error);
    throw error;
  }
};

/**
 * Send bulk notifications to multiple users
 */
export const sendBulkInAppNotifications = async (
  tenantId: string,
  bulk: IBulkNotification,
  sendEmailNotification?: boolean,
  emailConfig?: IEmailNotificationConfig
): Promise<INotificationJSON[]> => {
  try {
    // 1. Store all notifications in database
    const storedNotifications = await createBulkNotificationsQuery(bulk, tenantId);

    // 2. Publish each to Redis for real-time delivery
    for (const notification of storedNotifications) {
      await redisClient.publish(
        "in-app-notifications",
        JSON.stringify({
          tenantId,
          userId: notification.user_id,
          notification,
          timestamp: new Date().toISOString(),
        })
      );
    }

    console.log(`📤 Bulk notifications sent to ${bulk.user_ids.length} users: ${bulk.title}`);

    // 3. Optionally send email notifications using existing NotificationService (with rate limiting)
    if (sendEmailNotification && emailConfig) {
      const users = await getUserEmails(bulk.user_ids);
      for (const user of users) {
        try {
          await notificationService.sendEmailWithTemplate(
            user.email,
            emailConfig.subject,
            emailConfig.template,
            {
              ...emailConfig.variables,
              recipient_name: `${user.name} ${user.surname}`,
            }
          );
        } catch (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
        }
      }
    }

    return storedNotifications;
  } catch (error) {
    console.error("❌ Error sending bulk notifications:", error);
    throw error;
  }
};

/**
 * Notify task assignment
 */
export const notifyTaskAssigned = async (
  tenantId: string,
  assigneeId: number,
  task: {
    id: number;
    title: string;
    description?: string;
    priority: string;
    due_date?: string;
  },
  assignerName: string,
  baseUrl: string
): Promise<void> => {
  const assignee = await getUserById(assigneeId);

  await sendInAppNotification(
    tenantId,
    {
      user_id: assigneeId,
      type: NotificationType.TASK_ASSIGNED,
      title: "New task assigned",
      message: `${assignerName} assigned you to: ${task.title}`,
      entity_type: NotificationEntityType.TASK,
      entity_id: task.id,
      entity_name: task.title,
      action_url: `/tasks?taskId=${task.id}`,
    },
    true,
    {
      template: EMAIL_TEMPLATES.TASK_ASSIGNED,
      subject: `New task assigned: ${task.title}`,
      variables: {
        assignee_name: assignee ? `${assignee.name}` : "User",
        assigner_name: assignerName,
        task_title: task.title,
        task_description: task.description || "No description provided",
        task_priority: task.priority,
        task_due_date: task.due_date || "No due date",
        task_url: `${baseUrl}/tasks?taskId=${task.id}`,
      },
    }
  );
};

/**
 * Notify review requested
 */
export const notifyReviewRequested = async (
  tenantId: string,
  reviewerId: number,
  entity: {
    type: NotificationEntityType;
    id: number;
    name: string;
    projectName: string;
  },
  requesterName: string,
  message: string,
  baseUrl: string
): Promise<void> => {
  const reviewer = await getUserById(reviewerId);
  const entityTypeLabel = entity.type.replace("_", " ");

  await sendInAppNotification(
    tenantId,
    {
      user_id: reviewerId,
      type: NotificationType.REVIEW_REQUESTED,
      title: "Review requested",
      message: `${requesterName} requested your review on ${entity.name}`,
      entity_type: entity.type,
      entity_id: entity.id,
      entity_name: entity.name,
      action_url: `/${entity.type}s/${entity.id}`,
    },
    true,
    {
      template: EMAIL_TEMPLATES.REVIEW_REQUESTED,
      subject: `Review requested: ${entity.name}`,
      variables: {
        reviewer_name: reviewer ? `${reviewer.name}` : "Reviewer",
        requester_name: requesterName,
        entity_type: entityTypeLabel,
        entity_name: entity.name,
        project_name: entity.projectName,
        review_message: message || "Please review this item.",
        review_url: `${baseUrl}/${entity.type}s/${entity.id}`,
      },
    }
  );
};

/**
 * Notify review approved
 */
export const notifyReviewApproved = async (
  tenantId: string,
  ownerId: number,
  entity: {
    type: NotificationEntityType;
    id: number;
    name: string;
    projectName: string;
  },
  reviewerName: string,
  comment: string,
  baseUrl: string
): Promise<void> => {
  const owner = await getUserById(ownerId);
  const entityTypeLabel = entity.type.replace("_", " ");

  await sendInAppNotification(
    tenantId,
    {
      user_id: ownerId,
      type: NotificationType.REVIEW_APPROVED,
      title: "Review approved",
      message: `${reviewerName} approved your ${entityTypeLabel}: ${entity.name}`,
      entity_type: entity.type,
      entity_id: entity.id,
      entity_name: entity.name,
      action_url: `/${entity.type}s/${entity.id}`,
    },
    true,
    {
      template: EMAIL_TEMPLATES.REVIEW_APPROVED,
      subject: `Approved: ${entity.name}`,
      variables: {
        owner_name: owner ? `${owner.name}` : "User",
        reviewer_name: reviewerName,
        entity_type: entityTypeLabel,
        entity_name: entity.name,
        project_name: entity.projectName,
        review_comment: comment || "Looks good!",
        entity_url: `${baseUrl}/${entity.type}s/${entity.id}`,
      },
    }
  );
};

/**
 * Notify review rejected (changes requested)
 */
export const notifyReviewRejected = async (
  tenantId: string,
  ownerId: number,
  entity: {
    type: NotificationEntityType;
    id: number;
    name: string;
    projectName: string;
  },
  reviewerName: string,
  comment: string,
  baseUrl: string
): Promise<void> => {
  const owner = await getUserById(ownerId);
  const entityTypeLabel = entity.type.replace("_", " ");

  await sendInAppNotification(
    tenantId,
    {
      user_id: ownerId,
      type: NotificationType.REVIEW_REJECTED,
      title: "Changes requested",
      message: `${reviewerName} requested changes on your ${entityTypeLabel}: ${entity.name}`,
      entity_type: entity.type,
      entity_id: entity.id,
      entity_name: entity.name,
      action_url: `/${entity.type}s/${entity.id}`,
    },
    true,
    {
      template: EMAIL_TEMPLATES.REVIEW_REJECTED,
      subject: `Changes requested: ${entity.name}`,
      variables: {
        owner_name: owner ? `${owner.name}` : "User",
        reviewer_name: reviewerName,
        entity_type: entityTypeLabel,
        entity_name: entity.name,
        project_name: entity.projectName,
        review_comment: comment || "Please make the requested changes.",
        entity_url: `${baseUrl}/${entity.type}s/${entity.id}`,
      },
    }
  );
};

/**
 * Notify approval requested (for use case workflows)
 */
export const notifyApprovalRequested = async (
  tenantId: string,
  approverId: number,
  useCase: {
    id: number;
    name: string;
    workflowName: string;
    stepNumber: number;
    totalSteps: number;
  },
  requesterName: string,
  baseUrl: string
): Promise<void> => {
  const approver = await getUserById(approverId);

  await sendInAppNotification(
    tenantId,
    {
      user_id: approverId,
      type: NotificationType.APPROVAL_REQUESTED,
      title: `Approval requested - Step ${useCase.stepNumber}`,
      message: `${requesterName} needs your approval for: ${useCase.name}`,
      entity_type: NotificationEntityType.USE_CASE,
      entity_id: useCase.id,
      entity_name: useCase.name,
      action_url: `/use-cases/${useCase.id}`,
      metadata: { stepNumber: useCase.stepNumber },
    },
    true,
    {
      template: EMAIL_TEMPLATES.APPROVAL_REQUESTED,
      subject: `Approval requested: ${useCase.name}`,
      variables: {
        approver_name: approver ? `${approver.name}` : "Approver",
        requester_name: requesterName,
        use_case_name: useCase.name,
        workflow_name: useCase.workflowName,
        step_number: String(useCase.stepNumber),
        total_steps: String(useCase.totalSteps),
        approval_url: `${baseUrl}/use-cases/${useCase.id}`,
      },
    }
  );
};

/**
 * Notify approval complete
 */
export const notifyApprovalComplete = async (
  tenantId: string,
  requesterId: number,
  useCase: {
    id: number;
    name: string;
    totalSteps: number;
  },
  baseUrl: string
): Promise<void> => {
  const requester = await getUserById(requesterId);

  await sendInAppNotification(
    tenantId,
    {
      user_id: requesterId,
      type: NotificationType.APPROVAL_COMPLETE,
      title: "Use case fully approved",
      message: `Your use case "${useCase.name}" has been fully approved`,
      entity_type: NotificationEntityType.USE_CASE,
      entity_id: useCase.id,
      entity_name: useCase.name,
      action_url: `/use-cases/${useCase.id}`,
    },
    true,
    {
      template: EMAIL_TEMPLATES.APPROVAL_COMPLETE,
      subject: `Approved: ${useCase.name}`,
      variables: {
        requester_name: requester ? `${requester.name}` : "User",
        use_case_name: useCase.name,
        total_steps: String(useCase.totalSteps),
        use_case_url: `${baseUrl}/use-cases/${useCase.id}`,
      },
    }
  );
};

/**
 * Notify vendor review due
 */
export const notifyVendorReviewDue = async (
  tenantId: string,
  reviewerId: number,
  vendor: {
    id: number;
    name: string;
    reviewDate: string;
    riskLevel: string;
    lastReviewDate?: string;
    projectCount: number;
  },
  baseUrl: string
): Promise<void> => {
  const reviewer = await getUserById(reviewerId);

  await sendInAppNotification(
    tenantId,
    {
      user_id: reviewerId,
      type: NotificationType.VENDOR_REVIEW_DUE,
      title: "Vendor review due",
      message: `Vendor "${vendor.name}" review is due on ${vendor.reviewDate}`,
      entity_type: NotificationEntityType.VENDOR,
      entity_id: vendor.id,
      entity_name: vendor.name,
      action_url: `/vendors/${vendor.id}`,
    },
    true,
    {
      template: EMAIL_TEMPLATES.VENDOR_REVIEW_DUE,
      subject: `Vendor review due: ${vendor.name}`,
      variables: {
        reviewer_name: reviewer ? `${reviewer.name}` : "Reviewer",
        vendor_name: vendor.name,
        review_date: vendor.reviewDate,
        risk_level: vendor.riskLevel,
        last_review_date: vendor.lastReviewDate || "Never",
        project_count: String(vendor.projectCount),
        vendor_url: `${baseUrl}/vendors/${vendor.id}`,
      },
    }
  );
};

/**
 * Notify policy due soon
 */
export const notifyPolicyDueSoon = async (
  tenantId: string,
  adminId: number,
  policy: {
    id: number;
    name: string;
    projectName: string;
    dueDate: string;
  },
  baseUrl: string
): Promise<void> => {
  const admin = await getUserById(adminId);

  await sendInAppNotification(
    tenantId,
    {
      user_id: adminId,
      type: NotificationType.POLICY_DUE_SOON,
      title: "Policy due soon",
      message: `Policy "${policy.name}" is due on ${policy.dueDate}`,
      entity_type: NotificationEntityType.POLICY,
      entity_id: policy.id,
      entity_name: policy.name,
      action_url: `/policies/${policy.id}`,
    },
    true,
    {
      template: EMAIL_TEMPLATES.POLICY_DUE_SOON,
      subject: `Policy due soon: ${policy.name}`,
      variables: {
        admin_name: admin ? `${admin.name}` : "Admin",
        policy_name: policy.name,
        project_name: policy.projectName,
        due_date: policy.dueDate,
        policy_url: `${baseUrl}/policies/${policy.id}`,
      },
    }
  );
};

/**
 * Notify training assigned
 */
export const notifyTrainingAssigned = async (
  tenantId: string,
  userId: number,
  training: {
    id: number;
    name: string;
    description?: string;
    duration?: string;
    dueDate?: string;
  },
  assignerName: string,
  baseUrl: string
): Promise<void> => {
  const user = await getUserById(userId);

  await sendInAppNotification(
    tenantId,
    {
      user_id: userId,
      type: NotificationType.TRAINING_ASSIGNED,
      title: "Training assigned",
      message: `${assignerName} assigned you to training: ${training.name}`,
      entity_type: NotificationEntityType.TRAINING,
      entity_id: training.id,
      entity_name: training.name,
      action_url: `/training/${training.id}`,
    },
    true,
    {
      template: EMAIL_TEMPLATES.TRAINING_ASSIGNED,
      subject: `Training assigned: ${training.name}`,
      variables: {
        trainee_name: user ? `${user.name}` : "User",
        assigner_name: assignerName,
        training_name: training.name,
        training_description: training.description || "No description provided",
        training_duration: training.duration || "Not specified",
        training_due_date: training.dueDate || "No due date",
        training_url: `${baseUrl}/training/${training.id}`,
      },
    }
  );
};

// Helper functions
async function getUserById(userId: number): Promise<{ name: string; surname: string; email: string } | null> {
  const result = await sequelize.query<{ name: string; surname: string; email: string }>(
    `SELECT name, surname, email FROM public.users WHERE id = :userId`,
    {
      replacements: { userId },
      type: QueryTypes.SELECT,
    }
  );
  return result[0] || null;
}

async function getUserEmail(userId: number): Promise<{ email: string } | null> {
  const result = await sequelize.query<{ email: string }>(
    `SELECT email FROM public.users WHERE id = :userId`,
    {
      replacements: { userId },
      type: QueryTypes.SELECT,
    }
  );
  return result[0] || null;
}

async function getUserEmails(userIds: number[]): Promise<Array<{ id: number; name: string; surname: string; email: string }>> {
  if (userIds.length === 0) return [];

  const result = await sequelize.query<{ id: number; name: string; surname: string; email: string }>(
    `SELECT id, name, surname, email FROM public.users WHERE id IN (:userIds)`,
    {
      replacements: { userIds },
      type: QueryTypes.SELECT,
    }
  );
  return result;
}
