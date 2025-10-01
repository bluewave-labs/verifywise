import {
  ModelRiskCategory,
  ModelRiskLevel,
  ModelRiskStatus,
} from "../../../interfaces/i.modelRisk";

export class ModelRiskModel {
  id?: number;
  riskName!: string;
  riskCategory!: ModelRiskCategory;
  riskLevel!: ModelRiskLevel;
  status!: ModelRiskStatus;
  owner!: string;
  targetDate!: string;
  description?: string;
  mitigationPlan?: string;
  impact?: string;
  likelihood?: string;
  keyMetrics?: string;
  currentValues?: string;
  threshold?: string;
  modelId?: number;
  modelName?: string;
  tenantId!: number;
  created_at?: Date;
  updated_at?: Date;
  createdDate?: string;
  lastUpdated?: string;

  constructor(data: ModelRiskModel) {
    this.id = data.id;
    this.riskName = data.riskName;
    this.riskCategory = data.riskCategory;
    this.riskLevel = data.riskLevel;
    this.status = data.status;
    this.owner = data.owner;
    this.targetDate = data.targetDate;
    this.description = data.description;
    this.mitigationPlan = data.mitigationPlan;
    this.impact = data.impact;
    this.likelihood = data.likelihood;
    this.keyMetrics = data.keyMetrics;
    this.currentValues = data.currentValues;
    this.threshold = data.threshold;
    this.modelId = data.modelId;
    this.modelName = data.modelName;
    this.tenantId = data.tenantId;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.createdDate = data.createdDate;
    this.lastUpdated = data.lastUpdated;
  }

  static createNewModelRisk(data: ModelRiskModel): ModelRiskModel {
    return new ModelRiskModel(data);
  }
}
