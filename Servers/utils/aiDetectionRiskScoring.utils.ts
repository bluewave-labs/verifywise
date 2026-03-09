/**
 * @fileoverview AI Detection Risk Scoring Database Utils
 *
 * Database queries for risk scoring configuration and score storage.
 *
 * @module utils/aiDetectionRiskScoring
 */

import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";
import { DimensionKey, DEFAULT_DIMENSION_WEIGHTS } from "../config/riskScoringConfig";

// ============================================================================
// Organization ID Validation
// ============================================================================

function validateOrganizationId(organizationId: number): void {
  if (!organizationId || !Number.isInteger(organizationId) || organizationId <= 0) {
    throw new Error(`Invalid organization identifier: ${organizationId}`);
  }
}

// ============================================================================
// Types
// ============================================================================

export interface RiskScoringConfig {
  id: number;
  llm_enabled: boolean;
  llm_key_id: number | null;
  dimension_weights: Record<DimensionKey, number>;
  vulnerability_scan_enabled: boolean;
  updated_by: number | null;
  updated_at: string;
}

export interface FindingForScoring {
  id: number;
  finding_type: string;
  confidence: string;
  risk_level: string;
  provider: string | null;
  license_risk: string | null;
  governance_status: string | null;
  name: string;
  category: string;
  file_count: number;
}

// ============================================================================
// Risk Scoring Config Queries
// ============================================================================

/**
 * Get risk scoring config for an organization. Returns null if no config exists.
 */
export async function getRiskScoringConfigQuery(
  organizationId: number
): Promise<RiskScoringConfig | null> {
  validateOrganizationId(organizationId);
  const query = `
    SELECT * FROM ai_detection_risk_scoring_config
    WHERE organization_id = :organizationId
    ORDER BY id DESC LIMIT 1;
  `;

  const results = await sequelize.query(query, {
    replacements: { organizationId },
    type: QueryTypes.SELECT,
  });

  return (results as RiskScoringConfig[])[0] || null;
}

/**
 * Upsert risk scoring config for an organization.
 * If config exists, update it. Otherwise create it.
 */
export async function upsertRiskScoringConfigQuery(
  organizationId: number,
  data: {
    llm_enabled?: boolean;
    llm_key_id?: number | null;
    dimension_weights?: Record<DimensionKey, number>;
    vulnerability_scan_enabled?: boolean;
    updated_by: number;
  }
): Promise<RiskScoringConfig> {
  validateOrganizationId(organizationId);

  const existing = await getRiskScoringConfigQuery(organizationId);

  if (existing) {
    const setClauses: string[] = ["updated_at = NOW()"];
    const replacements: Record<string, unknown> = {
      id: existing.id,
      organizationId,
      updated_by: data.updated_by,
    };
    setClauses.push("updated_by = :updated_by");

    if (data.llm_enabled !== undefined) {
      setClauses.push("llm_enabled = :llm_enabled");
      replacements.llm_enabled = data.llm_enabled;
    }
    if (data.llm_key_id !== undefined) {
      setClauses.push("llm_key_id = :llm_key_id");
      replacements.llm_key_id = data.llm_key_id;
    }
    if (data.dimension_weights !== undefined) {
      setClauses.push("dimension_weights = :dimension_weights");
      replacements.dimension_weights = JSON.stringify(data.dimension_weights);
    }
    if (data.vulnerability_scan_enabled !== undefined) {
      setClauses.push("vulnerability_scan_enabled = :vulnerability_scan_enabled");
      replacements.vulnerability_scan_enabled = data.vulnerability_scan_enabled;
    }

    const query = `
      UPDATE ai_detection_risk_scoring_config
      SET ${setClauses.join(", ")}
      WHERE id = :id AND organization_id = :organizationId
      RETURNING *;
    `;

    const results = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return (results as RiskScoringConfig[])[0];
  } else {
    const query = `
      INSERT INTO ai_detection_risk_scoring_config
        (organization_id, llm_enabled, llm_key_id, dimension_weights, vulnerability_scan_enabled, updated_by, updated_at)
      VALUES
        (:organizationId, :llm_enabled, :llm_key_id, :dimension_weights, :vulnerability_scan_enabled, :updated_by, NOW())
      RETURNING *;
    `;

    const [results] = await sequelize.query(query, {
      replacements: {
        organizationId,
        llm_enabled: data.llm_enabled ?? false,
        llm_key_id: data.llm_key_id ?? null,
        dimension_weights: JSON.stringify(
          data.dimension_weights ?? DEFAULT_DIMENSION_WEIGHTS
        ),
        vulnerability_scan_enabled: data.vulnerability_scan_enabled ?? false,
        updated_by: data.updated_by,
      },
    });

    return (results as RiskScoringConfig[])[0];
  }
}

// ============================================================================
// Scan Risk Score Queries
// ============================================================================

/**
 * Update risk score on a scan record.
 */
export async function updateScanRiskScoreQuery(
  scanId: number,
  score: number,
  grade: string,
  details: Record<string, unknown>,
  organizationId: number
): Promise<void> {
  validateOrganizationId(organizationId);
  const query = `
    UPDATE ai_detection_scans
    SET
      risk_score = :score,
      risk_score_grade = :grade,
      risk_score_details = :details,
      risk_score_calculated_at = NOW(),
      updated_at = NOW()
    WHERE id = :scanId AND organization_id = :organizationId;
  `;

  await sequelize.query(query, {
    replacements: {
      scanId,
      score,
      grade,
      details: JSON.stringify(details),
      organizationId,
    },
    type: QueryTypes.UPDATE,
  });
}

// ============================================================================
// Findings for Scoring
// ============================================================================

/**
 * Get all findings for a scan in a lightweight format suitable for scoring.
 */
export async function getAllFindingsForScoringQuery(
  scanId: number,
  organizationId: number
): Promise<FindingForScoring[]> {
  validateOrganizationId(organizationId);
  const query = `
    SELECT
      id,
      finding_type,
      confidence,
      COALESCE(risk_level, 'medium') as risk_level,
      provider,
      license_risk,
      governance_status,
      name,
      category,
      file_count
    FROM ai_detection_findings
    WHERE scan_id = :scanId AND organization_id = :organizationId
    ORDER BY
      CASE confidence
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
      END,
      file_count DESC;
  `;

  const results = await sequelize.query(query, {
    replacements: { scanId, organizationId },
    type: QueryTypes.SELECT,
  });

  return results as FindingForScoring[];
}

