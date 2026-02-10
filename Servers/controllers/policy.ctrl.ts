import { Request, Response } from "express";
import { IPolicy, POLICY_TAGS } from "../domain.layer/interfaces/i.policy";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createPolicyQuery,
  deletePolicyByIdQuery,
  getAllPoliciesQuery,
  getPolicyByIdQuery,
  updatePolicyByIdQuery,
  updatePolicyReviewStatusQuery,
} from "../utils/policyManager.utils";
import { sequelize } from "../database/db";
import {
  recordPolicyCreation,
  trackPolicyChanges,
  recordMultipleFieldChanges,
} from "../utils/policyChangeHistory.utils";
import {
  generatePolicyPDF,
  generatePolicyDOCX,
  generateFilename,
} from "../services/policies/policyExporter";
import {
  notifyReviewRequested,
  notifyReviewApproved,
  notifyReviewRejected,
} from "../services/inAppNotification.service";
import { NotificationEntityType } from "../domain.layer/interfaces/i.notification";

export class PolicyController {
  // Get all policies
  static async getAllPolicies(req: Request, res: Response) {
    try {
      const policies = await getAllPoliciesQuery(req.tenantId!);

      return res.status(200).json(STATUS_CODE[200](policies));
    } catch (error) {
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

  // Get policy by ID
  static async getPolicyById(req: Request, res: Response) {
    try {
      const policyId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const policy = await getPolicyByIdQuery(req.tenantId!, policyId);

      if (policy) {
        return res.status(200).json(STATUS_CODE[200](policy));
      }

      return res.status(404).json(STATUS_CODE[404](null));
    } catch (error) {
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

  // Create new policy
  static async createPolicy(req: Request, res: Response) {
    const transaction = await sequelize.transaction();
    try {
      const userId = req.userId!;
      const policyData = {
        ...req.body,
        author_id: userId,
        last_updated_by: userId,
      } as IPolicy;

      const policy = await createPolicyQuery(
        policyData,
        req.tenantId!,
        userId,
        transaction
      );

      if (policy) {
        // Record creation in change history
        if (policy.id) {
          await recordPolicyCreation(
            policy.id,
            userId,
            req.tenantId!,
            policyData,
            transaction
          );
        }

        await transaction.commit();
        return res.status(201).json(STATUS_CODE[201](policy));
      }
      await transaction.rollback();
      return res.status(503).json(STATUS_CODE[503]({}));
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

  // Update policy
  static async updatePolicy(req: Request, res: Response) {
    const transaction = await sequelize.transaction();
    try {
      const policyId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const userId = req.userId!;
      // Get existing policy for change tracking
      const existingPolicyResult = await getPolicyByIdQuery(
        req.tenantId!,
        policyId
      );

      if (!existingPolicyResult || existingPolicyResult.length === 0) {
        await transaction.rollback();
        return res.status(404).json(STATUS_CODE[404]({}));
      }

      const existingPolicy = existingPolicyResult[0];

      const policyData = {
        ...req.body,
        last_updated_by: userId,
      } as Partial<IPolicy>;

      const policy = await updatePolicyByIdQuery(
        policyId,
        policyData,
        req.tenantId!,
        userId,
        transaction
      );

      if (policy) {
        // Track and record changes
        const changes = await trackPolicyChanges(
          existingPolicy as unknown as IPolicy,
          policyData
        );
        if (changes.length > 0) {
          await recordMultipleFieldChanges(
            policyId,
            userId,
            req.tenantId!,
            changes,
            transaction
          );
        }

        await transaction.commit();
        return res.status(202).json(STATUS_CODE[202](policy));
      }
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]({}));
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating policy:", error);
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

  // Get available policy tags
  static async getPolicyTags(_req: Request, res: Response) {
    try {
      return res.status(200).json(STATUS_CODE[200](POLICY_TAGS));
    } catch (error) {
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

  // In PolicyController
  static async deletePolicyById(req: Request, res: Response) {
    const transaction = await sequelize.transaction();
    try {
      const policyId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

      const deleted = await deletePolicyByIdQuery(
        req.tenantId!,
        policyId,
        transaction
      );

      if (deleted) {
        await transaction.commit();
        return res.status(202).json(STATUS_CODE[202](deleted));
      }

      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]({}));
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

  // Export policy as PDF
  static async exportPolicyPDF(req: Request, res: Response) {
    try {
      const policyId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      if (isNaN(policyId)) {
        return res.status(400).json(STATUS_CODE[400]("Invalid policy ID"));
      }

      const policyResult = await getPolicyByIdQuery(req.tenantId!, policyId);

      if (!policyResult || policyResult.length === 0) {
        return res.status(404).json(STATUS_CODE[404](null));
      }

      const policy = policyResult[0] as IPolicy;
      const pdfBuffer = await generatePolicyPDF(
        policy.title,
        policy.content_html || "",
        req.tenantId!
      );

      const filename = generateFilename(policy.title, "pdf");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);

      return res.send(pdfBuffer);
    } catch (error) {
      console.error("Error exporting policy as PDF:", error);
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

  // Export policy as DOCX
  static async exportPolicyDOCX(req: Request, res: Response) {
    try {
      const policyId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      if (isNaN(policyId)) {
        return res.status(400).json(STATUS_CODE[400]("Invalid policy ID"));
      }

      const policyResult = await getPolicyByIdQuery(req.tenantId!, policyId);

      if (!policyResult || policyResult.length === 0) {
        return res.status(404).json(STATUS_CODE[404](null));
      }

      const policy = policyResult[0] as IPolicy;
      console.log("Exporting DOCX for policy:", policy.title);
      console.log("Content HTML:", policy.content_html?.substring(0, 1000));

      const docxBuffer = await generatePolicyDOCX(
        policy.title,
        policy.content_html || "",
        req.tenantId!
      );
      console.log("Generated DOCX buffer size:", docxBuffer.length);

      const filename = generateFilename(policy.title, "docx");

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Length", docxBuffer.length);

      return res.send(docxBuffer);
    } catch (error) {
      console.error("Error exporting policy as DOCX:", error);
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

  // Request review for a policy
  static async requestReview(req: Request, res: Response) {
    const transaction = await sequelize.transaction();
    try {
      const policyId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      if (isNaN(policyId)) {
        await transaction.rollback();
        return res.status(400).json(STATUS_CODE[400]("Invalid policy ID"));
      }

      const userId = req.userId!;
      const { reviewer_ids, message } = req.body;

      if (!reviewer_ids || !Array.isArray(reviewer_ids) || reviewer_ids.length === 0) {
        await transaction.rollback();
        return res.status(400).json(STATUS_CODE[400]("reviewer_ids is required"));
      }

      const policyResult = await getPolicyByIdQuery(req.tenantId!, policyId);
      if (!policyResult || policyResult.length === 0) {
        await transaction.rollback();
        return res.status(404).json(STATUS_CODE[404](null));
      }
      const policy = policyResult[0] as any;

      // Update review status to pending_review
      await updatePolicyReviewStatusQuery(
        req.tenantId!,
        policyId,
        "pending_review",
        userId,
        message,
        transaction
      );

      await transaction.commit();

      // Send notifications to each reviewer
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const requesterUser = await sequelize.query(
        `SELECT name, surname FROM public.users WHERE id = :userId`,
        { replacements: { userId }, type: "SELECT" as any }
      ) as any[];
      const requesterName = requesterUser[0]
        ? `${requesterUser[0].name} ${requesterUser[0].surname}`
        : "User";

      for (const reviewerId of reviewer_ids) {
        try {
          await notifyReviewRequested(
            req.tenantId!,
            reviewerId,
            {
              type: NotificationEntityType.POLICY,
              id: policyId,
              name: policy.title,
              projectName: "",
            },
            requesterName,
            message || "Please review this policy.",
            baseUrl
          );
        } catch (notifyError) {
          console.error(`Failed to notify reviewer ${reviewerId}:`, notifyError);
        }
      }

      const updatedPolicy = await getPolicyByIdQuery(req.tenantId!, policyId);
      return res.status(200).json(STATUS_CODE[200](updatedPolicy?.[0] || null));
    } catch (error) {
      await transaction.rollback();
      console.error("Error requesting policy review:", error);
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

  // Approve a policy review
  static async approveReview(req: Request, res: Response) {
    const transaction = await sequelize.transaction();
    try {
      const policyId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      if (isNaN(policyId)) {
        await transaction.rollback();
        return res.status(400).json(STATUS_CODE[400]("Invalid policy ID"));
      }

      const reviewerId = req.userId!;
      const { comment } = req.body;

      const policyResult = await getPolicyByIdQuery(req.tenantId!, policyId);
      if (!policyResult || policyResult.length === 0) {
        await transaction.rollback();
        return res.status(404).json(STATUS_CODE[404](null));
      }
      const policy = policyResult[0] as any;

      // Update review status to approved
      await updatePolicyReviewStatusQuery(
        req.tenantId!,
        policyId,
        "approved",
        reviewerId,
        comment,
        transaction
      );

      await transaction.commit();

      // Notify the policy author
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const reviewerUser = await sequelize.query(
        `SELECT name, surname FROM public.users WHERE id = :reviewerId`,
        { replacements: { reviewerId }, type: "SELECT" as any }
      ) as any[];
      const reviewerName = reviewerUser[0]
        ? `${reviewerUser[0].name} ${reviewerUser[0].surname}`
        : "Reviewer";

      try {
        await notifyReviewApproved(
          req.tenantId!,
          policy.author_id,
          {
            type: NotificationEntityType.POLICY,
            id: policyId,
            name: policy.title,
            projectName: "",
          },
          reviewerName,
          comment || "Looks good!",
          baseUrl
        );
      } catch (notifyError) {
        console.error("Failed to send review approved notification:", notifyError);
      }

      const updatedPolicy = await getPolicyByIdQuery(req.tenantId!, policyId);
      return res.status(200).json(STATUS_CODE[200](updatedPolicy?.[0] || null));
    } catch (error) {
      await transaction.rollback();
      console.error("Error approving policy review:", error);
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

  // Reject a policy review (request changes)
  static async rejectReview(req: Request, res: Response) {
    const transaction = await sequelize.transaction();
    try {
      const policyId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      if (isNaN(policyId)) {
        await transaction.rollback();
        return res.status(400).json(STATUS_CODE[400]("Invalid policy ID"));
      }

      const reviewerId = req.userId!;
      const { comment } = req.body;

      if (!comment) {
        await transaction.rollback();
        return res.status(400).json(STATUS_CODE[400]("comment is required when requesting changes"));
      }

      const policyResult = await getPolicyByIdQuery(req.tenantId!, policyId);
      if (!policyResult || policyResult.length === 0) {
        await transaction.rollback();
        return res.status(404).json(STATUS_CODE[404](null));
      }
      const policy = policyResult[0] as any;

      // Update review status to changes_requested
      await updatePolicyReviewStatusQuery(
        req.tenantId!,
        policyId,
        "changes_requested",
        reviewerId,
        comment,
        transaction
      );

      await transaction.commit();

      // Notify the policy author
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const reviewerUser = await sequelize.query(
        `SELECT name, surname FROM public.users WHERE id = :reviewerId`,
        { replacements: { reviewerId }, type: "SELECT" as any }
      ) as any[];
      const reviewerName = reviewerUser[0]
        ? `${reviewerUser[0].name} ${reviewerUser[0].surname}`
        : "Reviewer";

      try {
        await notifyReviewRejected(
          req.tenantId!,
          policy.author_id,
          {
            type: NotificationEntityType.POLICY,
            id: policyId,
            name: policy.title,
            projectName: "",
          },
          reviewerName,
          comment,
          baseUrl
        );
      } catch (notifyError) {
        console.error("Failed to send review rejected notification:", notifyError);
      }

      const updatedPolicy = await getPolicyByIdQuery(req.tenantId!, policyId);
      return res.status(200).json(STATUS_CODE[200](updatedPolicy?.[0] || null));
    } catch (error) {
      await transaction.rollback();
      console.error("Error rejecting policy review:", error);
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }
}
