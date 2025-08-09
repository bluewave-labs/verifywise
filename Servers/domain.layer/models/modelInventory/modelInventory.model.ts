import { Column, DataType, Model, Table } from "sequelize-typescript";
import { IModelInventory } from "../../interfaces/i.modelInventory";
import { ModelInventoryStatus } from "../../enums/model-inventory-status.enum";
import { ValidationException } from "../../exceptions/custom.exception";

@Table({
  tableName: "model_inventory",
  timestamps: true,
})
export class ModelInventoryModel
  extends Model<ModelInventoryModel>
  implements IModelInventory
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
  })
  provider_model!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  version!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  approver!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  capabilities!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  security_assessment!: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(ModelInventoryStatus)),
    allowNull: false,
    defaultValue: ModelInventoryStatus.PENDING,
  })
  status!: ModelInventoryStatus;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  status_date!: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_demo?: boolean;

  @Column({
    type: DataType.DATE,
  })
  created_at?: Date;

  @Column({
    type: DataType.DATE,
  })
  updated_at?: Date;

  /**
   * Validate model inventory data before saving
   */
  async validateModelInventoryData(): Promise<void> {
    if (!this.provider_model?.trim()) {
      throw new ValidationException(
        "Provider/Model is required",
        "provider_model",
        this.provider_model
      );
    }

    if (!this.version?.trim()) {
      throw new ValidationException(
        "Version is required",
        "version",
        this.version
      );
    }

    if (!this.approver?.trim()) {
      throw new ValidationException(
        "Approver is required",
        "approver",
        this.approver
      );
    }

    if (!this.capabilities?.trim()) {
      throw new ValidationException(
        "Capabilities are required",
        "capabilities",
        this.capabilities
      );
    }

    if (!this.status_date) {
      throw new ValidationException(
        "Status date is required",
        "status_date",
        this.status_date
      );
    }
  }

  /**
   * Check if model inventory is a demo entry
   */
  isDemoModelInventory(): boolean {
    return this.is_demo ?? false;
  }

  /**
   * Check if model inventory can be modified by user
   */
  canBeModifiedBy(user: any): boolean {
    // Demo model inventory can only be modified by demo users or admins
    if (this.isDemoModelInventory()) {
      return user.is_demo || user.role_id === 1;
    }

    // Regular model inventory can be modified by any authenticated user
    return true;
  }

  /**
   * Update status with automatic status_date update
   */
  async updateStatus(newStatus: ModelInventoryStatus): Promise<void> {
    if (!Object.values(ModelInventoryStatus).includes(newStatus)) {
      throw new ValidationException(
        "Invalid status value",
        "status",
        newStatus
      );
    }

    this.status = newStatus;
    this.status_date = new Date();
    this.updated_at = new Date();
  }

  /**
   * Toggle security assessment status
   */
  async toggleSecurityAssessment(): Promise<void> {
    this.security_assessment = !this.security_assessment;
    this.updated_at = new Date();
  }

  /**
   * Get security assessment badge text
   */
  getSecurityAssessmentBadge(): string {
    return this.security_assessment ? "Yes" : "No";
  }

  /**
   * Get status badge text
   */
  getStatusBadge(): string {
    return this.status;
  }

  /**
   * Check if model inventory is approved
   */
  isApproved(): boolean {
    return this.status === ModelInventoryStatus.APPROVED;
  }

  /**
   * Check if model inventory is restricted
   */
  isRestricted(): boolean {
    return this.status === ModelInventoryStatus.RESTRICTED;
  }

  /**
   * Check if model inventory is pending
   */
  isPending(): boolean {
    return this.status === ModelInventoryStatus.PENDING;
  }

  /**
   * Get model inventory data without sensitive information
   */
  toSafeJSON(): any {
    return {
      id: this.id,
      provider_model: this.provider_model,
      version: this.version,
      approver: this.approver,
      capabilities: this.capabilities,
      security_assessment: this.security_assessment,
      status: this.status,
      status_date: this.status_date?.toISOString(),
      is_demo: this.is_demo,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
    };
  }

  /**
   * Create ModelInventoryModel instance from JSON data
   */
  static fromJSON(json: any): ModelInventoryModel {
    return new ModelInventoryModel(json);
  }

  /**
   * Convert model inventory to JSON representation
   */
  toJSON(): any {
    return {
      id: this.id,
      provider_model: this.provider_model,
      version: this.version,
      approver: this.approver,
      capabilities: this.capabilities,
      security_assessment: this.security_assessment,
      status: this.status,
      status_date: this.status_date?.toISOString(),
      is_demo: this.is_demo,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
    };
  }

  /**
   * Check if model inventory is active (not demo or recent)
   */
  isActive(): boolean {
    if (this.isDemoModelInventory()) {
      return false;
    }

    // Consider model inventory active if created within the last 30 days
    if (this.created_at) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return this.created_at > thirtyDaysAgo;
    }

    return true; // New model inventory entries are considered active
  }

  /**
   * Get model inventory age in days
   */
  getAgeInDays(): number {
    if (!this.created_at) {
      return 0;
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.created_at.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if model inventory is recent (created within specified days)
   */
  isRecent(days: number = 7): boolean {
    return this.getAgeInDays() <= days;
  }

  /**
   * Get full model name (provider + version)
   */
  getFullModelName(): string {
    return `${this.provider_model} ${this.version}`.trim();
  }

  constructor(init?: Partial<IModelInventory>) {
    super();
    Object.assign(this, init);
  }
}
