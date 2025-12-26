import type { EntityGraphData } from '../../../../application/repository/entityGraph.repository';
import type { GapRule, GapResult, GapSeverity } from '../types';

/**
 * Helper to calculate days since creation
 */
function getDaysSinceCreation(createdAt?: string): number | undefined {
  if (!createdAt) return undefined;
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Helper to get highest severity from a list of gaps
 */
function getHighestSeverity(gaps: Array<{ severity: GapSeverity }>): GapSeverity {
  if (gaps.some(g => g.severity === 'critical')) return 'critical';
  if (gaps.some(g => g.severity === 'warning')) return 'warning';
  return 'info';
}

/**
 * Detects compliance gaps in entity data based on configured rules
 * Returns a map of entity IDs to their gap results
 */
export function detectGaps(
  data: EntityGraphData,
  rules: GapRule[]
): Map<string, GapResult> {
  const gapResults = new Map<string, GapResult>();
  const enabledRules = rules.filter(r => r.enabled);

  // Check models
  data.models.forEach(model => {
    const gaps: GapResult['gaps'] = [];
    const modelRules = enabledRules.filter(r => r.entityType === 'model');
    const daysSince = getDaysSinceCreation(model.created_at);

    modelRules.forEach(rule => {
      let hasProblem = false;
      switch (rule.requirement) {
        case 'has_risk':
          hasProblem = !data.risks.some(r => r.model_id === model.id);
          break;
        case 'has_control':
          // Check if any project this model is in has controls
          hasProblem = !model.projects?.some(pid =>
            data.controls.some(c => c.project_id === pid)
          );
          break;
        case 'has_owner':
          hasProblem = !model.owner;
          break;
      }
      if (hasProblem) {
        gaps.push({ requirement: rule.requirement, severity: rule.severity, daysSinceCreation: daysSince });
      }
    });

    if (gaps.length > 0) {
      gapResults.set(`model-${model.id}`, {
        entityId: `model-${model.id}`,
        entityType: 'model',
        gaps,
        highestSeverity: getHighestSeverity(gaps),
      });
    }
  });

  // Check risks
  data.risks.forEach(risk => {
    const gaps: GapResult['gaps'] = [];
    const riskRules = enabledRules.filter(r => r.entityType === 'risk');
    const daysSince = getDaysSinceCreation(risk.created_at);

    riskRules.forEach(rule => {
      let hasProblem = false;
      switch (rule.requirement) {
        case 'has_control':
          // Risks are mitigated by controls in their project
          const projectId = risk.project_id || (risk.model_id ? data.models.find(m => m.id === risk.model_id)?.projects?.[0] : undefined);
          hasProblem = !projectId || !data.controls.some(c => c.project_id === projectId);
          break;
        case 'has_severity':
          hasProblem = !risk.risk_level;
          break;
      }
      if (hasProblem) {
        gaps.push({ requirement: rule.requirement, severity: rule.severity, daysSinceCreation: daysSince });
      }
    });

    if (gaps.length > 0) {
      gapResults.set(`risk-${risk.id}`, {
        entityId: `risk-${risk.id}`,
        entityType: 'risk',
        gaps,
        highestSeverity: getHighestSeverity(gaps),
      });
    }
  });

  // Check controls
  data.controls.forEach(control => {
    const gaps: GapResult['gaps'] = [];
    const controlRules = enabledRules.filter(r => r.entityType === 'control');
    const daysSince = getDaysSinceCreation(control.created_at);

    controlRules.forEach(rule => {
      let hasProblem = false;
      switch (rule.requirement) {
        case 'has_evidence':
          hasProblem = !data.evidence.some(e => e.control_id === control.id);
          break;
      }
      if (hasProblem) {
        gaps.push({ requirement: rule.requirement, severity: rule.severity, daysSinceCreation: daysSince });
      }
    });

    if (gaps.length > 0) {
      gapResults.set(`control-${control.id}`, {
        entityId: `control-${control.id}`,
        entityType: 'control',
        gaps,
        highestSeverity: getHighestSeverity(gaps),
      });
    }
  });

  // Check vendors
  data.vendors.forEach(vendor => {
    const gaps: GapResult['gaps'] = [];
    const vendorRules = enabledRules.filter(r => r.entityType === 'vendor');
    const daysSince = getDaysSinceCreation(vendor.created_at);

    vendorRules.forEach(rule => {
      let hasProblem = false;
      switch (rule.requirement) {
        case 'has_risk_assessment':
          hasProblem = !data.risks.some(r => r.vendor_id === vendor.id);
          break;
        case 'has_owner':
          hasProblem = !vendor.owner;
          break;
      }
      if (hasProblem) {
        gaps.push({ requirement: rule.requirement, severity: rule.severity, daysSinceCreation: daysSince });
      }
    });

    if (gaps.length > 0) {
      gapResults.set(`vendor-${vendor.id}`, {
        entityId: `vendor-${vendor.id}`,
        entityType: 'vendor',
        gaps,
        highestSeverity: getHighestSeverity(gaps),
      });
    }
  });

  return gapResults;
}
