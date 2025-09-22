import path from "path";
import fs from "fs/promises";
import { sendEmail } from "./emailService";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";

// Process-rooted templates directory for security and post-transpile compatibility
const templatesDir = path.resolve(process.cwd(), "templates");

/**
 * Mask email address to prevent PII from being persisted in logs
 */
function maskEmail(email: string): string {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return "redacted";
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length <= 2) {
    return trimmedEmail.charAt(0) + "*";
  }

  if (trimmedEmail.length <= 6) {
    return trimmedEmail.charAt(0) + "*".repeat(trimmedEmail.length - 2) + trimmedEmail.charAt(trimmedEmail.length - 1);
  }

  return trimmedEmail.charAt(0) + "*".repeat(trimmedEmail.length - 2) + trimmedEmail.charAt(trimmedEmail.length - 1);
}

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
    templateData: Record<string, string>
  ): Promise<void> {
    logProcessing({
      description: `Sending email with template: ${templateFileName}`,
      functionName: "sendEmailWithTemplate",
      fileName: "NotificationService.ts",
    });

    try {
      // Read the template file
      const templatePath = path.join(templatesDir, path.basename(templateFileName));
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
        description: `Email sent successfully to ${maskEmail(recipientEmail)}`,
        functionName: "sendEmailWithTemplate",
        fileName: "NotificationService.ts",
      });
    } catch (error) {

      // Sanitize the error to remove any email addresses
      const sanitized = new Error(
        String((error as any)?.message ?? error).replace(
          /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
          "[redacted]"
        )
      );

      await logFailure({
        eventType: "Create",
        description: `Failed to send email to ${maskEmail(recipientEmail)}`,
        functionName: "sendEmailWithTemplate",
        fileName: "NotificationService.ts",
        error: sanitized,
      });
      throw error;
    }
  }
}

// Export both the class and the instance for flexibility
export const notificationService = NotificationService.getInstance();