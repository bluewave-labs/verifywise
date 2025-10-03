import { Likelihood } from "../enums/likelihood.enum";
import { Severity } from "../enums/severity.enum";

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
