import { Request, Response } from "express";
import { sequelize } from "../database/db";
import {
  getAllIntakeFormsQuery,
  getIntakeFormByIdQuery,
  getIntakeFormBySlugQuery,
  getActivePublicFormQuery,
  createIntakeFormQuery,
  updateIntakeFormQuery,
  deleteIntakeFormQuery,
  archiveIntakeFormQuery,
  getSubmissionsByFormIdQuery,
  getPendingSubmissionsQuery,
  getSubmissionByIdQuery,
  createSubmissionQuery,
  approveSubmissionQuery,
  rejectSubmissionQuery,
  getSubmissionStatsQuery,
  checkRateLimitQuery,
  getTenantHashBySlug,
} from "../utils/intakeForm.utils";
import { createNewModelInventoryQuery } from "../utils/modelInventory.utils";
import { createNewProjectQuery } from "../utils/project.utils";
import { IntakeFormStatus } from "../domain.layer/enums/intake-form-status.enum";
import { IntakeSubmissionStatus } from "../domain.layer/enums/intake-submission-status.enum";
import { IntakeEntityType } from "../domain.layer/enums/intake-entity-type.enum";
import { ModelInventoryStatus } from "../domain.layer/enums/model-inventory-status.enum";
import { ProjectStatus } from "../domain.layer/enums/project-status.enum";
import { ModelInventoryModel } from "../domain.layer/models/modelInventory/modelInventory.model";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";

// ============================================================================
// INTAKE FORM CONTROLLERS (Admin - Authenticated)
// ============================================================================

/**
 * Get all intake forms for the tenant
 */
export async function getAllIntakeForms(req: Request, res: Response) {
  logStructured(
    "processing",
    "starting getAllIntakeForms",
    "getAllIntakeForms",
    "intakeForm.ctrl.ts"
  );

  try {
    const forms = await getAllIntakeFormsQuery(req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](forms));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve intake forms",
      "getAllIntakeForms",
      "intakeForm.ctrl.ts"
    );
    logger.error("Error in getAllIntakeForms:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get intake form by ID
 */
export async function getIntakeFormById(req: Request, res: Response) {
  const formId = parseInt(req.params.id);

  logStructured(
    "processing",
    `fetching intake form by id: ${formId}`,
    "getIntakeFormById",
    "intakeForm.ctrl.ts"
  );

  try {
    const form = await getIntakeFormByIdQuery(formId, req.tenantId!);

    if (!form) {
      return res.status(404).json(STATUS_CODE[404]("Intake form not found"));
    }

    return res.status(200).json(STATUS_CODE[200](form));
  } catch (error) {
    logStructured(
      "error",
      `failed to retrieve intake form: ${formId}`,
      "getIntakeFormById",
      "intakeForm.ctrl.ts"
    );
    logger.error("Error in getIntakeFormById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Create new intake form
 */
export async function createIntakeForm(req: Request, res: Response) {
  logStructured(
    "processing",
    "creating new intake form",
    "createIntakeForm",
    "intakeForm.ctrl.ts"
  );

  const transaction = await sequelize.transaction();

  try {
    const { name, description, slug, entityType, schema, submitButtonText, status, ttlExpiresAt } = req.body;

    if (!name || !description || !entityType) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]("Name, description, and entity type are required"));
    }

    if (!Object.values(IntakeEntityType).includes(entityType)) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]("Invalid entity type"));
    }

    const form = await createIntakeFormQuery(
      {
        name,
        description,
        slug,
        entityType,
        schema,
        submitButtonText,
        status,
        ttlExpiresAt: ttlExpiresAt ? new Date(ttlExpiresAt) : null,
        createdBy: req.userId!,
      },
      req.tenantId!,
      transaction
    );

    await transaction.commit();

    logStructured(
      "successful",
      `intake form created: ${form.id}`,
      "createIntakeForm",
      "intakeForm.ctrl.ts"
    );

    return res.status(201).json(STATUS_CODE[201](form));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      "failed to create intake form",
      "createIntakeForm",
      "intakeForm.ctrl.ts"
    );
    logger.error("Error in createIntakeForm:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Update intake form
 */
export async function updateIntakeForm(req: Request, res: Response) {
  const formId = parseInt(req.params.id);

  logStructured(
    "processing",
    `updating intake form: ${formId}`,
    "updateIntakeForm",
    "intakeForm.ctrl.ts"
  );

  const transaction = await sequelize.transaction();

  try {
    const existingForm = await getIntakeFormByIdQuery(formId, req.tenantId!);

    if (!existingForm) {
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Intake form not found"));
    }

    const { name, description, slug, entityType, schema, submitButtonText, status, ttlExpiresAt } = req.body;

    const form = await updateIntakeFormQuery(
      formId,
      {
        name,
        description,
        slug,
        entityType,
        schema,
        submitButtonText,
        status,
        ttlExpiresAt: ttlExpiresAt ? new Date(ttlExpiresAt) : undefined,
      },
      req.tenantId!,
      transaction
    );

    await transaction.commit();

    logStructured(
      "successful",
      `intake form updated: ${formId}`,
      "updateIntakeForm",
      "intakeForm.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200](form));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `failed to update intake form: ${formId}`,
      "updateIntakeForm",
      "intakeForm.ctrl.ts"
    );
    logger.error("Error in updateIntakeForm:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Delete intake form (only drafts)
 */
export async function deleteIntakeForm(req: Request, res: Response) {
  const formId = parseInt(req.params.id);

  logStructured(
    "processing",
    `deleting intake form: ${formId}`,
    "deleteIntakeForm",
    "intakeForm.ctrl.ts"
  );

  const transaction = await sequelize.transaction();

  try {
    const existingForm = await getIntakeFormByIdQuery(formId, req.tenantId!);

    if (!existingForm) {
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Intake form not found"));
    }

    if (existingForm.status !== IntakeFormStatus.DRAFT) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]("Only draft forms can be deleted. Use archive for active forms."));
    }

    await deleteIntakeFormQuery(formId, req.tenantId!, transaction);
    await transaction.commit();

    logStructured(
      "successful",
      `intake form deleted: ${formId}`,
      "deleteIntakeForm",
      "intakeForm.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200]({ message: "Form deleted successfully" }));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `failed to delete intake form: ${formId}`,
      "deleteIntakeForm",
      "intakeForm.ctrl.ts"
    );
    logger.error("Error in deleteIntakeForm:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Archive intake form
 */
export async function archiveIntakeForm(req: Request, res: Response) {
  const formId = parseInt(req.params.id);

  logStructured(
    "processing",
    `archiving intake form: ${formId}`,
    "archiveIntakeForm",
    "intakeForm.ctrl.ts"
  );

  const transaction = await sequelize.transaction();

  try {
    const existingForm = await getIntakeFormByIdQuery(formId, req.tenantId!);

    if (!existingForm) {
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Intake form not found"));
    }

    const form = await archiveIntakeFormQuery(formId, req.tenantId!, transaction);
    await transaction.commit();

    logStructured(
      "successful",
      `intake form archived: ${formId}`,
      "archiveIntakeForm",
      "intakeForm.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200](form));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `failed to archive intake form: ${formId}`,
      "archiveIntakeForm",
      "intakeForm.ctrl.ts"
    );
    logger.error("Error in archiveIntakeForm:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// ============================================================================
// SUBMISSION CONTROLLERS (Admin - Authenticated)
// ============================================================================

/**
 * Get all pending submissions (dashboard)
 */
export async function getPendingSubmissions(req: Request, res: Response) {
  logStructured(
    "processing",
    "fetching pending submissions",
    "getPendingSubmissions",
    "intakeForm.ctrl.ts"
  );

  try {
    const submissions = await getPendingSubmissionsQuery(req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](submissions));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve pending submissions",
      "getPendingSubmissions",
      "intakeForm.ctrl.ts"
    );
    logger.error("Error in getPendingSubmissions:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get submissions for a specific form
 */
export async function getFormSubmissions(req: Request, res: Response) {
  const formId = parseInt(req.params.id);
  const status = req.query.status as IntakeSubmissionStatus | undefined;

  logStructured(
    "processing",
    `fetching submissions for form: ${formId}`,
    "getFormSubmissions",
    "intakeForm.ctrl.ts"
  );

  try {
    const submissions = await getSubmissionsByFormIdQuery(formId, req.tenantId!, status);
    return res.status(200).json(STATUS_CODE[200](submissions));
  } catch (error) {
    logStructured(
      "error",
      `failed to retrieve submissions for form: ${formId}`,
      "getFormSubmissions",
      "intakeForm.ctrl.ts"
    );
    logger.error("Error in getFormSubmissions:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get submission by ID
 */
export async function getSubmissionById(req: Request, res: Response) {
  const submissionId = parseInt(req.params.id);

  logStructured(
    "processing",
    `fetching submission: ${submissionId}`,
    "getSubmissionById",
    "intakeForm.ctrl.ts"
  );

  try {
    const submission = await getSubmissionByIdQuery(submissionId, req.tenantId!);

    if (!submission) {
      return res.status(404).json(STATUS_CODE[404]("Submission not found"));
    }

    return res.status(200).json(STATUS_CODE[200](submission));
  } catch (error) {
    logStructured(
      "error",
      `failed to retrieve submission: ${submissionId}`,
      "getSubmissionById",
      "intakeForm.ctrl.ts"
    );
    logger.error("Error in getSubmissionById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get submission stats (dashboard)
 */
export async function getSubmissionStats(req: Request, res: Response) {
  logStructured(
    "processing",
    "fetching submission stats",
    "getSubmissionStats",
    "intakeForm.ctrl.ts"
  );

  try {
    const stats = await getSubmissionStatsQuery(req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](stats));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve submission stats",
      "getSubmissionStats",
      "intakeForm.ctrl.ts"
    );
    logger.error("Error in getSubmissionStats:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Approve submission
 */
export async function approveSubmission(req: Request, res: Response) {
  const submissionId = parseInt(req.params.id);

  logStructured(
    "processing",
    `approving submission: ${submissionId}`,
    "approveSubmission",
    "intakeForm.ctrl.ts"
  );

  const transaction = await sequelize.transaction();

  try {
    const submission = await getSubmissionByIdQuery(submissionId, req.tenantId!);

    if (!submission) {
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Submission not found"));
    }

    if (submission.status !== IntakeSubmissionStatus.PENDING) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]("Only pending submissions can be approved"));
    }

    // Create the entity based on entity type
    let entityId: number;

    if (submission.entityType === IntakeEntityType.MODEL) {
      // Create model inventory entry with PENDING status
      const modelData = mapSubmissionToModelInventory(submission.data);
      const model = ModelInventoryModel.createNewModelInventory({
        ...modelData,
        status: ModelInventoryStatus.PENDING,
      });

      const createdModel = await createNewModelInventoryQuery(
        model,
        req.tenantId!,
        [],
        [],
        transaction
      );
      entityId = createdModel.id!;
    } else if (submission.entityType === IntakeEntityType.USE_CASE) {
      // Create use case (project) entry
      const projectData = mapSubmissionToProject(submission.data);
      const createdProject = await createNewProjectQuery(
        {
          project_title: (projectData.project_title as string) || "",
          description: (projectData.description as string) || "",
          start_date: new Date(),
          goal: (projectData.description as string) || "",
          owner: req.userId!,
          status: ProjectStatus.UNDER_REVIEW,
        },
        [], // members
        [], // frameworks
        req.tenantId!,
        req.userId!,
        transaction
      );
      entityId = createdProject.id!;
    } else {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]("Unsupported entity type"));
    }

    // Update submission with entity ID and approval status
    const updatedSubmission = await approveSubmissionQuery(
      submissionId,
      entityId,
      req.userId!,
      req.tenantId!,
      transaction
    );

    await transaction.commit();

    // TODO: Send email notifications to submitter and admins

    logStructured(
      "successful",
      `submission approved: ${submissionId}, entity created: ${entityId}`,
      "approveSubmission",
      "intakeForm.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200](updatedSubmission));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `failed to approve submission: ${submissionId}`,
      "approveSubmission",
      "intakeForm.ctrl.ts"
    );
    logger.error("Error in approveSubmission:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Reject submission
 */
export async function rejectSubmission(req: Request, res: Response) {
  const submissionId = parseInt(req.params.id);

  logStructured(
    "processing",
    `rejecting submission: ${submissionId}`,
    "rejectSubmission",
    "intakeForm.ctrl.ts"
  );

  const transaction = await sequelize.transaction();

  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]("Rejection reason is required"));
    }

    const submission = await getSubmissionByIdQuery(submissionId, req.tenantId!);

    if (!submission) {
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Submission not found"));
    }

    if (submission.status !== IntakeSubmissionStatus.PENDING) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]("Only pending submissions can be rejected"));
    }

    const updatedSubmission = await rejectSubmissionQuery(
      submissionId,
      rejectionReason,
      req.userId!,
      req.tenantId!,
      transaction
    );

    await transaction.commit();

    // TODO: Send email notification to submitter with rejection reason and resubmission link

    logStructured(
      "successful",
      `submission rejected: ${submissionId}`,
      "rejectSubmission",
      "intakeForm.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200](updatedSubmission));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `failed to reject submission: ${submissionId}`,
      "rejectSubmission",
      "intakeForm.ctrl.ts"
    );
    logger.error("Error in rejectSubmission:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// ============================================================================
// PUBLIC CONTROLLERS (Unauthenticated)
// ============================================================================

/**
 * Get public form by slug (unauthenticated)
 */
export async function getPublicForm(req: Request, res: Response) {
  const { tenantSlug, formSlug } = req.params;
  const isPreview = req.query.preview === "true";

  logStructured(
    "processing",
    `fetching public form: ${tenantSlug}/${formSlug}`,
    "getPublicForm",
    "intakeForm.ctrl.ts"
  );

  try {
    // Get tenant hash from slug
    const tenantInfo = await getTenantHashBySlug(tenantSlug);

    if (!tenantInfo) {
      return res.status(404).json(STATUS_CODE[404]("Organization not found"));
    }

    // Get the form
    if (isPreview) {
      // For preview, get the full form (requires admin, but we check in middleware)
      const form = await getIntakeFormBySlugQuery(formSlug, tenantInfo.hash);

      if (!form) {
        return res.status(404).json(STATUS_CODE[404]("Form not found"));
      }

      return res.status(200).json(STATUS_CODE[200]({
        id: form.id,
        name: form.name,
        description: form.description,
        slug: form.slug,
        entityType: form.entityType,
        schema: form.schema,
        submitButtonText: form.submitButtonText,
        isPreview: true,
      }));
    }

    // For public access, only return active and non-expired forms
    const form = await getActivePublicFormQuery(formSlug, tenantInfo.hash);

    if (!form) {
      return res.status(404).json(STATUS_CODE[404]("Form not found or not available"));
    }

    return res.status(200).json(STATUS_CODE[200](form));
  } catch (error) {
    logStructured(
      "error",
      `failed to retrieve public form: ${tenantSlug}/${formSlug}`,
      "getPublicForm",
      "intakeForm.ctrl.ts"
    );
    logger.error("Error in getPublicForm:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Submit public form (unauthenticated)
 */
export async function submitPublicForm(req: Request, res: Response) {
  const { tenantSlug, formSlug } = req.params;

  logStructured(
    "processing",
    `submitting public form: ${tenantSlug}/${formSlug}`,
    "submitPublicForm",
    "intakeForm.ctrl.ts"
  );

  try {
    // Get tenant hash from slug
    const tenantInfo = await getTenantHashBySlug(tenantSlug);

    if (!tenantInfo) {
      return res.status(404).json(STATUS_CODE[404]("Organization not found"));
    }

    // Get client IP for rate limiting
    const clientIp = req.ip || req.headers["x-forwarded-for"]?.toString().split(",")[0] || "unknown";

    // Check rate limit
    const withinLimit = await checkRateLimitQuery(clientIp, tenantInfo.hash);

    if (!withinLimit) {
      return res.status(429).json(STATUS_CODE[429]("Too many submissions. Please try again later."));
    }

    // Get the form
    const form = await getActivePublicFormQuery(formSlug, tenantInfo.hash);

    if (!form) {
      return res.status(404).json(STATUS_CODE[404]("Form not found or not available"));
    }

    const { submitterEmail, submitterName, data, captchaAnswer, captchaExpected, originalSubmissionId } = req.body;

    // Validate required fields
    if (!submitterEmail || !submitterName || !data) {
      return res.status(400).json(STATUS_CODE[400]("Submitter email, name, and form data are required"));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submitterEmail)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid email format"));
    }

    // Validate CAPTCHA
    if (captchaAnswer !== captchaExpected) {
      return res.status(400).json(STATUS_CODE[400]("Incorrect CAPTCHA answer"));
    }

    // Create submission
    const transaction = await sequelize.transaction();

    try {
      const submission = await createSubmissionQuery(
        {
          formId: form.id,
          submitterEmail,
          submitterName,
          data,
          entityType: form.entityType,
          originalSubmissionId: originalSubmissionId || undefined,
          ipAddress: clientIp,
        },
        tenantInfo.hash,
        transaction
      );

      await transaction.commit();

      // TODO: Send email notifications to admins

      logStructured(
        "successful",
        `submission created: ${submission.id}`,
        "submitPublicForm",
        "intakeForm.ctrl.ts"
      );

      return res.status(201).json(STATUS_CODE[201]({
        message: "Form submitted successfully. You will receive an email when your submission is reviewed.",
        submissionId: submission.id,
      }));
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    logStructured(
      "error",
      `failed to submit public form: ${tenantSlug}/${formSlug}`,
      "submitPublicForm",
      "intakeForm.ctrl.ts"
    );
    logger.error("Error in submitPublicForm:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get CAPTCHA question (unauthenticated)
 */
export async function getCaptcha(_req: Request, res: Response) {
  // Generate simple math question
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operators = ["+", "-"] as const;
  const operator = operators[Math.floor(Math.random() * operators.length)];

  let answer: number;
  let question: string;

  if (operator === "+") {
    answer = num1 + num2;
    question = `What is ${num1} + ${num2}?`;
  } else {
    // Ensure positive result for subtraction
    const larger = Math.max(num1, num2);
    const smaller = Math.min(num1, num2);
    answer = larger - smaller;
    question = `What is ${larger} - ${smaller}?`;
  }

  return res.status(200).json(STATUS_CODE[200]({ question, expected: answer }));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map submission data to model inventory fields
 */
function mapSubmissionToModelInventory(data: Record<string, unknown>): Partial<ModelInventoryModel> {
  return {
    provider: (data["model.provider"] as string) || "",
    model: (data["model.model"] as string) || "",
    version: (data["model.version"] as string) || "",
    approver: (data["model.approver"] as string) || "",
    capabilities: (data["model.capabilities"] as string) || "",
    security_assessment: (data["model.security_assessment"] as boolean) || false,
    reference_link: (data["model.reference_link"] as string) || "",
    biases: (data["model.biases"] as string) || "",
    limitations: (data["model.limitations"] as string) || "",
    hosting_provider: (data["model.hosting_provider"] as string) || "",
  };
}

/**
 * Map submission data to project fields
 */
function mapSubmissionToProject(data: Record<string, unknown>): Record<string, unknown> {
  return {
    project_title: (data["project.project_title"] as string) || "",
    description: (data["project.description"] as string) || "",
  };
}
