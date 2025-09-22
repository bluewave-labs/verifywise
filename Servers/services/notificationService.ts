import path from "path";
import fs from "fs/promises";
import { sendEmail } from "./emailService";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";

/**
 * Core notification service for sending emails with templates
 */
export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Send email using template file
   */
  async sendEmailWithTemplate(
    recipientEmail: string,
    subject: string,
    templateFileName: string,
    templateData: Record<string, any>
  ): Promise<void> {
    logProcessing({
      description: `Sending email with template: ${templateFileName}`,
      functionName: "sendEmailWithTemplate",
      fileName: "NotificationService.ts",
    });

    try {
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
        description: `Email sent successfully to ${recipientEmail}`,
        functionName: "sendEmailWithTemplate",
        fileName: "NotificationService.ts",
      });
    } catch (error) {
      await logFailure({
        eventType: "Create",
        description: `Failed to send email to ${recipientEmail}`,
        functionName: "sendEmailWithTemplate",
        fileName: "NotificationService.ts",
        error: error as Error,
      });
      throw error;
    }
  }
}

// Export both the class and the instance for flexibility
export const notificationService = NotificationService.getInstance();