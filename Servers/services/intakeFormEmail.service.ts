import { sendEmail } from "./emailService";
import { EMAIL_TEMPLATES } from "../constants/emailTemplates";
import { IntakeEntityType } from "../domain.layer/enums/intake-entity-type.enum";
import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";
import logger from "../utils/logger/fileLogger";

/**
 * Get entity type display name
 */
function getEntityTypeDisplayName(entityType: IntakeEntityType): string {
  switch (entityType) {
    case IntakeEntityType.MODEL:
      return "Model";
    case IntakeEntityType.USE_CASE:
      return "Use Case";
    default:
      return entityType;
  }
}

/**
 * Get admin users for a tenant
 */
async function getAdminUsersForTenant(tenantHash: string): Promise<Array<{ id: number; name: string; email: string }>> {
  try {
    const admins = await sequelize.query(
      `SELECT u.id, u.name, u.email
       FROM "${tenantHash}".users u
       WHERE u.role = 'admin' OR u.role = 'owner'`,
      { type: QueryTypes.SELECT }
    );
    return admins as Array<{ id: number; name: string; email: string }>;
  } catch (error) {
    logger.error("Failed to get admin users:", error);
    return [];
  }
}

/**
 * Build the frontend URL for a given path
 */
function buildFrontendUrl(path: string): string {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return `${baseUrl}${path}`;
}

/**
 * Send confirmation email to submitter after form submission
 */
export async function sendSubmissionReceivedEmail(
  submitterEmail: string,
  submitterName: string,
  formName: string,
  submissionId: number,
  resubmissionToken: string,
  tenantSlug: string,
  formSlug: string
): Promise<void> {
  try {
    const resubmitLink = buildFrontendUrl(`/intake/${tenantSlug}/${formSlug}?token=${resubmissionToken}`);

    await sendEmail(
      submitterEmail,
      `Submission received: ${formName}`,
      EMAIL_TEMPLATES.INTAKE_SUBMISSION_RECEIVED,
      {
        submitterName: submitterName || submitterEmail.split("@")[0],
        formName,
        submissionId: String(submissionId),
        resubmitLink,
      }
    );

    logger.info(`Submission received email sent to ${submitterEmail} for submission #${submissionId}`);
  } catch (error) {
    logger.error("Failed to send submission received email:", error);
    // Don't throw - email failure shouldn't break the submission flow
  }
}

/**
 * Send notification email to admins when a new submission is received
 */
export async function sendNewSubmissionAdminNotification(
  tenantHash: string,
  formName: string,
  submitterName: string,
  submitterEmail: string,
  submissionId: number,
  entityType: IntakeEntityType
): Promise<void> {
  try {
    const admins = await getAdminUsersForTenant(tenantHash);

    if (admins.length === 0) {
      logger.warn(`No admin users found for tenant ${tenantHash} to notify about submission #${submissionId}`);
      return;
    }

    const reviewLink = buildFrontendUrl(`/intake-forms`);
    const entityTypeDisplay = getEntityTypeDisplayName(entityType);

    for (const admin of admins) {
      try {
        await sendEmail(
          admin.email,
          `New submission pending review: ${formName}`,
          EMAIL_TEMPLATES.INTAKE_NEW_SUBMISSION_ADMIN,
          {
            adminName: admin.name || admin.email.split("@")[0],
            formName,
            submitterName: submitterName || submitterEmail.split("@")[0],
            submitterEmail,
            submissionId: String(submissionId),
            entityType: entityTypeDisplay,
            reviewLink,
          }
        );
      } catch (error) {
        logger.error(`Failed to send admin notification to ${admin.email}:`, error);
      }
    }

    logger.info(`Admin notification emails sent for submission #${submissionId}`);
  } catch (error) {
    logger.error("Failed to send admin notification emails:", error);
  }
}

/**
 * Send approval email to submitter
 */
export async function sendSubmissionApprovedEmail(
  submitterEmail: string,
  submitterName: string,
  formName: string,
  submissionId: number,
  entityType: IntakeEntityType
): Promise<void> {
  try {
    const entityTypeDisplay = getEntityTypeDisplayName(entityType);
    const dashboardLink = buildFrontendUrl("/");

    await sendEmail(
      submitterEmail,
      `Submission approved: ${formName}`,
      EMAIL_TEMPLATES.INTAKE_SUBMISSION_APPROVED,
      {
        submitterName: submitterName || submitterEmail.split("@")[0],
        formName,
        submissionId: String(submissionId),
        entityType: entityTypeDisplay,
        dashboardLink,
      }
    );

    logger.info(`Submission approved email sent to ${submitterEmail} for submission #${submissionId}`);
  } catch (error) {
    logger.error("Failed to send submission approved email:", error);
  }
}

/**
 * Send rejection email to submitter with reason and resubmit link
 */
export async function sendSubmissionRejectedEmail(
  submitterEmail: string,
  submitterName: string,
  formName: string,
  submissionId: number,
  rejectionReason: string,
  resubmissionToken: string,
  tenantSlug: string,
  formSlug: string
): Promise<void> {
  try {
    const resubmitLink = buildFrontendUrl(`/intake/${tenantSlug}/${formSlug}?token=${resubmissionToken}`);

    await sendEmail(
      submitterEmail,
      `Submission requires changes: ${formName}`,
      EMAIL_TEMPLATES.INTAKE_SUBMISSION_REJECTED,
      {
        submitterName: submitterName || submitterEmail.split("@")[0],
        formName,
        submissionId: String(submissionId),
        rejectionReason,
        resubmitLink,
      }
    );

    logger.info(`Submission rejected email sent to ${submitterEmail} for submission #${submissionId}`);
  } catch (error) {
    logger.error("Failed to send submission rejected email:", error);
  }
}
