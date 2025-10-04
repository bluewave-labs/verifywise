import { notificationService } from "../notificationService";
import { getUserByIdQuery } from "../../utils/user.utils";
import { frontEndUrl } from "../../config/constants";
import { EMAIL_TEMPLATES } from "../../constants/emailTemplates";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../../utils/logger/logHelper";

export interface MemberRoleChangedEditorToAdminNotification {
  projectId: number;
  projectName: string;
  actorId: number;
  userId: number;
}

export const sendMemberRoleChangedEditorToAdminNotification = async (
  data: MemberRoleChangedEditorToAdminNotification
): Promise<void> => {
  logProcessing({
    description: `Sending role changed from editor to admin notification for project: ${data.projectName}`,
    functionName: "sendMemberRoleChangedEditorToAdminNotification",
    fileName: "memberRoleChangedNotification.ts",
  });

  try {
    // Get actor (admin who made the change) details
    const actorUser = await getUserByIdQuery(data.actorId);
    if (!actorUser) {
      throw new Error(`Actor user not found with ID: ${data.actorId}`);
    }

    // Get user details (the user whose role changed)
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
      actor_name: actorUser.name,
      project_url: projectUrl,
      user_name: user.name,
    };

    // Send the email using core notification service
    const subject = `Your role changed to project admin on ${data.projectName}`;
    await notificationService.sendEmailWithTemplate(
      user.email,
      subject,
      EMAIL_TEMPLATES.MEMBER_ROLE_CHANGED_EDITOR_TO_ADMIN,
      templateData
    );

    await logSuccess({
      eventType: "Create",
      description: `Role changed to admin notification sent to ${user.email}`,
      functionName: "sendMemberRoleChangedEditorToAdminNotification",
      fileName: "memberRoleChangedNotification.ts",
    });
  } catch (error) {
    await logFailure({
      eventType: "Create",
      description: `Failed to send role changed to admin notification`,
      functionName: "sendMemberRoleChangedEditorToAdminNotification",
      fileName: "memberRoleChangedNotification.ts",
      error: error as Error,
    });
    throw error;
  }
};