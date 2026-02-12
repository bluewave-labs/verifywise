// ==================== Connector Types ====================

export type ConnectorType = "splunk" | "sentinel" | "qradar" | "zscaler" | "netskope" | "syslog" | "webhook";
export type ConnectorStatus = "active" | "paused" | "error" | "configuring";

export interface IShadowAiConnector {
  id: number;
  name: string;
  type: ConnectorType;
  config: Record<string, unknown>;
  status: ConnectorStatus;
  last_sync_at?: string;
  last_error?: string;
  events_ingested: number;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

// ==================== Event Types ====================

export type ActionType = "access" | "upload" | "download" | "prompt" | "api_call" | "login" | "data_share" | "other";
export type DataClassification = "public" | "internal" | "confidential" | "restricted" | "pii" | "phi" | "financial" | "unknown";
export type RiskLevel = "critical" | "high" | "medium" | "low" | "info";

export interface IShadowAiEvent {
  id: number;
  connector_id: number;
  raw_event_id?: string;
  timestamp: string;
  user_identifier?: string;
  department?: string;
  ai_tool_name: string;
  ai_tool_category?: string;
  action_type: ActionType;
  data_classification?: DataClassification;
  source_ip?: string;
  destination_url?: string;
  metadata?: Record<string, unknown>;
  risk_score?: number;
  risk_level?: RiskLevel;
  created_at: string;
}

export interface IEventFilters {
  start_date?: string;
  end_date?: string;
  user_identifier?: string;
  department?: string;
  ai_tool_name?: string;
  ai_tool_category?: string;
  action_type?: ActionType;
  risk_level?: RiskLevel;
  connector_id?: number;
  page?: number;
  limit?: number;
}

// ==================== Inventory Types ====================

export type AIToolCategory =
  | "generative_ai" | "code_assistant" | "image_generation" | "video_generation"
  | "voice_ai" | "translation" | "data_analysis" | "search_ai"
  | "writing_assistant" | "chatbot" | "automation" | "ml_platform" | "other";

export type ToolRiskClassification = "critical" | "high" | "medium" | "low" | "unclassified";
export type ApprovalStatus = "discovered" | "under_review" | "approved" | "blocked";

export interface IShadowAiInventoryItem {
  id: number;
  tool_name: string;
  tool_domain: string;
  category: AIToolCategory;
  first_seen: string;
  last_seen: string;
  total_events: number;
  unique_users: number;
  departments: string[];
  risk_classification: ToolRiskClassification;
  approval_status: ApprovalStatus;
  notes?: string;
  created_at: string;
}

// ==================== Policy Types ====================

export type PolicySeverity = "critical" | "high" | "medium" | "low";

export interface IPolicyRule {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "in" | "not_in" | "matches";
  value: string | string[];
}

export interface IPolicyRuleGroup {
  logic: "AND" | "OR";
  rules: IPolicyRule[];
}

export interface IShadowAiPolicy {
  id: number;
  name: string;
  description?: string;
  department_scope?: string[];
  rules: IPolicyRuleGroup;
  severity: PolicySeverity;
  is_active: boolean;
  created_by?: number;
  violation_count?: number;
  created_at: string;
  updated_at?: string;
}

// ==================== Violation Types ====================

export type ViolationStatus = "open" | "acknowledged" | "resolved" | "excepted";

export interface IShadowAiViolation {
  id: number;
  event_id: number;
  policy_id: number;
  user_identifier?: string;
  department?: string;
  severity: PolicySeverity;
  description: string;
  status: ViolationStatus;
  resolved_by?: number;
  resolved_at?: string;
  exception_id?: number;
  policy_name?: string;
  created_at: string;
}

// ==================== Exception Types ====================

export type ExceptionStatus = "pending" | "approved" | "expired" | "revoked";

export interface IShadowAiException {
  id: number;
  policy_id: number;
  department?: string;
  user_identifier?: string;
  reason: string;
  compensating_controls?: string;
  approved_by?: number;
  approved_at?: string;
  expires_at?: string;
  status: ExceptionStatus;
  policy_name?: string;
  created_at: string;
}

// ==================== Review Types ====================

export type ReviewType = "tool_approval" | "violation_review" | "exception_request" | "periodic_audit";
export type ReviewStatus = "pending" | "in_progress" | "completed" | "escalated";

export interface IShadowAiReview {
  id: number;
  review_type: ReviewType;
  subject_id: number;
  subject_type: string;
  assigned_to?: number;
  status: ReviewStatus;
  decision?: string;
  notes?: string;
  completed_at?: string;
  assignee_name?: string;
  created_at: string;
}

// ==================== Evidence Export Types ====================

export interface IShadowAiEvidenceExport {
  id: number;
  name: string;
  date_range_start: string;
  date_range_end: string;
  filters?: Record<string, unknown>;
  export_format: "pdf" | "csv" | "json";
  file_path?: string;
  generated_by?: number;
  generated_at?: string;
  created_at: string;
}

// ==================== Dashboard Types ====================

export interface IShadowAiDashboardSummary {
  total_tools: number;
  total_events: number;
  active_users: number;
  open_violations: number;
  risk_distribution: Array<{ risk_level: string; count: number }>;
  top_tools: Array<{ ai_tool_name: string; event_count: number; user_count: number }>;
  recent_violations: IShadowAiViolation[];
  department_breakdown: Array<{ department: string; event_count: number }>;
}

export interface IShadowAiTrends {
  trends: Array<{ date: string; event_count: number; user_count: number; tool_count: number }>;
  risk_trends: Array<{ date: string; risk_level: string; count: number }>;
}
