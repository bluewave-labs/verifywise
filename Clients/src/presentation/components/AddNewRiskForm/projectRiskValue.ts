import {
  RiskLikelihood,
  MitigationStatus,
  RiskSeverity,
} from "../RiskLevel/riskValues";
import { RISK_LABELS, Likelihood, Severity } from "../RiskLevel/constants";

// Setting up risk-type
export type riskType = {
  id: number;
  name: string;
};

// Setting up risk constants
export const aiLifecyclePhase: riskType[] = [
  { id: 1, name: "Problem definition & planning" },
  { id: 2, name: "Data collection & processing" },
  { id: 3, name: "Model development & training" },
  { id: 4, name: "Model validation & testing" },
  { id: 5, name: "Deployment & integration" },
  { id: 6, name: "Monitoring & maintenance" },
  { id: 7, name: "Decommissioning & retirement" },
];

export const riskCategoryItems: riskType[] = [
  { id: 1, name: "Strategic risk" },
  { id: 2, name: "Operational risk" },
  { id: 3, name: "Compliance risk" },
  { id: 4, name: "Financial risk" },
  { id: 5, name: "Cybersecurity risk" },
  { id: 6, name: "Reputational risk" },
  { id: 7, name: "Legal risk" },
  { id: 8, name: "Technological risk" },
  { id: 9, name: "Third-party/vendor risk" },
  { id: 10, name: "Environmental risk" },
  { id: 11, name: "Human resources risk" },
  { id: 12, name: "Geopolitical risk" },
  { id: 13, name: "Fraud risk" },
  { id: 14, name: "Data privacy risk" },
  { id: 15, name: "Health and safety risk" },
];

// Setting up mitigation constants
export const mitigationStatusItems: riskType[] = [
  { id: 1, name: MitigationStatus.NotStarted },
  { id: 2, name: MitigationStatus.InProgress },
  { id: 3, name: MitigationStatus.Completed },
  { id: 4, name: MitigationStatus.OnHold },
  { id: 5, name: MitigationStatus.Deferred },
  { id: 6, name: MitigationStatus.Canceled },
  { id: 7, name: MitigationStatus.RequiresReview },
];

export const riskLevelItems: riskType[] = [
  { id: 1, name: RISK_LABELS.critical.text },
  { id: 2, name: RISK_LABELS.high.text },
  { id: 3, name: RISK_LABELS.medium.text },
  { id: 4, name: RISK_LABELS.low.text },
  { id: 5, name: RISK_LABELS.noRisk.text },
];

export const approvalStatusItems: riskType[] = [
  { id: 1, name: MitigationStatus.NotStarted },
  { id: 2, name: MitigationStatus.InProgress },
  { id: 3, name: MitigationStatus.Completed },
  { id: 4, name: MitigationStatus.OnHold },
  { id: 5, name: MitigationStatus.Deferred },
  { id: 6, name: MitigationStatus.Canceled },
  { id: 7, name: MitigationStatus.RequiresReview },
];

export const likelihoodItems: riskType[] = [
  { id: Likelihood.Rare, name: RiskLikelihood.Rare },
  { id: Likelihood.Unlikely, name: RiskLikelihood.Unlikely },
  { id: Likelihood.Possible, name: RiskLikelihood.Possible },
  { id: Likelihood.Likely, name: RiskLikelihood.Likely },
  { id: Likelihood.AlmostCertain, name: RiskLikelihood.AlmostCertain },
];

export const riskSeverityItems: riskType[] = [
  { id: Severity.Negligible, name: RiskSeverity.Negligible },
  { id: Severity.Minor, name: RiskSeverity.Minor },
  { id: Severity.Moderate, name: RiskSeverity.Moderate },
  { id: Severity.Major, name: RiskSeverity.Major },
  { id: Severity.Catastrophic, name: RiskSeverity.Catastrophic },
];
