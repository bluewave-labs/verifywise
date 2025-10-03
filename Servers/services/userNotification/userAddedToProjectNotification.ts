import { notificationService } from "../notificationService";
import { getUserByIdQuery } from "../../utils/user.utils";
import { frontEndUrl } from "../../config/constants";
import { EMAIL_TEMPLATES } from "../../constants/emailTemplates";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../../utils/logger/logHelper";

export type ProjectRole = "admin" | "auditor" | "editor" | "reviewer";

export interface UserAddedToProjectNotification {
  projectId: number;
  projectName: string;
  adminId: number;
  userId: number;
  role: ProjectRole;
}

// Template alias: user.added.project.{role}
const roleConfig: Record<ProjectRole, { article: string; template: string }> = {
  admin: { article: "a", template: EMAIL_TEMPLATES.USER_ADDED_PROJECT_ADMIN },
  auditor: { article: "an", template: EMAIL_TEMPLATES.USER_ADDED_PROJECT_AUDITOR },
  editor: { article: "a", template: EMAIL_TEMPLATES.USER_ADDED_PROJECT_EDITOR },
  reviewer: { article: "a", template: EMAIL_TEMPLATES.USER_ADDED_PROJECT_REVIEWER },
};

export const sendUserAddedToProjectNotification = async (
  data: UserAddedToProjectNotification
): Promise<void> => {
  const config = roleConfig[data.role];

  logProcessing({
    description: `Sending user added as ${config.article} ${data.role} notification for project: ${data.projectName}`,
    functionName: "sendUserAddedToProjectNotification",
    fileName: "userAddedToProjectNotification.ts",
  });

  try {
    // Get admin user details
    const adminUser = await getUserByIdQuery(data.adminId);
    if (!adminUser) {
      throw new Error(`Admin user not found with ID: ${data.adminId}`);
    }

    // Get user details
    const user = await getUserByIdQuery(data.userId);
    if (!user) {
      throw new Error(`User not found with ID: ${data.userId}`);
    }

    if (!user.email || user.email.trim() === "") {
      throw new Error(`User email is missing or invalid for user ID: ${data.userId}`);
    }

    // Construct project URL
    const projectUrl = `${frontEndUrl}/project-view?projectId=${data.projectId}`;

    // Prepare template data
    const templateData = {
      project_name: data.projectName,
      actor_name: adminUser.name,
      project_url: projectUrl,
      user_name: user.name,
    };

    // Send the email using core notification service
    const subject = `You are now a project ${data.role} for ${data.projectName}`;
    await notificationService.sendEmailWithTemplate(
      user.email,
      subject,
      config.template,
      templateData
    );

    await logSuccess({
      eventType: "Create",
      description: `Added as a project ${data.role} notification sent to ${user.email}`,
      functionName: "sendUserAddedToProjectNotification",
      fileName: "userAddedToProjectNotification.ts",
    });
  } catch (error) {
    await logFailure({
      eventType: "Create",
      description: `Failed to send user added as a project ${data.role} notification`,
      functionName: "sendUserAddedToProjectNotification",
      fileName: "userAddedToProjectNotification.ts",
      error: error as Error,
    });
    throw error;
  }
};