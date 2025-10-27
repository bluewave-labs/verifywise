import { Dispatch, SetStateAction } from "react";
import {
  MitigationFormValues,
  RiskFormValues,
} from "../../presentation/components/AddNewRiskForm/interface";
import {
  Likelihood,
  RiskLevelSeverity,
  RiskLevelLikelihood,
} from "../enums/likelihood.enum";
import { Severity } from "../enums/severity.enum";
import { User } from "../types/User";
import { SelectChangeEvent } from "@mui/material";

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
}

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
