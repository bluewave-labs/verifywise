import { Likelihood, Severity } from "../RiskLevel/constants";

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