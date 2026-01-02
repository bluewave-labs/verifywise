import { apiServices } from "../../infrastructure/api/networkServices";
import {
  IntakeFormStatus,
  IntakeEntityType,
  IntakeSubmissionStatus,
} from "../../domain/intake/enums";

// Re-export enums for convenience
export { IntakeFormStatus, IntakeEntityType, IntakeSubmissionStatus };

/**
 * Base URL for intake form API
 */
const BASE_URL = "/intake";

/**
 * Field option interface
 */
export interface FieldOption {
  label: string;
  value: string;
}

/**
 * Field validation interface
 */
export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

/**
 * Form field interface
 */
export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  validation?: FieldValidation;
  options?: FieldOption[];
  defaultValue?: string | number | boolean | string[];
  entityFieldMapping?: string;
  order: number;
}

/**
 * Form schema interface
 */
export interface FormSchema {
  version: string;
  fields: FormField[];
}

/**
 * Intake form interface
 */
export interface IntakeForm {
  id: number;
  name: string;
  description: string;
  slug: string;
  entityType: IntakeEntityType;
  schema: FormSchema;
  submitButtonText: string;
  status: IntakeFormStatus;
  ttlExpiresAt?: Date | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Intake submission interface
 */
export interface IntakeSubmission {
  id: number;
  formId: number;
  formData: Record<string, unknown>;
  submitterEmail: string;
  submitterName?: string;
  status: IntakeSubmissionStatus;
  reviewedBy?: number;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdEntityId?: number;
  createdEntityType?: string;
  resubmissionToken?: string;
  resubmissionCount: number;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Admin Form API
// ============================================================================

/**
 * Get all intake forms
 */
export async function getAllIntakeForms(
  params: {
    page?: number;
    limit?: number;
    status?: IntakeFormStatus;
    entityType?: IntakeEntityType;
  } = {},
  signal?: AbortSignal
): Promise<{ data: IntakeForm[]; pagination?: { total: number; page: number; limit: number } }> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", String(params.page));
  if (params.limit) queryParams.append("limit", String(params.limit));
  if (params.status) queryParams.append("status", params.status);
  if (params.entityType) queryParams.append("entityType", params.entityType);

  const url = `${BASE_URL}/forms${queryParams.toString() ? `?${queryParams}` : ""}`;
  const response = await apiServices.get(url, { signal });
  return response.data;
}

/**
 * Get a single intake form by ID
 */
export async function getIntakeForm(
  formId: number,
  signal?: AbortSignal
): Promise<{ data: IntakeForm }> {
  const response = await apiServices.get(`${BASE_URL}/forms/${formId}`, { signal });
  return response.data;
}

/**
 * Create a new intake form
 */
export async function createIntakeForm(
  data: {
    name: string;
    description: string;
    slug?: string;
    entityType: IntakeEntityType;
    schema?: FormSchema;
    submitButtonText?: string;
    status?: IntakeFormStatus;
    ttlExpiresAt?: Date | null;
  },
  signal?: AbortSignal
): Promise<{ data: IntakeForm }> {
  const response = await apiServices.post(`${BASE_URL}/forms`, data, { signal });
  return response.data;
}

/**
 * Update an intake form
 */
export async function updateIntakeForm(
  formId: number,
  data: {
    name?: string;
    description?: string;
    slug?: string;
    schema?: FormSchema;
    submitButtonText?: string;
    status?: IntakeFormStatus;
    ttlExpiresAt?: Date | null;
  },
  signal?: AbortSignal
): Promise<{ data: IntakeForm }> {
  const response = await apiServices.patch(`${BASE_URL}/forms/${formId}`, data, { signal });
  return response.data;
}

/**
 * Delete an intake form
 */
export async function deleteIntakeForm(
  formId: number,
  signal?: AbortSignal
): Promise<{ data: null }> {
  const response = await apiServices.delete(`${BASE_URL}/forms/${formId}`, { signal });
  return response.data;
}

/**
 * Archive an intake form
 */
export async function archiveIntakeForm(
  formId: number,
  signal?: AbortSignal
): Promise<{ data: IntakeForm }> {
  const response = await apiServices.post(`${BASE_URL}/forms/${formId}/archive`, undefined, { signal });
  return response.data;
}

// ============================================================================
// Admin Submission API
// ============================================================================

/**
 * Get pending submissions
 */
export async function getPendingSubmissions(
  params: {
    page?: number;
    limit?: number;
    formId?: number;
  } = {},
  signal?: AbortSignal
): Promise<{ data: IntakeSubmission[]; pagination?: { total: number; page: number; limit: number } }> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", String(params.page));
  if (params.limit) queryParams.append("limit", String(params.limit));
  if (params.formId) queryParams.append("formId", String(params.formId));

  const url = `${BASE_URL}/submissions${queryParams.toString() ? `?${queryParams}` : ""}`;
  const response = await apiServices.get(url, { signal });
  return response.data;
}

/**
 * Approve a submission
 */
export async function approveSubmission(
  submissionId: number,
  signal?: AbortSignal
): Promise<{ data: { submission: IntakeSubmission; createdEntity: unknown } }> {
  const response = await apiServices.post(
    `${BASE_URL}/submissions/${submissionId}/approve`,
    undefined,
    { signal }
  );
  return response.data;
}

/**
 * Reject a submission
 */
export async function rejectSubmission(
  submissionId: number,
  reason: string,
  signal?: AbortSignal
): Promise<{ data: IntakeSubmission }> {
  const response = await apiServices.post(
    `${BASE_URL}/submissions/${submissionId}/reject`,
    { reason },
    { signal }
  );
  return response.data;
}

// ============================================================================
// Public Form API (No authentication required)
// ============================================================================

/**
 * Get CAPTCHA for public form
 */
export async function getCaptcha(): Promise<{ data: { question: string; token: string } }> {
  const response = await apiServices.get(`${BASE_URL}/public/captcha`);
  return response.data;
}

/**
 * Get public form by slug
 */
export async function getPublicForm(
  tenantSlug: string,
  formSlug: string,
  resubmissionToken?: string
): Promise<{
  data: {
    form: {
      id: number;
      name: string;
      description: string;
      slug: string;
      entityType: IntakeEntityType;
      schema: FormSchema;
      submitButtonText: string;
    };
    previousData?: Record<string, unknown>;
  };
}> {
  const queryParams = resubmissionToken ? `?token=${resubmissionToken}` : "";
  const response = await apiServices.get(`${BASE_URL}/public/${tenantSlug}/${formSlug}${queryParams}`);
  return response.data;
}

/**
 * Submit public form
 */
export async function submitPublicForm(
  tenantSlug: string,
  formSlug: string,
  data: {
    formData: Record<string, unknown>;
    submitterEmail: string;
    submitterName?: string;
    captchaToken: string;
    captchaAnswer: number;
    resubmissionToken?: string;
  }
): Promise<{
  data: {
    submissionId: number;
    resubmissionToken: string;
    message: string;
  };
}> {
  const response = await apiServices.post(`${BASE_URL}/public/${tenantSlug}/${formSlug}`, data);
  return response.data;
}
