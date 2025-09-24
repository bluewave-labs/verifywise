export enum ModelRiskCategory {
  PERFORMANCE = "Performance",
  BIAS = "Bias & Fairness", 
  SECURITY = "Security",
  DATA_QUALITY = "Data Quality",
  COMPLIANCE = "Compliance"
}

export enum ModelRiskLevel {
  LOW = "Low",
  MEDIUM = "Medium", 
  HIGH = "High",
  CRITICAL = "Critical"
}

export enum ModelRiskStatus {
  OPEN = "Open",
  IN_PROGRESS = "In Progress",
  RESOLVED = "Resolved", 
  ACCEPTED = "Accepted"
}

export interface IModelRisk {
  id?: number;
  riskName: string;
  riskCategory: ModelRiskCategory;
  riskLevel: ModelRiskLevel;
  status: ModelRiskStatus;
  owner: string;
  createdDate: string;
  targetDate: string;
  lastUpdated: string;
  description?: string;
  mitigationPlan?: string;
  impact?: string;
  likelihood?: string;
  keyMetrics?: string;
  currentValues?: string;
  threshold?: string;
  modelId?: number; // Optional link to specific model
  modelName?: string; // For display purposes
}

export interface IModelRiskFormData {
  riskName: string;
  riskCategory: ModelRiskCategory;
  riskLevel: ModelRiskLevel;
  status: ModelRiskStatus;
  owner: string;
  targetDate: string;
  description?: string;
  mitigationPlan?: string;
  impact?: string;
  likelihood?: string;
  keyMetrics?: string;
  currentValues?: string;
  threshold?: string;
  modelId?: number;
}