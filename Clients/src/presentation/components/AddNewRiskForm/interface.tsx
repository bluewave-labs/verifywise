import { Likelihood, Severity } from "../RiskLevel/constants";

export type ProjectRisk = {
  riskName: string;
  actionOwner: number;
  aiLifecyclePhase: number | string;
  riskDescription: string;
  riskCategory: number | string;
  potentialImpact: string;
  assessmentMapping: number;
  controlsMapping: number;
  likelihood: Likelihood | string;
  riskSeverity: Severity;
  riskLevel: number;
  reviewNotes: string;
  mitigationStatus: number;
  mitigationPlan: string;
  currentRiskLevel: number;
  implementationStrategy: string;
  deadline: string;
  doc: string;
  approver: number;
  approvalStatus: number;
  dateOfAssessment: string;
  recommendations?: string;
};

export interface RiskFormValues {
  riskName: string;
  actionOwner: number;
  aiLifecyclePhase: number;
  riskDescription: string;
  riskCategory: number;
  potentialImpact: string;
  assessmentMapping: number;
  controlsMapping: number;
  likelihood: Likelihood;
  riskSeverity: Severity;
  riskLevel: number;
  reviewNotes: string;
}

export interface RiskFormErrors {
  riskName?: string;
  actionOwner?: string;
  aiLifecyclePhase?: string;
  riskDescription?: string;
  riskCategory?: string;
  potentialImpact?: string;
  assessmentMapping?: string;
  controlsMapping?: string;
  reviewNotes?: string;
}

export interface MitigationFormValues {
  mitigationStatus: number;
  mitigationPlan: string;
  currentRiskLevel: number;
  implementationStrategy: string;
  deadline: string;
  doc: string;
  likelihood: Likelihood;
  riskSeverity: Severity;
  approver: number;
  approvalStatus: number;
  dateOfAssessment: string;
  recommendations: string;
}

export interface MitigationFormErrors {
  mitigationStatus?: string;
  mitigationPlan?: string;
  currentRiskLevel?: string;
  implementationStrategy?: string;
  deadline?: string;
  doc?: string;
  approver?: string;
  approvalStatus?: string;
  dateOfAssessment?: string;
  recommendations?: string;
}
