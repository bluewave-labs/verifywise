import path from "path";
import fs from "fs/promises";
import { sendEmail } from "./emailService";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";

interface QueuedEmail {
  recipientEmail: string;
  subject: string;
  templateFileName: string;
  templateData: Record<string, string>;
  resolve: (value: void | PromiseLike<void>) => void;
  reject: (reason?: any) => void;
}

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
  private emailQueue: QueuedEmail[] = [];
  private isProcessing = false;
  private readonly RATE_LIMIT_DELAY = 600; // 600ms delay to stay under 2 requests/second

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.emailQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.emailQueue.length > 0) {
      const emailData = this.emailQueue.shift()!;

      try {
        await this.sendEmailDirectly(
          emailData.recipientEmail,
          emailData.subject,
          emailData.templateFileName,
          emailData.templateData
        );
        emailData.resolve();
      } catch (error) {
        emailData.reject(error);
      }

      // Wait before processing next email to respect rate limit
      if (this.emailQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
      }
    }

    this.isProcessing = false;
  }

  /**
   * Send email using template file (queued with rate limiting)
   */
  async sendEmailWithTemplate(
    recipientEmail: string,
    subject: string,
    templateFileName: string,
    templateData: Record<string, string>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.emailQueue.push({
        recipientEmail,
        subject,
        templateFileName,
        templateData,
        resolve,
        reject
      });

      // Start processing the queue if not already processing
      this.processQueue().catch(reject);
    });
  }

  /**
   * Direct email sending (internal method)
   */
  private async sendEmailDirectly(
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
      (sanitized as any).cause = error;
      throw sanitized;
    }
  }
}

// Export both the class and the instance for flexibility
export const notificationService = NotificationService.getInstance();