import { CreateProjectFormUser } from "./iUser";

export interface FormValues {
  vendorName: number;
  actionOwner: number;
  riskName: string;
  reviewDate: string;
  riskDescription: string;
}

export interface FormErrors {
  vendorName?: string;
  actionOwner?: string;
  riskName?: string;
  reviewDate?: string;
  riskDescription?: string;
}

export interface CreateProjectFormValues {
  project_title: string;
  owner: number;
  members: CreateProjectFormUser[];
  start_date: string;
  ai_risk_classification: number;
  type_of_high_risk_role: number;
  goal: string;
}

export interface CreateProjectFormErrors {
  projectTitle?: string;
  members?: string;
  owner?: string;
  startDate?: string;
  riskClassification?: string;
  typeOfHighRiskRole?: string;
  goal?: string;
}
