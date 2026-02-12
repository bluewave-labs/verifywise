/**
 * Policy types for Shadow AI governance rules.
 */

import { ActionType, DataClassification, RiskLevel } from "./shadow-ai-event";

export type PolicySeverity = "critical" | "high" | "medium" | "low";

export interface PolicyRule {
  /** What this rule evaluates */
  field: "ai_tool_name" | "ai_tool_category" | "action_type" | "data_classification" | "destination_url" | "user_identifier";
  /** Comparison operator */
  operator: "equals" | "not_equals" | "contains" | "in" | "not_in" | "matches";
  /** Value(s) to compare against */
  value: string | string[];
}

export interface PolicyRuleGroup {
  /** Logical operator between rules in this group */
  logic: "AND" | "OR";
  rules: PolicyRule[];
}

export interface ShadowAIPolicy {
  id?: number;
  tenant_id?: string;
  name: string;
  description?: string;
  department_scope?: string[] | null; // null = applies to all departments
  rules: PolicyRuleGroup;
  severity: PolicySeverity;
  is_active: boolean;
  created_by?: number;
  violation_count?: number;
  created_at?: Date;
  updated_at?: Date;
}

export type ViolationStatus = "open" | "acknowledged" | "resolved" | "excepted";

export interface ShadowAIViolation {
  id?: number;
  tenant_id?: string;
  event_id: number;
  policy_id: number;
  user_identifier?: string;
  department?: string;
  severity: PolicySeverity;
  description: string;
  status: ViolationStatus;
  resolved_by?: number;
  resolved_at?: Date;
  exception_id?: number;
  created_at?: Date;
  updated_at?: Date;
  // Joined fields
  policy_name?: string;
  event?: Record<string, unknown>;
}

export type ExceptionStatus = "pending" | "approved" | "expired" | "revoked";

export interface ShadowAIException {
  id?: number;
  tenant_id?: string;
  policy_id: number;
  department?: string;
  user_identifier?: string;
  reason: string;
  compensating_controls?: string;
  approved_by?: number;
  approved_at?: Date;
  expires_at?: Date;
  status: ExceptionStatus;
  created_at?: Date;
  updated_at?: Date;
  // Joined fields
  policy_name?: string;
}
