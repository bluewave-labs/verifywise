import { Likelihood, Severity } from "../RiskLevel/constants";
import { MutableRefObject } from "react";
import { User } from "../../../domain/types/User";

/**
 * Props for the AddNewRiskForm component
 */
export interface AddNewRiskFormProps {
  closePopup: () => void;
  popupStatus: string;
  initialRiskValues?: RiskFormValues; // New prop for initial values
  initialMitigationValues?: MitigationFormValues; // New prop for initial values
  onSuccess: () => void;
  onError?: (message: any) => void;
  onLoading?: (message: any) => void;
  users?: User[]; // Optional users data to avoid calling useUsers hook
  usersLoading?: boolean; // Optional loading state
  onSubmitRef?: MutableRefObject<(() => void) | null>; // Ref to expose submit function for StandardModal
  compactMode?: boolean; // When true, use flexible widths for sidebar layout
}

export type ProjectRisk = {
  riskName: string;
  actionOwner: number;
  aiLifecyclePhase: number | string;
  riskDescription: string;
  riskCategory: number[] | string[];
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
  riskCategory: number[];
  potentialImpact: string;
  assessmentMapping: number;
  controlsMapping: number;
  likelihood: Likelihood;
  riskSeverity: Severity;
  riskLevel: number;
  reviewNotes: string;
  applicableProjects: number[];
  applicableFrameworks: number[];
}

export interface RiskFormErrors {
  riskName?: string;
  actionOwner?: string;
  aiLifecyclePhase?: string;
  riskDescription?: string;
  riskCategory?: string[];
  potentialImpact?: string;
  assessmentMapping?: string;
  controlsMapping?: string;
  reviewNotes?: string;
  applicableProjects?: string;
  applicableFrameworks?: string;
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
