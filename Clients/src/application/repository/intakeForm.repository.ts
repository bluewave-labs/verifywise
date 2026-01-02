import { getAuthToken, apiRequest } from "../../infrastructure/api/networkServices";
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
const BASE_URL = "/api/intake";

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

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  message: string;
  data: T;
}

/**
 * Pagination interface
 */
interface PaginatedResponse<T> {
  message: string;
  data: {
    forms?: T[];
    submissions?: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
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
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<PaginatedResponse<IntakeForm>> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", String(params.page));
  if (params.limit) queryParams.append("limit", String(params.limit));
  if (params.status) queryParams.append("status", params.status);
  if (params.entityType) queryParams.append("entityType", params.entityType);

  const url = `${BASE_URL}/forms${queryParams.toString() ? `?${queryParams}` : ""}`;
  return apiRequest<PaginatedResponse<IntakeForm>>("GET", url, undefined, signal, authToken);
}

/**
 * Get a single intake form by ID
 */
export async function getIntakeForm(
  formId: number,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<ApiResponse<IntakeForm>> {
  return apiRequest<ApiResponse<IntakeForm>>(
    "GET",
    `${BASE_URL}/forms/${formId}`,
    undefined,
    signal,
    authToken
  );
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
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<ApiResponse<IntakeForm>> {
  return apiRequest<ApiResponse<IntakeForm>>(
    "POST",
    `${BASE_URL}/forms`,
    data,
    signal,
    authToken
  );
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
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<ApiResponse<IntakeForm>> {
  return apiRequest<ApiResponse<IntakeForm>>(
    "PATCH",
    `${BASE_URL}/forms/${formId}`,
    data,
    signal,
    authToken
  );
}

/**
 * Delete an intake form
 */
export async function deleteIntakeForm(
  formId: number,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<ApiResponse<null>> {
  return apiRequest<ApiResponse<null>>(
    "DELETE",
    `${BASE_URL}/forms/${formId}`,
    undefined,
    signal,
    authToken
  );
}

/**
 * Archive an intake form
 */
export async function archiveIntakeForm(
  formId: number,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<ApiResponse<IntakeForm>> {
  return apiRequest<ApiResponse<IntakeForm>>(
    "POST",
    `${BASE_URL}/forms/${formId}/archive`,
    undefined,
    signal,
    authToken
  );
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
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<PaginatedResponse<IntakeSubmission>> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", String(params.page));
  if (params.limit) queryParams.append("limit", String(params.limit));
  if (params.formId) queryParams.append("formId", String(params.formId));

  const url = `${BASE_URL}/submissions${queryParams.toString() ? `?${queryParams}` : ""}`;
  return apiRequest<PaginatedResponse<IntakeSubmission>>("GET", url, undefined, signal, authToken);
}

/**
 * Approve a submission
 */
export async function approveSubmission(
  submissionId: number,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<ApiResponse<{ submission: IntakeSubmission; createdEntity: unknown }>> {
  return apiRequest<ApiResponse<{ submission: IntakeSubmission; createdEntity: unknown }>>(
    "POST",
    `${BASE_URL}/submissions/${submissionId}/approve`,
    undefined,
    signal,
    authToken
  );
}

/**
 * Reject a submission
 */
export async function rejectSubmission(
  submissionId: number,
  reason: string,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<ApiResponse<IntakeSubmission>> {
  return apiRequest<ApiResponse<IntakeSubmission>>(
    "POST",
    `${BASE_URL}/submissions/${submissionId}/reject`,
    { reason },
    signal,
    authToken
  );
}

// ============================================================================
// Public Form API (No authentication required)
// ============================================================================

/**
 * Get CAPTCHA for public form
 */
export async function getCaptcha(): Promise<ApiResponse<{ question: string; token: string }>> {
  return apiRequest<ApiResponse<{ question: string; token: string }>>(
    "GET",
    `${BASE_URL}/public/captcha`
  );
}

/**
 * Get public form by slug
 */
export async function getPublicForm(
  tenantSlug: string,
  formSlug: string,
  resubmissionToken?: string
): Promise<ApiResponse<{
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
}>> {
  const queryParams = resubmissionToken ? `?token=${resubmissionToken}` : "";
  return apiRequest<ApiResponse<{
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
  }>>("GET", `${BASE_URL}/public/${tenantSlug}/${formSlug}${queryParams}`);
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
): Promise<ApiResponse<{
  submissionId: number;
  resubmissionToken: string;
  message: string;
}>> {
  return apiRequest<ApiResponse<{
    submissionId: number;
    resubmissionToken: string;
    message: string;
  }>>("POST", `${BASE_URL}/public/${tenantSlug}/${formSlug}`, data);
}
