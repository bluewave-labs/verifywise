/**
 * Risk Engine - Calculates risk scores for Shadow AI events
 * based on multiple factors including data sensitivity, tool risk,
 * action type, department sensitivity, and policy violations.
 */

import { ShadowAIEvent, RiskLevel } from "../types/shadow-ai-event";
import {
  RiskScoreResult,
  RiskFactors,
  RiskThresholds,
  DEFAULT_RISK_THRESHOLDS,
  DEPARTMENT_SENSITIVITY,
  ACTION_SEVERITY,
  DATA_SENSITIVITY,
} from "../types/risk";
import { ToolRiskClassification } from "../types/inventory";

/** Tool risk classification scores */
const TOOL_RISK_SCORES: Record<ToolRiskClassification, number> = {
  critical: 25,
  high: 20,
  medium: 12,
  low: 5,
  unclassified: 10,
};

export class RiskEngine {
  private thresholds: RiskThresholds;

  constructor(thresholds?: RiskThresholds) {
    this.thresholds = thresholds || DEFAULT_RISK_THRESHOLDS;
  }

  /**
   * Calculate the risk score for a single event.
   */
  calculateRisk(
    event: ShadowAIEvent,
    toolRiskClassification: ToolRiskClassification = "unclassified",
    hasViolation: boolean = false
  ): RiskScoreResult {
    const factors = this.calculateFactors(event, toolRiskClassification, hasViolation);
    const totalScore = Math.min(
      100,
      factors.data_sensitivity_score +
        factors.tool_risk_score +
        factors.action_severity_score +
        factors.department_sensitivity_score +
        factors.policy_violation_score
    );

    const riskLevel = this.scoreToLevel(totalScore);
    const recommendations = this.generateRecommendations(event, factors, riskLevel);

    return {
      total_score: totalScore,
      risk_level: riskLevel,
      factors,
      recommendations,
    };
  }

  /**
   * Calculate individual risk factors.
   */
  private calculateFactors(
    event: ShadowAIEvent,
    toolRiskClassification: ToolRiskClassification,
    hasViolation: boolean
  ): RiskFactors {
    return {
      data_sensitivity_score:
        DATA_SENSITIVITY[event.data_classification || "unknown"] || DATA_SENSITIVITY.unknown,
      tool_risk_score: TOOL_RISK_SCORES[toolRiskClassification],
      action_severity_score:
        ACTION_SEVERITY[event.action_type] || ACTION_SEVERITY.other,
      department_sensitivity_score: this.getDepartmentScore(event.department),
      policy_violation_score: hasViolation ? 15 : 0,
    };
  }

  /**
   * Get department sensitivity score.
   */
  private getDepartmentScore(department?: string): number {
    if (!department) return DEPARTMENT_SENSITIVITY.default;
    const key = department.toLowerCase();
    return DEPARTMENT_SENSITIVITY[key] || DEPARTMENT_SENSITIVITY.default;
  }

  /**
   * Convert a numerical score to a risk level.
   */
  private scoreToLevel(score: number): RiskLevel {
    if (score >= this.thresholds.critical) return "critical";
    if (score >= this.thresholds.high) return "high";
    if (score >= this.thresholds.medium) return "medium";
    if (score >= this.thresholds.low) return "low";
    return "info";
  }

  /**
   * Generate contextual recommendations based on risk factors.
   */
  private generateRecommendations(
    event: ShadowAIEvent,
    factors: RiskFactors,
    riskLevel: RiskLevel
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === "critical" || riskLevel === "high") {
      recommendations.push("Immediate review recommended for this high-risk AI usage");
    }

    if (factors.data_sensitivity_score >= 20) {
      recommendations.push(
        `Sensitive data (${event.data_classification}) involved - verify data handling compliance`
      );
    }

    if (factors.tool_risk_score >= 20) {
      recommendations.push(
        `High-risk AI tool "${event.ai_tool_name}" - consider blocking or requiring approval`
      );
    }

    if (event.action_type === "upload" || event.action_type === "data_share") {
      recommendations.push(
        "Data exfiltration risk - review what data was shared with external AI service"
      );
    }

    if (factors.policy_violation_score > 0) {
      recommendations.push(
        "Active policy violation - initiate review workflow"
      );
    }

    if (factors.department_sensitivity_score >= 12) {
      recommendations.push(
        `Sensitive department "${event.department}" - enforce stricter AI usage controls`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("No immediate action required - continue monitoring");
    }

    return recommendations;
  }

  /**
   * Update risk thresholds.
   */
  setThresholds(thresholds: RiskThresholds): void {
    this.thresholds = thresholds;
  }
}
