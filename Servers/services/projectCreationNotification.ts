import { notificationService } from "./notificationService";
import { getUserByIdQuery } from "../utils/user.utils";
import { frontEndUrl } from "../config/constants";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";

export interface ProjectCreatedNotificationData {
  projectId: number;
  projectName: string;
  adminId: number;
  tenantId: string;
}

/**
 * Send project creation notification to project admin
 */
export const sendProjectCreatedNotification = async (
  data: ProjectCreatedNotificationData
): Promise<void> => {
  logProcessing({
    description: `Sending project creation notification for project: ${data.projectName}`,
    functionName: "sendProjectCreatedNotification",
    fileName: "projectCreationNotification.ts",
  });

  try {
    // Get admin user details
    const adminUser = await getUserByIdQuery(data.adminId);
    if (!adminUser) {
      throw new Error(`Admin user not found with ID: ${data.adminId}`);
    }

    // Construct project URL
    const projectUrl = `${frontEndUrl}/project-view?projectId=${data.projectId}`;

    // Prepare template data
    const templateData = {
      project_name: data.projectName,
      admin_name: adminUser.name,
      project_url: projectUrl,
    };

    // Send the email using core notification service
    const subject = `${data.projectName} is created in VerifyWise`;
    await notificationService.sendEmailWithTemplate(
      adminUser.email,
      subject,
      "project-created-admin.mjml",
      templateData
    );

    await logSuccess({
      eventType: "Create",
      description: `Project creation notification sent to ${adminUser.email}`,
      functionName: "sendProjectCreatedNotification",
      fileName: "projectCreationNotification.ts",
    });
  } catch (error) {
    await logFailure({
      eventType: "Create",
      description: `Failed to send project creation notification`,
      functionName: "sendProjectCreatedNotification",
      fileName: "projectCreationNotification.ts",
      error: error as Error,
    });
    throw error;
  }
};