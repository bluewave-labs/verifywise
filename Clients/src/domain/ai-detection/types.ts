/**
 * @fileoverview AI Detection Type Definitions
 *
 * Frontend types for AI Detection feature.
 *
 * @module domain/ai-detection/types
 */

// ============================================================================
// Scan Types
// ============================================================================

export type ScanStatus =
  | "pending"
  | "cloning"
  | "scanning"
  | "completed"
  | "failed"
  | "cancelled";

export type ConfidenceLevel = "high" | "medium" | "low";

export type RiskLevel = "high" | "medium" | "low";

export type GovernanceStatus = "reviewed" | "approved" | "flagged";

export interface TriggeredByUser {
  id: number;
  name: string;
  surname?: string;
}

export interface Scan {
  id: number;
  repository_url: string;
  repository_owner: string;
  repository_name: string;
  status: ScanStatus;
  findings_count: number;
  files_scanned: number;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  error_message?: string;
  triggered_by: TriggeredByUser;
  created_at: string;
}

// ============================================================================
// Finding Types
// ============================================================================

export interface FilePath {
  path: string;
  line_number: number | null;
  matched_text: string;
}

export interface Finding {
  id: number;
  finding_type: "library" | "dependency" | "api_call" | "secret";
  category: string;
  name: string;
  provider: string;
  confidence: ConfidenceLevel;
  risk_level: RiskLevel;
  description?: string;
  documentation_url?: string;
  file_count: number;
  file_paths: FilePath[];
  governance_status?: GovernanceStatus | null;
  governance_updated_at?: string;
  governance_updated_by?: number;
}

// ============================================================================
// Security Finding Types (Model Security Scanning)
// ============================================================================

export type SecuritySeverity = "critical" | "high" | "medium" | "low";

export interface SecurityFinding {
  id: number;
  finding_type: "model_security";
  category: string;
  name: string;
  provider: string;
  confidence: ConfidenceLevel;
  description?: string;
  documentation_url?: string;
  file_count: number;
  file_paths: FilePath[];
  // Security-specific fields
  severity: SecuritySeverity;
  cwe_id: string;
  cwe_name: string;
  owasp_ml_id: string;
  owasp_ml_name: string;
  threat_type: string;
  operator_name: string;
  module_name: string;
}

export interface SecurityFindingsBySeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface SecuritySummary {
  total: number;
  by_severity: SecurityFindingsBySeverity;
  by_threat_type: Record<string, number>;
  model_files_scanned: number;
}

export interface SecurityFindingsResponse {
  findings: SecurityFinding[];
  pagination: Pagination;
}

export interface GetSecurityFindingsParams {
  page?: number;
  limit?: number;
  severity?: SecuritySeverity;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ScanStatusResponse {
  id: number;
  status: ScanStatus;
  progress: number;
  current_file?: string;
  files_scanned: number;
  total_files?: number;
  findings_count: number;
  error_message?: string;
}

export interface FindingsByConfidence {
  high: number;
  medium: number;
  low: number;
}

export interface FindingsByType {
  library: number;
  dependency: number;
  api_call: number;
  secret: number;
}

export interface ScanSummary {
  total: number;
  by_confidence: FindingsByConfidence;
  by_provider: Record<string, number>;
  by_finding_type?: FindingsByType;
}

export interface ScanResponse {
  scan: Scan;
  summary: ScanSummary;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface FindingsResponse {
  findings: Finding[];
  pagination: Pagination;
}

export interface ScansResponse {
  scans: Scan[];
  pagination: Pagination;
}

// ============================================================================
// API Request Types
// ============================================================================

export interface StartScanRequest {
  repository_url: string;
}

export interface GetScansParams {
  page?: number;
  limit?: number;
  status?: ScanStatus;
}

export interface GetFindingsParams {
  page?: number;
  limit?: number;
  confidence?: ConfidenceLevel;
  finding_type?: "library" | "dependency" | "api_call" | "secret";
}

// ============================================================================
// UI State Types
// ============================================================================

export interface ScanState {
  isScanning: boolean;
  currentScan: Scan | null;
  progress: ScanStatusResponse | null;
  error: string | null;
}

export interface FindingsState {
  findings: Finding[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
}

export interface HistoryState {
  scans: Scan[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Helper Types
// ============================================================================

export interface GroupedFindings {
  [provider: string]: Finding[];
}

export interface ConfidenceStats {
  high: { count: number; percentage: number };
  medium: { count: number; percentage: number };
  low: { count: number; percentage: number };
}

// ============================================================================
// Governance Types
// ============================================================================

export interface GovernanceSummary {
  total: number;
  reviewed: number;
  approved: number;
  flagged: number;
  unreviewed: number;
}

export interface UpdateGovernanceStatusRequest {
  governance_status: GovernanceStatus | null;
}

export interface UpdateGovernanceStatusResponse {
  id: number;
  governance_status: GovernanceStatus | null;
  governance_updated_at: string;
  governance_updated_by: number;
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface AIDetectionStats {
  total_scans: number;
  completed_scans: number;
  total_findings: number;
  unique_repositories: number;
  top_providers: { provider: string; count: number }[];
  findings_by_confidence: { high: number; medium: number; low: number };
  findings_by_type: { library: number; api_call: number; dependency: number; secret: number };
  security_findings: number;
  recent_activity: { date: string; scans: number; findings: number }[];
}
