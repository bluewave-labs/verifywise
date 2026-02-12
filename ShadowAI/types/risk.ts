/**
 * Risk scoring types for Shadow AI events.
 */

import { RiskLevel } from "./shadow-ai-event";

export interface RiskFactors {
  data_sensitivity_score: number;  // 0-25 based on data classification
  tool_risk_score: number;         // 0-25 based on tool risk classification
  action_severity_score: number;   // 0-20 based on action type
  department_sensitivity_score: number; // 0-15 based on department
  policy_violation_score: number;  // 0-15 based on violation status
}

export interface RiskScoreResult {
  total_score: number; // 0-100
  risk_level: RiskLevel;
  factors: RiskFactors;
  recommendations: string[];
}

export interface RiskThresholds {
  critical: number; // >= this score
  high: number;
  medium: number;
  low: number;
  // Anything below low threshold is "info"
}

export const DEFAULT_RISK_THRESHOLDS: RiskThresholds = {
  critical: 80,
  high: 60,
  medium: 40,
  low: 20,
};

/** Department sensitivity ratings */
export const DEPARTMENT_SENSITIVITY: Record<string, number> = {
  finance: 15,
  legal: 15,
  hr: 12,
  executive: 12,
  compliance: 10,
  engineering: 5,
  marketing: 3,
  sales: 3,
  it: 5,
  default: 5,
};

/** Action type severity scores */
export const ACTION_SEVERITY: Record<string, number> = {
  upload: 20,
  data_share: 18,
  prompt: 12,
  api_call: 10,
  download: 8,
  login: 4,
  access: 5,
  other: 5,
};

/** Data classification sensitivity scores */
export const DATA_SENSITIVITY: Record<string, number> = {
  restricted: 25,
  phi: 25,
  pii: 22,
  financial: 20,
  confidential: 18,
  internal: 10,
  public: 2,
  unknown: 12,
};
