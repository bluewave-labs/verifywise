import { ModelRiskCategory } from "../enums/model-risk-category.enum";
import { ModelRiskLevel } from "../enums/model-risk-level.enum";
import { ModelRiskStatus } from "../enums/model-risk-status.enum";

export interface IModelRisk {
  id?: number;
  riskName: string;
  riskCategory: ModelRiskCategory;
  riskLevel: ModelRiskLevel;
  status: ModelRiskStatus;
  owner: string;
  createdDate?: string;
  targetDate: string;
  lastUpdated?: string;
  description?: string;
  mitigationPlan?: string;
  impact?: string;
  likelihood?: string;
  keyMetrics?: string;
  currentValues?: string;
  threshold?: string;
  modelId?: number;
  modelName?: string;
  tenantId?: number;
  created_at?: Date;
  updated_at?: Date;
}