import path from "path";
import fs from "fs/promises";
import { sendEmail } from "./emailService";
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
    fileName: "notificationService.ts",
  });

  try {
    // Get admin user details
    const adminUser = await getUserByIdQuery(data.adminId);
    if (!adminUser) {
      throw new Error(`Admin user not found with ID: ${data.adminId}`);
    }

    // Read the MJML template file
    const templatePath = path.resolve(
      __dirname,
      "../templates/project-created-admin.mjml"
    );
    const template = await fs.readFile(templatePath, "utf8");

    // Construct project URL
    const projectUrl = `${frontEndUrl}/project-view?projectId=${data.projectId}`;

    // Prepare template data
    const templateData = {
      project_name: data.projectName,
      admin_name: adminUser.name,
      project_url: projectUrl,
    };

    // Send the email
    const subject = `${data.projectName} is created in VerifyWise`;
    const result = await sendEmail(
      adminUser.email,
      subject,
      template,
      templateData
    );

    if (result.error) {
      throw new Error(`${result.error.name}: ${result.error.message}`);
    }

    await logSuccess({
      eventType: "Create",
      description: `Project creation notification sent to ${adminUser.email}`,
      functionName: "sendProjectCreatedNotification",
      fileName: "notificationService.ts",
    });
  } catch (error) {
    await logFailure({
      eventType: "Create",
      description: `Failed to send project creation notification`,
      functionName: "sendProjectCreatedNotification",
      fileName: "notificationService.ts",
      error: error as Error,
    });
    throw error;
  }
};

/**
 * Email template aliases for system emails
 */
export const EMAIL_TEMPLATES = {
  PROJECT_CREATED_ADMIN: "project.created.admin",
  // Add more template aliases as needed
} as const;

/**
 * Generic notification sender with template support
 */
export const sendNotificationEmail = async (
  templateAlias: string,
  recipientEmail: string,
  subject: string,
  templateData: Record<string, string>
): Promise<void> => {
  logProcessing({
    description: `Sending notification email with template: ${templateAlias}`,
    functionName: "sendNotificationEmail",
    fileName: "notificationService.ts",
  });

  try {
    // Map template alias to file name
    const templateFileMap: Record<string, string> = {
      [EMAIL_TEMPLATES.PROJECT_CREATED_ADMIN]: "project-created-admin.mjml",
    };

    const templateFileName = templateFileMap[templateAlias];
    if (!templateFileName) {
      throw new Error(`Unknown template alias: ${templateAlias}`);
    }

    // Read the template file
    const templatePath = path.resolve(
      __dirname,
      "../templates",
      templateFileName
    );
    const template = await fs.readFile(templatePath, "utf8");

    // Send the email
    const result = await sendEmail(
      recipientEmail,
      subject,
      template,
      templateData
    );

    if (result.error) {
      throw new Error(`${result.error.name}: ${result.error.message}`);
    }

    await logSuccess({
      eventType: "Create",
      description: `Notification email sent to ${recipientEmail} using template ${templateAlias}`,
      functionName: "sendNotificationEmail",
      fileName: "notificationService.ts",
    });
  } catch (error) {
    await logFailure({
      eventType: "Create",
      description: `Failed to send notification email`,
      functionName: "sendNotificationEmail",
      fileName: "notificationService.ts",
      error: error as Error,
    });
    throw error;
  }
};