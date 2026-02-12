/**
 * Normalized Shadow AI event model.
 * All events from diverse security sources are mapped to this schema
 * after ingestion and normalization.
 */

export type ActionType =
  | "access"
  | "upload"
  | "download"
  | "prompt"
  | "api_call"
  | "login"
  | "data_share"
  | "other";

export type DataClassification =
  | "public"
  | "internal"
  | "confidential"
  | "restricted"
  | "pii"
  | "phi"
  | "financial"
  | "unknown";

export type RiskLevel = "critical" | "high" | "medium" | "low" | "info";

export interface ShadowAIEvent {
  id?: number;
  tenant_id?: string;
  connector_id: number;
  raw_event_id?: string;
  timestamp: Date;
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
  created_at?: Date;
  updated_at?: Date;
}

export interface ShadowAIEventFilters {
  start_date?: Date;
  end_date?: Date;
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

export interface RawEvent {
  source_type: string;
  raw_data: Record<string, unknown>;
  received_at: Date;
}
