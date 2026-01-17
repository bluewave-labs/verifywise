/**
 * Post-Market Monitoring Types
 *
 * TypeScript types for the Post-Market Monitoring feature.
 */

// ============================================================================
// Configuration
// ============================================================================

export type FrequencyUnit = "days" | "weeks" | "months";

export interface PMMConfig {
  id?: number;
  project_id: number;
  is_active: boolean;
  frequency_value: number;
  frequency_unit: FrequencyUnit;
  start_date?: string;
  reminder_days: number;
  escalation_days: number;
  escalation_contact_id?: number;
  notification_hour: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PMMConfigWithDetails extends PMMConfig {
  project_title?: string;
  escalation_contact_name?: string;
  escalation_contact_email?: string;
  questions_count?: number;
  active_cycle?: PMMCycle | null;
}

export interface PMMConfigCreateRequest {
  project_id: number;
  frequency_value?: number;
  frequency_unit?: FrequencyUnit;
  start_date?: string;
  reminder_days?: number;
  escalation_days?: number;
  escalation_contact_id?: number;
  notification_hour?: number;
}

export interface PMMConfigUpdateRequest {
  is_active?: boolean;
  frequency_value?: number;
  frequency_unit?: FrequencyUnit;
  start_date?: string;
  reminder_days?: number;
  escalation_days?: number;
  escalation_contact_id?: number;
  notification_hour?: number;
}

// ============================================================================
// Questions
// ============================================================================

export type QuestionType = "yes_no" | "multi_select" | "multi_line_text";

export interface PMMQuestion {
  id?: number;
  config_id?: number | null;
  question_text: string;
  question_type: QuestionType;
  options?: string[];
  suggestion_text?: string;
  is_required: boolean;
  is_system_default: boolean;
  allows_flag_for_concern: boolean;
  display_order: number;
  eu_ai_act_article?: string;
  created_at?: string;
}

export interface PMMQuestionCreate {
  config_id?: number | null;
  question_text: string;
  question_type: QuestionType;
  options?: string[];
  suggestion_text?: string;
  is_required?: boolean;
  allows_flag_for_concern?: boolean;
  display_order?: number;
  eu_ai_act_article?: string;
}

export interface PMMQuestionUpdate {
  question_text?: string;
  question_type?: QuestionType;
  options?: string[];
  suggestion_text?: string;
  is_required?: boolean;
  allows_flag_for_concern?: boolean;
  display_order?: number;
  eu_ai_act_article?: string;
}

// ============================================================================
// Cycles
// ============================================================================

export type CycleStatus = "pending" | "in_progress" | "completed" | "escalated";

export interface PMMCycle {
  id?: number;
  config_id: number;
  cycle_number: number;
  status: CycleStatus;
  started_at: string;
  due_at: string;
  reminder_sent_at?: string;
  escalation_sent_at?: string;
  completed_at?: string;
  completed_by?: number;
  assigned_stakeholder_id?: number;
  created_at?: string;
}

export interface PMMCycleWithDetails extends PMMCycle {
  project_id?: number;
  project_title?: string;
  stakeholder_name?: string;
  stakeholder_email?: string;
  completed_by_name?: string;
  has_flagged_concerns?: boolean;
  responses_count?: number;
  questions_count?: number;
  is_overdue?: boolean;
  days_until_due?: number;
}

// ============================================================================
// Responses
// ============================================================================

export interface PMMResponse {
  id?: number;
  cycle_id: number;
  question_id: number;
  response_value: boolean | string | string[];
  is_flagged: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PMMResponseWithQuestion extends PMMResponse {
  question_text: string;
  question_type: QuestionType;
  suggestion_text?: string;
  eu_ai_act_article?: string;
}

export interface PMMResponseSave {
  question_id: number;
  response_value: boolean | string | string[];
  is_flagged?: boolean;
}

// ============================================================================
// Reports
// ============================================================================

export interface PMMReport {
  id?: number;
  cycle_id: number;
  file_id?: number;
  context_snapshot: PMMContextSnapshot;
  generated_at?: string;
  generated_by?: number;
}

export interface PMMReportWithDetails extends PMMReport {
  project_id?: number;
  project_title?: string;
  cycle_number?: number;
  completed_at?: string;
  completed_by_name?: string;
  has_flagged_concerns?: boolean;
  file_name?: string;
}

export interface PMMContextSnapshot {
  use_case_title: string;
  use_case_status: string;
  risks_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  models_count: number;
  model_risks_count: number;
  vendors_count: number;
  vendor_risks_count: number;
  captured_at: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface PMMCycleSubmitRequest {
  responses: PMMResponseSave[];
}

export interface PMMReportsFilterRequest {
  project_id?: number;
  start_date?: string;
  end_date?: string;
  completed_by?: number;
  flagged_only?: boolean;
  page?: number;
  limit?: number;
}

export interface PMMReportsResponse {
  reports: PMMReportWithDetails[];
  total: number;
  page: number;
  limit: number;
}
