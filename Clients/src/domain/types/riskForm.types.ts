import { Dispatch, MutableRefObject, SetStateAction } from "react";
import { User } from "./User";

/**
 * Form values for risk creation/editing
 * Pure domain type with no framework dependencies
 */
export interface RiskFormValues {
  riskName: string;
  actionOwner: number;
  aiLifecyclePhase: number;
  riskDescription: string;
  riskCategory: number[];
  potentialImpact: string;
  assessmentMapping: number;
  controlsMapping: number;
  likelihood: number;
  riskSeverity: number;
  riskLevel: number;
  reviewNotes: string;
  applicableProjects: number[];
  applicableFrameworks: number[];
}

/**
 * Form values for risk mitigation
 * Pure domain type with no framework dependencies
 */
export interface MitigationFormValues {
  mitigationStatus: number;
  mitigationPlan: string;
  currentRiskLevel: number;
  implementationStrategy: string;
  deadline: string;
  doc: string;
  likelihood: number;
  riskSeverity: number;
  approver: number;
  approvalStatus: number;
  dateOfAssessment: string;
  recommendations: string;
}

/**
 * Props for AddNewRiskForm component
 * Pure domain type with no framework dependencies
 */
export interface AddNewRiskFormCoreProps {
  closePopup: () => void;
  popupStatus: string;
  initialRiskValues?: RiskFormValues;
  initialMitigationValues?: MitigationFormValues;
  onSuccess: () => void;
  onError?: (message: any) => void;
  onLoading?: (message: any) => void;
  users?: User[];
  usersLoading?: boolean;
  onSubmitRef?: MutableRefObject<(() => void) | null>;
  compactMode?: boolean;
}

/**
 * Props for IRiskSection component
 * Pure domain type with no framework dependencies
 */
export interface IRiskSectionProps {
  riskValues: IRiskFormValues;
  setRiskValues: Dispatch<SetStateAction<IRiskFormValues>>;
  riskErrors: IRiskFormErrors;
  userRoleName: string;
}

/**
 * Risk section props
 * Pure domain type with no framework dependencies
 */
export interface RiskSectionProps {
  closePopup: () => void;
  onSuccess: () => void;
  popupStatus: string;
}

/**
 * Risk form values interface
 * Pure domain type with no framework dependencies
 */
export interface IRiskFormValues {
  riskName: string;
  actionOwner: number;
  aiLifecyclePhase: number;
  riskDescription: string;
  riskCategory: number[];
  potentialImpact: string;
  assessmentMapping: number;
  controlsMapping: number;
  likelihood: number;
  riskSeverity: number;
  riskLevel: number;
  reviewNotes: string;
  applicableProjects: number[];
  applicableFrameworks: number[];
}

/**
 * Risk form errors interface
 * Pure domain type with no framework dependencies
 */
export interface IRiskFormErrors {
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

/**
 * Audit risk modal props
 * Pure domain type with no framework dependencies
 */
export interface IAuditRiskModalProps {
  onClose: () => void;
  risks: number[];
  _deletedRisks: number[];
  _setDeletedRisks: (deletedRisks: number[]) => void;
  _selectedRisks: number[];
  _setSelectedRisks: (selectedRisks: number[]) => void;
}

/**
 * Risk level form values
 * Pure domain type with no framework dependencies
 */
export interface IRiskLevelFormValues {
  likelihood: number;
  riskSeverity: number;
}

/**
 * Props for IRiskLevel component
 * Pure domain type with no framework dependencies
 * Note: handleOnSelectChange parameter type is defined in presentation adapter
 */
export interface IRiskLevelCoreProps {
  likelihood: number;
  riskSeverity: number;
  disabled?: boolean;
}

/**
 * Risk chip props
 * Pure domain type with no framework dependencies
 */
export interface IRiskChipProps {
  label?: string;
  backgroundColor?: string;
}
