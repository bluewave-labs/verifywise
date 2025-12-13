import { Dispatch, SetStateAction } from "react";
import { SelectChangeEvent } from "@mui/material";
import {
  Likelihood,
  RiskLevelSeverity,
  RiskLevelLikelihood,
} from "../enums/likelihood.enum";
import { Severity } from "../enums/severity.enum";

export interface IRiskSectionProps {
  riskValues: IRiskFormValues;
  setRiskValues: Dispatch<SetStateAction<IRiskFormValues>>;
  riskErrors: IRiskFormErrors;
  userRoleName: string;
}

export interface RiskSectionProps {
  closePopup: () => void;
  onSuccess: () => void;
  popupStatus: string;
}

export interface IRiskFormValues {
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
 * Form values for creating or editing a risk mitigation (domain layer)
 */
export interface IMitigationFormValues {
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

export interface IAuditRiskModalProps {
  onClose: () => void;
  risks: number[];
  _deletedRisks: number[];
  _setDeletedRisks: (deletedRisks: number[]) => void;
  _selectedRisks: number[];
  _setSelectedRisks: (selectedRisks: number[]) => void;
}

export interface IRiskLevelFormValues {
  likelihood: RiskLevelLikelihood;
  riskSeverity: RiskLevelSeverity;
}

export interface IRiskLevelProps {
  likelihood: number;
  riskSeverity: number;
  handleOnSelectChange: (
    field: keyof IRiskLevelFormValues
  ) => (event: SelectChangeEvent<string | number>) => void;
  disabled?: boolean;
}

export interface IRiskChipProps {
  label?: string;
  backgroundColor?: string;
}
