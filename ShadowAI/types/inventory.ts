/**
 * Inventory types for Shadow AI tool discovery and tracking.
 */

export type ApprovalStatus = "discovered" | "under_review" | "approved" | "blocked";

export type AIToolCategory =
  | "generative_ai"
  | "code_assistant"
  | "image_generation"
  | "video_generation"
  | "voice_ai"
  | "translation"
  | "data_analysis"
  | "search_ai"
  | "writing_assistant"
  | "chatbot"
  | "automation"
  | "ml_platform"
  | "other";

export type ToolRiskClassification = "critical" | "high" | "medium" | "low" | "unclassified";

export interface ShadowAIInventoryItem {
  id?: number;
  tenant_id?: string;
  tool_name: string;
  tool_domain: string;
  category: AIToolCategory;
  first_seen: Date;
  last_seen: Date;
  total_events: number;
  unique_users: number;
  departments: string[];
  risk_classification: ToolRiskClassification;
  approval_status: ApprovalStatus;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface InventoryFilters {
  category?: AIToolCategory;
  approval_status?: ApprovalStatus;
  risk_classification?: ToolRiskClassification;
  search?: string;
  page?: number;
  limit?: number;
}
