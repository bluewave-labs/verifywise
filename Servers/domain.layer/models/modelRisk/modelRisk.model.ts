import { Column, DataType, Model, Table } from "sequelize-typescript";
import { IModelRisk } from "../../interfaces/i.modelRisk";
import { ModelRiskCategory } from "../../enums/model-risk-category.enum";
import { ModelRiskLevel } from "../../enums/model-risk-level.enum";
import { ModelRiskStatus } from "../../enums/model-risk-status.enum";
import { ValidationException } from "../../exceptions/custom.exception";

@Table({
  tableName: "model_risks",
  timestamps: false,
})
export class ModelRiskModel
  extends Model<ModelRiskModel>
  implements IModelRisk
{
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "risk_name",
  })
  riskName!: string;

  @Column({
    type: DataType.ENUM(...Object.values(ModelRiskCategory)),
    allowNull: false,
    field: "risk_category",
  })
  riskCategory!: ModelRiskCategory;

  @Column({
    type: DataType.ENUM(...Object.values(ModelRiskLevel)),
    allowNull: false,
    field: "risk_level",
  })
  riskLevel!: ModelRiskLevel;

  @Column({
    type: DataType.ENUM(...Object.values(ModelRiskStatus)),
    allowNull: false,
    defaultValue: ModelRiskStatus.OPEN,
  })
  status!: ModelRiskStatus;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  owner!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: "target_date",
  })
  targetDate!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: "mitigation_plan",
  })
  mitigationPlan?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  impact?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  likelihood?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: "key_metrics",
  })
  keyMetrics?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: "current_values",
  })
  currentValues?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  threshold?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: "model_id",
  })
  modelId?: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "model_name",
  })
  modelName?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "tenant_id",
  })
  tenantId!: number;

  @Column({
    type: DataType.DATE,
  })
  created_at?: Date;

  @Column({
    type: DataType.DATE,
  })
  updated_at?: Date;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      return this.getDataValue('created_at')?.toISOString();
    }
  })
  createdDate?: string;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      return this.getDataValue('updated_at')?.toISOString();
    }
  })
  lastUpdated?: string;

  /**
   * Validate model risk data before saving
   */
  async validateModelRiskData(): Promise<void> {
    if (!this.riskName || !String(this.riskName).trim()) {
      throw new ValidationException(
        "Risk name is required",
        "riskName",
        this.riskName
      );
    }

    if (!this.riskCategory) {
      throw new ValidationException(
        "Risk category is required",
        "riskCategory",
        this.riskCategory
      );
    }

    if (!this.riskLevel) {
      throw new ValidationException(
        "Risk level is required",
        "riskLevel",
        this.riskLevel
      );
    }

    if (!this.status) {
      throw new ValidationException(
        "Status is required",
        "status",
        this.status
      );
    }

    if (!this.owner || !String(this.owner).trim()) {
      throw new ValidationException(
        "Owner is required",
        "owner",
        this.owner
      );
    }

    if (!this.targetDate) {
      throw new ValidationException(
        "Target date is required",
        "targetDate",
        this.targetDate
      );
    }

    if (!this.tenantId) {
      throw new ValidationException(
        "Tenant ID is required",
        "tenantId",
        this.tenantId
      );
    }
  }

  /**
   * Get model risk data without sensitive information
   */
  toSafeJSON(): any {
    return {
      id: this.id,
      riskName: this.riskName,
      riskCategory: this.riskCategory,
      riskLevel: this.riskLevel,
      status: this.status,
      owner: this.owner,
      createdDate: this.created_at?.toISOString(),
      targetDate: this.targetDate,
      lastUpdated: this.updated_at?.toISOString(),
      description: this.description,
      mitigationPlan: this.mitigationPlan,
      impact: this.impact,
      likelihood: this.likelihood,
      keyMetrics: this.keyMetrics,
      currentValues: this.currentValues,
      threshold: this.threshold,
      modelId: this.modelId,
      modelName: this.modelName,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
    };
  }

  /**
   * Convert model risk to JSON representation
   */
  toJSON(): any {
    return this.toSafeJSON();
  }

  /**
   * Create a new ModelRiskModel instance
   */
  static createNewModelRisk(
    data: Partial<IModelRisk>
  ): ModelRiskModel {
    const modelRisk = new ModelRiskModel({
      riskName: data.riskName || "",
      riskCategory: data.riskCategory || ModelRiskCategory.PERFORMANCE,
      riskLevel: data.riskLevel || ModelRiskLevel.MEDIUM,
      status: data.status || ModelRiskStatus.OPEN,
      owner: data.owner || "",
      targetDate: data.targetDate || new Date().toISOString(),
      description: data.description || "",
      mitigationPlan: data.mitigationPlan || "",
      impact: data.impact || "",
      likelihood: data.likelihood || "",
      keyMetrics: data.keyMetrics || "",
      currentValues: data.currentValues || "",
      threshold: data.threshold || "",
      modelId: data.modelId || undefined,
      modelName: data.modelName || "",
      tenantId: data.tenantId || 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return modelRisk;
  }

  constructor(init?: Partial<IModelRisk>) {
    super();
    Object.assign(this, init);
  }
}