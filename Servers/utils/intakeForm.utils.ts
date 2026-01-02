import { sequelize } from "../database/db";
import { Transaction, QueryTypes } from "sequelize";
import {
  IIntakeForm,
  ICreateIntakeFormInput,
  IUpdateIntakeFormInput,
  IPublicIntakeForm,
} from "../domain.layer/interfaces/i.intakeForm";
import {
  IIntakeSubmission,
  ICreateIntakeSubmissionInput,
  IIntakeSubmissionStats,
} from "../domain.layer/interfaces/i.intakeSubmission";
import { IntakeFormStatus } from "../domain.layer/enums/intake-form-status.enum";
import { IntakeSubmissionStatus } from "../domain.layer/enums/intake-submission-status.enum";

// ============================================================================
// INTAKE FORM QUERIES
// ============================================================================

/**
 * Get all intake forms for a tenant
 */
export const getAllIntakeFormsQuery = async (
  tenant: string
): Promise<IIntakeForm[]> => {
  const forms = await sequelize.query(
    `SELECT
      id, name, description, slug, entity_type as "entityType",
      schema, submit_button_text as "submitButtonText", status,
      ttl_expires_at as "ttlExpiresAt", created_by as "createdBy",
      created_at as "createdAt", updated_at as "updatedAt"
    FROM "${tenant}".intake_forms
    ORDER BY created_at DESC`,
    {
      type: QueryTypes.SELECT,
    }
  );
  return forms as IIntakeForm[];
};

/**
 * Get intake form by ID
 */
export const getIntakeFormByIdQuery = async (
  id: number,
  tenant: string
): Promise<IIntakeForm | null> => {
  const forms = await sequelize.query(
    `SELECT
      id, name, description, slug, entity_type as "entityType",
      schema, submit_button_text as "submitButtonText", status,
      ttl_expires_at as "ttlExpiresAt", created_by as "createdBy",
      created_at as "createdAt", updated_at as "updatedAt"
    FROM "${tenant}".intake_forms
    WHERE id = :id`,
    {
      replacements: { id },
      type: QueryTypes.SELECT,
    }
  );
  return forms.length > 0 ? (forms[0] as IIntakeForm) : null;
};

/**
 * Get intake form by slug (for public access)
 */
export const getIntakeFormBySlugQuery = async (
  slug: string,
  tenant: string
): Promise<IIntakeForm | null> => {
  const forms = await sequelize.query(
    `SELECT
      id, name, description, slug, entity_type as "entityType",
      schema, submit_button_text as "submitButtonText", status,
      ttl_expires_at as "ttlExpiresAt", created_by as "createdBy",
      created_at as "createdAt", updated_at as "updatedAt"
    FROM "${tenant}".intake_forms
    WHERE slug = :slug`,
    {
      replacements: { slug },
      type: QueryTypes.SELECT,
    }
  );
  return forms.length > 0 ? (forms[0] as IIntakeForm) : null;
};

/**
 * Get active public form by slug (for unauthenticated users)
 */
export const getActivePublicFormQuery = async (
  slug: string,
  tenant: string
): Promise<IPublicIntakeForm | null> => {
  const forms = await sequelize.query(
    `SELECT
      id, name, description, slug, entity_type as "entityType",
      schema, submit_button_text as "submitButtonText"
    FROM "${tenant}".intake_forms
    WHERE slug = :slug
      AND status = :status
      AND (ttl_expires_at IS NULL OR ttl_expires_at > NOW())`,
    {
      replacements: { slug, status: IntakeFormStatus.ACTIVE },
      type: QueryTypes.SELECT,
    }
  );
  return forms.length > 0 ? (forms[0] as IPublicIntakeForm) : null;
};

/**
 * Create new intake form
 */
export const createIntakeFormQuery = async (
  data: ICreateIntakeFormInput,
  tenant: string,
  transaction?: Transaction
): Promise<IIntakeForm> => {
  const slug = data.slug || generateSlug(data.name);
  const uniqueSlug = await ensureUniqueSlug(slug, tenant, transaction);

  const result = await sequelize.query(
    `INSERT INTO "${tenant}".intake_forms
      (name, description, slug, entity_type, schema, submit_button_text, status, ttl_expires_at, created_by, created_at, updated_at)
    VALUES
      (:name, :description, :slug, :entityType, :schema, :submitButtonText, :status, :ttlExpiresAt, :createdBy, NOW(), NOW())
    RETURNING
      id, name, description, slug, entity_type as "entityType",
      schema, submit_button_text as "submitButtonText", status,
      ttl_expires_at as "ttlExpiresAt", created_by as "createdBy",
      created_at as "createdAt", updated_at as "updatedAt"`,
    {
      replacements: {
        name: data.name,
        description: data.description,
        slug: uniqueSlug,
        entityType: data.entityType,
        schema: JSON.stringify(data.schema || { version: "1.0", fields: [] }),
        submitButtonText: data.submitButtonText || "Submit",
        status: data.status || IntakeFormStatus.DRAFT,
        ttlExpiresAt: data.ttlExpiresAt || null,
        createdBy: data.createdBy,
      },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return result[0] as IIntakeForm;
};

/**
 * Update intake form
 */
export const updateIntakeFormQuery = async (
  id: number,
  data: IUpdateIntakeFormInput,
  tenant: string,
  transaction?: Transaction
): Promise<IIntakeForm | null> => {
  const updates: string[] = [];
  const replacements: Record<string, unknown> = { id };

  if (data.name !== undefined) {
    updates.push("name = :name");
    replacements.name = data.name;
  }
  if (data.description !== undefined) {
    updates.push("description = :description");
    replacements.description = data.description;
  }
  if (data.slug !== undefined) {
    const uniqueSlug = await ensureUniqueSlug(data.slug, tenant, transaction, id);
    updates.push("slug = :slug");
    replacements.slug = uniqueSlug;
  }
  if (data.entityType !== undefined) {
    updates.push("entity_type = :entityType");
    replacements.entityType = data.entityType;
  }
  if (data.schema !== undefined) {
    updates.push("schema = :schema");
    replacements.schema = JSON.stringify(data.schema);
  }
  if (data.submitButtonText !== undefined) {
    updates.push("submit_button_text = :submitButtonText");
    replacements.submitButtonText = data.submitButtonText;
  }
  if (data.status !== undefined) {
    updates.push("status = :status");
    replacements.status = data.status;
  }
  if (data.ttlExpiresAt !== undefined) {
    updates.push("ttl_expires_at = :ttlExpiresAt");
    replacements.ttlExpiresAt = data.ttlExpiresAt;
  }

  if (updates.length === 0) {
    return getIntakeFormByIdQuery(id, tenant);
  }

  updates.push("updated_at = NOW()");

  const result = await sequelize.query(
    `UPDATE "${tenant}".intake_forms
    SET ${updates.join(", ")}
    WHERE id = :id
    RETURNING
      id, name, description, slug, entity_type as "entityType",
      schema, submit_button_text as "submitButtonText", status,
      ttl_expires_at as "ttlExpiresAt", created_by as "createdBy",
      created_at as "createdAt", updated_at as "updatedAt"`,
    {
      replacements,
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return result.length > 0 ? (result[0] as IIntakeForm) : null;
};

/**
 * Delete intake form (only drafts can be deleted)
 */
export const deleteIntakeFormQuery = async (
  id: number,
  tenant: string,
  transaction?: Transaction
): Promise<boolean> => {
  await sequelize.query(
    `DELETE FROM "${tenant}".intake_forms
    WHERE id = :id AND status = :status`,
    {
      replacements: { id, status: IntakeFormStatus.DRAFT },
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return true;
};

/**
 * Archive intake form (soft delete for active/archived forms)
 */
export const archiveIntakeFormQuery = async (
  id: number,
  tenant: string,
  transaction?: Transaction
): Promise<IIntakeForm | null> => {
  return updateIntakeFormQuery(
    id,
    { status: IntakeFormStatus.ARCHIVED },
    tenant,
    transaction
  );
};

/**
 * Archive expired forms (called by cron job)
 */
export const archiveExpiredFormsQuery = async (
  tenant: string,
  transaction?: Transaction
): Promise<number> => {
  const result = await sequelize.query(
    `UPDATE "${tenant}".intake_forms
    SET status = :archivedStatus, updated_at = NOW()
    WHERE status = :activeStatus
      AND ttl_expires_at IS NOT NULL
      AND ttl_expires_at <= NOW()`,
    {
      replacements: {
        archivedStatus: IntakeFormStatus.ARCHIVED,
        activeStatus: IntakeFormStatus.ACTIVE,
      },
      type: QueryTypes.UPDATE,
      transaction,
    }
  );
  return result[1]; // Number of affected rows
};

// ============================================================================
// INTAKE SUBMISSION QUERIES
// ============================================================================

/**
 * Get all submissions for a form
 */
export const getSubmissionsByFormIdQuery = async (
  formId: number,
  tenant: string,
  status?: IntakeSubmissionStatus
): Promise<IIntakeSubmission[]> => {
  let query = `SELECT
    id, form_id as "formId", submitter_email as "submitterEmail",
    submitter_name as "submitterName", data, entity_type as "entityType",
    entity_id as "entityId", status, rejection_reason as "rejectionReason",
    reviewed_by as "reviewedBy", reviewed_at as "reviewedAt",
    original_submission_id as "originalSubmissionId",
    resubmission_count as "resubmissionCount", ip_address as "ipAddress",
    created_at as "createdAt", updated_at as "updatedAt"
  FROM "${tenant}".intake_submissions
  WHERE form_id = :formId`;

  const replacements: Record<string, unknown> = { formId };

  if (status) {
    query += " AND status = :status";
    replacements.status = status;
  }

  query += " ORDER BY created_at DESC";

  const submissions = await sequelize.query(query, {
    replacements,
    type: QueryTypes.SELECT,
  });

  return submissions as IIntakeSubmission[];
};

/**
 * Get all pending submissions for a tenant (for dashboard)
 */
export const getPendingSubmissionsQuery = async (
  tenant: string
): Promise<IIntakeSubmission[]> => {
  const submissions = await sequelize.query(
    `SELECT
      s.id, s.form_id as "formId", s.submitter_email as "submitterEmail",
      s.submitter_name as "submitterName", s.data, s.entity_type as "entityType",
      s.entity_id as "entityId", s.status, s.rejection_reason as "rejectionReason",
      s.reviewed_by as "reviewedBy", s.reviewed_at as "reviewedAt",
      s.original_submission_id as "originalSubmissionId",
      s.resubmission_count as "resubmissionCount", s.ip_address as "ipAddress",
      s.created_at as "createdAt", s.updated_at as "updatedAt",
      f.name as "formName", f.entity_type as "formEntityType"
    FROM "${tenant}".intake_submissions s
    JOIN "${tenant}".intake_forms f ON s.form_id = f.id
    WHERE s.status = :status
    ORDER BY s.created_at DESC`,
    {
      replacements: { status: IntakeSubmissionStatus.PENDING },
      type: QueryTypes.SELECT,
    }
  );

  return submissions as IIntakeSubmission[];
};

/**
 * Get submission by ID
 */
export const getSubmissionByIdQuery = async (
  id: number,
  tenant: string
): Promise<IIntakeSubmission | null> => {
  const submissions = await sequelize.query(
    `SELECT
      id, form_id as "formId", submitter_email as "submitterEmail",
      submitter_name as "submitterName", data, entity_type as "entityType",
      entity_id as "entityId", status, rejection_reason as "rejectionReason",
      reviewed_by as "reviewedBy", reviewed_at as "reviewedAt",
      original_submission_id as "originalSubmissionId",
      resubmission_count as "resubmissionCount", ip_address as "ipAddress",
      created_at as "createdAt", updated_at as "updatedAt"
    FROM "${tenant}".intake_submissions
    WHERE id = :id`,
    {
      replacements: { id },
      type: QueryTypes.SELECT,
    }
  );

  return submissions.length > 0 ? (submissions[0] as IIntakeSubmission) : null;
};

/**
 * Create new submission
 */
export const createSubmissionQuery = async (
  data: ICreateIntakeSubmissionInput,
  tenant: string,
  transaction?: Transaction
): Promise<IIntakeSubmission> => {
  // If this is a resubmission, get the resubmission count
  let resubmissionCount = 0;
  if (data.originalSubmissionId) {
    const original = await getSubmissionByIdQuery(data.originalSubmissionId, tenant);
    if (original) {
      resubmissionCount = original.resubmissionCount + 1;
    }
  }

  const result = await sequelize.query(
    `INSERT INTO "${tenant}".intake_submissions
      (form_id, submitter_email, submitter_name, data, entity_type, status,
       original_submission_id, resubmission_count, ip_address, created_at, updated_at)
    VALUES
      (:formId, :submitterEmail, :submitterName, :data, :entityType, :status,
       :originalSubmissionId, :resubmissionCount, :ipAddress, NOW(), NOW())
    RETURNING
      id, form_id as "formId", submitter_email as "submitterEmail",
      submitter_name as "submitterName", data, entity_type as "entityType",
      entity_id as "entityId", status, rejection_reason as "rejectionReason",
      reviewed_by as "reviewedBy", reviewed_at as "reviewedAt",
      original_submission_id as "originalSubmissionId",
      resubmission_count as "resubmissionCount", ip_address as "ipAddress",
      created_at as "createdAt", updated_at as "updatedAt"`,
    {
      replacements: {
        formId: data.formId,
        submitterEmail: data.submitterEmail,
        submitterName: data.submitterName,
        data: JSON.stringify(data.data),
        entityType: data.entityType,
        status: IntakeSubmissionStatus.PENDING,
        originalSubmissionId: data.originalSubmissionId || null,
        resubmissionCount,
        ipAddress: data.ipAddress || null,
      },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return result[0] as IIntakeSubmission;
};

/**
 * Approve submission and link to entity
 */
export const approveSubmissionQuery = async (
  id: number,
  entityId: number,
  reviewedBy: number,
  tenant: string,
  transaction?: Transaction
): Promise<IIntakeSubmission | null> => {
  const result = await sequelize.query(
    `UPDATE "${tenant}".intake_submissions
    SET status = :status, entity_id = :entityId, reviewed_by = :reviewedBy,
        reviewed_at = NOW(), updated_at = NOW()
    WHERE id = :id
    RETURNING
      id, form_id as "formId", submitter_email as "submitterEmail",
      submitter_name as "submitterName", data, entity_type as "entityType",
      entity_id as "entityId", status, rejection_reason as "rejectionReason",
      reviewed_by as "reviewedBy", reviewed_at as "reviewedAt",
      original_submission_id as "originalSubmissionId",
      resubmission_count as "resubmissionCount", ip_address as "ipAddress",
      created_at as "createdAt", updated_at as "updatedAt"`,
    {
      replacements: {
        id,
        status: IntakeSubmissionStatus.APPROVED,
        entityId,
        reviewedBy,
      },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return result.length > 0 ? (result[0] as IIntakeSubmission) : null;
};

/**
 * Reject submission with reason
 */
export const rejectSubmissionQuery = async (
  id: number,
  rejectionReason: string,
  reviewedBy: number,
  tenant: string,
  transaction?: Transaction
): Promise<IIntakeSubmission | null> => {
  const result = await sequelize.query(
    `UPDATE "${tenant}".intake_submissions
    SET status = :status, rejection_reason = :rejectionReason,
        reviewed_by = :reviewedBy, reviewed_at = NOW(), updated_at = NOW()
    WHERE id = :id
    RETURNING
      id, form_id as "formId", submitter_email as "submitterEmail",
      submitter_name as "submitterName", data, entity_type as "entityType",
      entity_id as "entityId", status, rejection_reason as "rejectionReason",
      reviewed_by as "reviewedBy", reviewed_at as "reviewedAt",
      original_submission_id as "originalSubmissionId",
      resubmission_count as "resubmissionCount", ip_address as "ipAddress",
      created_at as "createdAt", updated_at as "updatedAt"`,
    {
      replacements: {
        id,
        status: IntakeSubmissionStatus.REJECTED,
        rejectionReason,
        reviewedBy,
      },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return result.length > 0 ? (result[0] as IIntakeSubmission) : null;
};

/**
 * Get submission stats for dashboard
 */
export const getSubmissionStatsQuery = async (
  tenant: string
): Promise<IIntakeSubmissionStats> => {
  const result = await sequelize.query(
    `SELECT
      COUNT(*) FILTER (WHERE status = :pending) as pending,
      COUNT(*) FILTER (WHERE status = :approved) as approved,
      COUNT(*) FILTER (WHERE status = :rejected) as rejected,
      COUNT(*) as total
    FROM "${tenant}".intake_submissions`,
    {
      replacements: {
        pending: IntakeSubmissionStatus.PENDING,
        approved: IntakeSubmissionStatus.APPROVED,
        rejected: IntakeSubmissionStatus.REJECTED,
      },
      type: QueryTypes.SELECT,
    }
  );

  const stats = result[0] as any;
  return {
    pending: parseInt(stats.pending, 10) || 0,
    approved: parseInt(stats.approved, 10) || 0,
    rejected: parseInt(stats.rejected, 10) || 0,
    total: parseInt(stats.total, 10) || 0,
  };
};

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Check rate limit for IP address (100 submissions per hour)
 */
export const checkRateLimitQuery = async (
  ipAddress: string,
  tenant: string
): Promise<boolean> => {
  const result = await sequelize.query(
    `SELECT COUNT(*) as count
    FROM "${tenant}".intake_submissions
    WHERE ip_address = :ipAddress
      AND created_at > NOW() - INTERVAL '1 hour'`,
    {
      replacements: { ipAddress },
      type: QueryTypes.SELECT,
    }
  );

  const count = parseInt((result[0] as any).count, 10) || 0;
  return count < 100;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Ensure slug is unique by appending number if necessary
 */
export async function ensureUniqueSlug(
  slug: string,
  tenant: string,
  transaction?: Transaction,
  excludeId?: number
): Promise<string> {
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    let query = `SELECT COUNT(*) as count FROM "${tenant}".intake_forms WHERE slug = :slug`;
    const replacements: Record<string, unknown> = { slug: uniqueSlug };

    if (excludeId) {
      query += " AND id != :excludeId";
      replacements.excludeId = excludeId;
    }

    const result = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
      transaction,
    });

    const count = parseInt((result[0] as any).count, 10) || 0;

    if (count === 0) {
      return uniqueSlug;
    }

    uniqueSlug = `${slug}-${counter}`;
    counter++;

    // Safety limit
    if (counter > 100) {
      throw new Error("Unable to generate unique slug");
    }
  }
}

/**
 * Get tenant slug from organization ID
 */
export async function getTenantSlugById(
  organizationId: number
): Promise<string | null> {
  const result = await sequelize.query(
    `SELECT slug FROM organizations WHERE id = :id`,
    {
      replacements: { id: organizationId },
      type: QueryTypes.SELECT,
    }
  );

  return result.length > 0 ? (result[0] as any).slug : null;
}

/**
 * Get tenant hash from organization slug
 */
export async function getTenantHashBySlug(
  slug: string
): Promise<{ id: number; hash: string } | null> {
  const { getTenantHash } = require("../tools/getTenantHash");

  const result = await sequelize.query(
    `SELECT id FROM organizations WHERE slug = :slug`,
    {
      replacements: { slug },
      type: QueryTypes.SELECT,
    }
  );

  if (result.length === 0) {
    return null;
  }

  const orgId = (result[0] as any).id;
  return { id: orgId, hash: getTenantHash(orgId) };
}

/**
 * Get tenant slug from tenant hash
 */
export async function getTenantSlugByHash(
  hash: string
): Promise<string | null> {
  // The hash is in format like "a4ayc80OGd" which is derived from org ID
  // We need to find the org by iterating through orgs and matching hash
  const { getTenantHash } = require("../tools/getTenantHash");

  const result = await sequelize.query(
    `SELECT id, slug FROM organizations`,
    { type: QueryTypes.SELECT }
  );

  for (const org of result as Array<{ id: number; slug: string }>) {
    if (getTenantHash(org.id) === hash) {
      return org.slug;
    }
  }

  return null;
}
