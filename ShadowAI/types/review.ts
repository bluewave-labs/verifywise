/**
 * Review workflow types for Shadow AI governance processes.
 */

export type ReviewType =
  | "tool_approval"
  | "violation_review"
  | "exception_request"
  | "periodic_audit";

export type ReviewStatus = "pending" | "in_progress" | "completed" | "escalated";

export interface ShadowAIReview {
  id?: number;
  tenant_id?: string;
  review_type: ReviewType;
  subject_id: number;
  subject_type: string; // e.g., "inventory", "violation", "exception"
  assigned_to?: number;
  status: ReviewStatus;
  decision?: string;
  notes?: string;
  completed_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  // Joined fields
  assignee_name?: string;
}

export interface ShadowAIEvidenceExport {
  id?: number;
  tenant_id?: string;
  name: string;
  date_range_start: Date;
  date_range_end: Date;
  filters?: Record<string, unknown>;
  export_format: "pdf" | "csv" | "json";
  file_path?: string;
  generated_by?: number;
  generated_at?: Date;
  created_at?: Date;
}

export interface ReviewFilters {
  review_type?: ReviewType;
  status?: ReviewStatus;
  assigned_to?: number;
  page?: number;
  limit?: number;
}

export interface EvidenceExportRequest {
  name: string;
  date_range_start: Date;
  date_range_end: Date;
  filters?: Record<string, unknown>;
  export_format: "pdf" | "csv" | "json";
}
