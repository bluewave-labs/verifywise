import { notificationService } from "../notificationService";
import { getUserByIdQuery } from "../../utils/user.utils";
import { frontEndUrl } from "../../config/constants";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../../utils/logger/logHelper";


export interface UserAddedReviewerNotification {
  projectId: number;
  projectName: string;
  adminId: number;
  userId: number;
}


export const sendUserAddedReviewerNotification = async(
  data: UserAddedReviewerNotification
): Promise<void> => {
  logProcessing({
    description: `Sending user added as a reviewer notification for project: ${data.projectName}`,
    functionName: "sendUserAddedReviewerNotification",
    fileName: "UserAddedReviewerNotification.ts",
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
    const subject = `You are now a project reviewer for ${data.projectName}`;
    await notificationService.sendEmailWithTemplate(
      user.email,
      subject,
      "user-added-project-reviewer.mjml",
      templateData
    );

    await logSuccess({
      eventType: "Create",
      description: `Added as a project reviewer notification sent to ${user.email}`,
      functionName: "sendUserAddedReviewerNotification",
      fileName: "UserAddedReviewerNotification.ts",
    });
  } catch (error) {
    await logFailure({
      eventType: "Create",
      description: `Failed to send user added as a project reviewer notification`,
      functionName: "sendUserAddedReviewerNotification",
      fileName: "UserAddedReviewerNotification.ts",
      error: error as Error,
    });
    throw error;
  }


}
