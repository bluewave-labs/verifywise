import { notificationService } from "../notificationService";
import { getUserByIdQuery } from "../../utils/user.utils";
import { frontEndUrl } from "../../config/constants";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../../utils/logger/logHelper";


export interface UserAddedAdminNotification {
  projectId: number;
  projectName: string;
  adminId: number;
  userId: number;
}


export const sendUserAddedAdminNotification = async(
  data: UserAddedAdminNotification
): Promise<void> => {
  logProcessing({
    description: `Sending user added as admin notification for project: ${data.projectName}`,
    functionName: "sendUserAddedAdminNotification",
    fileName: "userAddedAdminNotification.ts",
  });

  try{

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

    if(!user.email || user.email.trim() === ''){
      throw new Error(`User email is missing or invalid for user ID: ${data.userId}`);
    }

    // Construct project URL
    const projectUrl = `${frontEndUrl}/project-view?projectId=${data.projectId}`;

    // Prepare template data
    const templateData = {
      project_name: data.projectName,
      actor_name: adminUser.name,
      project_url: projectUrl,
      user_name: user.name
    };

    // Send the email using core notification service
    const subject = `You are now a project admin for ${data.projectName}`;
    await notificationService.sendEmailWithTemplate(
      user.email,
      subject,
      "user-added-project-admin.mjml",
      templateData
    );

    await logSuccess({
      eventType: "Update",
      description: `Added as Admin notification sent to ${user.email}`,
      functionName: "sendUserAddedAdminNotification",
      fileName: "userAddedAdminNotification.ts",
    });
  } catch (error) {
    await logFailure({
      eventType: "Update",
      description: `Failed to send user added as admin notification`,
      functionName: "sendUserAddedAdminNotification",
      fileName: "userAddedAdminNotification.ts",
      error: error as Error,
    });
    throw error;
  }


}
