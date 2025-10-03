import { Dispatch, SetStateAction } from "react";
import { Likelihood } from "../enums/likelihood.enum";
import { Severity } from "../enums/severity.enum";

export interface IMitigationSectionProps {
  mitigationValues: IMitigation;
  setMitigationValues: Dispatch<SetStateAction<IMitigation>>;
  mitigationErrors?: IMitigationErrors;
  userRoleName: string;
}

export interface IMitigation {
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

export interface IMitigationErrors {
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
