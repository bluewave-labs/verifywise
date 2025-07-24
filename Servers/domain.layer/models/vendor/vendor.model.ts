import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { UserModel } from "../user/user.model";
import { IVendor } from "../../interfaces/i.vendor";
import { numberValidation } from "../../validations/number.valid";
import {
  ValidationException,
  BusinessLogicException,
  NotFoundException,
} from "../../exceptions/custom.exception";

@Table({
  tableName: "vendors",
})
export class VendorModel extends Model<VendorModel> implements IVendor {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.INTEGER,
  })
  order_no?: number;

  @Column({
    type: DataType.STRING,
  })
  vendor_name!: string;

  @Column({
    type: DataType.STRING,
  })
  vendor_provides!: string;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
  })
  assignee!: number;

  @Column({
    type: DataType.STRING,
  })
  website!: string;

  @Column({
    type: DataType.STRING,
  })
  vendor_contact_person!: string;

  @Column({
    type: DataType.STRING,
  })
  review_result!: string;

  @Column({
    type: DataType.ENUM(
      "Not started",
      "In review",
      "Reviewed",
      "Requires follow-up"
    ),
  })
  review_status!:
    | "Not started"
    | "In review"
    | "Reviewed"
    | "Requires follow-up";

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
  })
  reviewer!: number;

  @Column({
    type: DataType.ENUM(
      "Very high risk",
      "High risk",
      "Medium risk",
      "Low risk",
      "Very low risk"
    ),
  })
  risk_status!:
    | "Very high risk"
    | "High risk"
    | "Medium risk"
    | "Low risk"
    | "Very low risk";

  @Column({
    type: DataType.DATE,
  })
  review_date!: Date;

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

  /**
   * Create a new vendor with comprehensive validation
   */
  static async createNewVendor(
    vendor_name: string,
    vendor_provides: string,
    assignee: number,
    website: string,
    vendor_contact_person: string,
    review_result: string,
    review_status:
      | "Not started"
      | "In review"
      | "Reviewed"
      | "Requires follow-up",
    reviewer: number,
    risk_status:
      | "Very high risk"
      | "High risk"
      | "Medium risk"
      | "Low risk"
      | "Very low risk",
    review_date: Date,
    order_no?: number,
    is_demo: boolean = false
  ): Promise<VendorModel> {
    // Validate required fields
    if (!vendor_name || vendor_name.trim().length === 0) {
      throw new ValidationException(
        "Vendor name is required",
        "vendor_name",
        vendor_name
      );
    }

    if (!vendor_provides || vendor_provides.trim().length === 0) {
      throw new ValidationException(
        "Vendor provides is required",
        "vendor_provides",
        vendor_provides
      );
    }

    if (!website || website.trim().length === 0) {
      throw new ValidationException("Website is required", "website", website);
    }

    if (!vendor_contact_person || vendor_contact_person.trim().length === 0) {
      throw new ValidationException(
        "Vendor contact person is required",
        "vendor_contact_person",
        vendor_contact_person
      );
    }

    if (!review_result || review_result.trim().length === 0) {
      throw new ValidationException(
        "Review result is required",
        "review_result",
        review_result
      );
    }

    // Validate assignee
    if (!numberValidation(assignee, 1)) {
      throw new ValidationException(
        "Valid assignee ID is required (must be >= 1)",
        "assignee",
        assignee
      );
    }

    // Validate reviewer
    if (!numberValidation(reviewer, 1)) {
      throw new ValidationException(
        "Valid reviewer ID is required (must be >= 1)",
        "reviewer",
        reviewer
      );
    }

    // Validate order_no if provided
    if (order_no !== undefined && !numberValidation(order_no, 1)) {
      throw new ValidationException(
        "Order number must be a positive integer",
        "order_no",
        order_no
      );
    }

    // Create and return the vendor model instance
    const vendor = new VendorModel();
    vendor.vendor_name = vendor_name.trim();
    vendor.vendor_provides = vendor_provides.trim();
    vendor.assignee = assignee;
    vendor.website = website.trim();
    vendor.vendor_contact_person = vendor_contact_person.trim();
    vendor.review_result = review_result.trim();
    vendor.review_status = review_status;
    vendor.reviewer = reviewer;
    vendor.risk_status = risk_status;
    vendor.review_date = review_date;
    vendor.order_no = order_no;
    vendor.is_demo = is_demo;
    vendor.created_at = new Date();

    return vendor;
  }

  /**
   * Update vendor information with validation
   */
  async updateVendor(updateData: {
    vendor_name?: string;
    vendor_provides?: string;
    assignee?: number;
    website?: string;
    vendor_contact_person?: string;
    review_result?: string;
    review_status?:
      | "Not started"
      | "In review"
      | "Reviewed"
      | "Requires follow-up";
    reviewer?: number;
    risk_status?:
      | "Very high risk"
      | "High risk"
      | "Medium risk"
      | "Low risk"
      | "Very low risk";
    review_date?: Date;
    order_no?: number;
  }): Promise<void> {
    // Validate vendor_name if provided
    if (updateData.vendor_name !== undefined) {
      if (
        !updateData.vendor_name ||
        updateData.vendor_name.trim().length === 0
      ) {
        throw new ValidationException(
          "Vendor name is required",
          "vendor_name",
          updateData.vendor_name
        );
      }
      this.vendor_name = updateData.vendor_name.trim();
    }

    // Validate vendor_provides if provided
    if (updateData.vendor_provides !== undefined) {
      if (
        !updateData.vendor_provides ||
        updateData.vendor_provides.trim().length === 0
      ) {
        throw new ValidationException(
          "Vendor provides is required",
          "vendor_provides",
          updateData.vendor_provides
        );
      }
      this.vendor_provides = updateData.vendor_provides.trim();
    }

    // Validate website if provided
    if (updateData.website !== undefined) {
      if (!updateData.website || updateData.website.trim().length === 0) {
        throw new ValidationException(
          "Website is required",
          "website",
          updateData.website
        );
      }
      this.website = updateData.website.trim();
    }

    // Validate vendor_contact_person if provided
    if (updateData.vendor_contact_person !== undefined) {
      if (
        !updateData.vendor_contact_person ||
        updateData.vendor_contact_person.trim().length === 0
      ) {
        throw new ValidationException(
          "Vendor contact person is required",
          "vendor_contact_person",
          updateData.vendor_contact_person
        );
      }
      this.vendor_contact_person = updateData.vendor_contact_person.trim();
    }

    // Validate review_result if provided
    if (updateData.review_result !== undefined) {
      if (
        !updateData.review_result ||
        updateData.review_result.trim().length === 0
      ) {
        throw new ValidationException(
          "Review result is required",
          "review_result",
          updateData.review_result
        );
      }
      this.review_result = updateData.review_result.trim();
    }

    // Validate assignee if provided
    if (updateData.assignee !== undefined) {
      if (!numberValidation(updateData.assignee, 1)) {
        throw new ValidationException(
          "Valid assignee ID is required (must be >= 1)",
          "assignee",
          updateData.assignee
        );
      }
      this.assignee = updateData.assignee;
    }

    // Validate reviewer if provided
    if (updateData.reviewer !== undefined) {
      if (!numberValidation(updateData.reviewer, 1)) {
        throw new ValidationException(
          "Valid reviewer ID is required (must be >= 1)",
          "reviewer",
          updateData.reviewer
        );
      }
      this.reviewer = updateData.reviewer;
    }

    // Validate order_no if provided
    if (updateData.order_no !== undefined) {
      if (!numberValidation(updateData.order_no, 1)) {
        throw new ValidationException(
          "Order number must be a positive integer",
          "order_no",
          updateData.order_no
        );
      }
      this.order_no = updateData.order_no;
    }

    // Update other fields if provided
    if (updateData.review_status !== undefined) {
      this.review_status = updateData.review_status;
    }

    if (updateData.risk_status !== undefined) {
      this.risk_status = updateData.risk_status;
    }

    if (updateData.review_date !== undefined) {
      this.review_date = updateData.review_date;
    }
  }

  /**
   * Validate vendor data before saving
   */
  async validateVendorData(): Promise<void> {
    if (!this.vendor_name || this.vendor_name.trim().length === 0) {
      throw new ValidationException(
        "Vendor name is required",
        "vendor_name",
        this.vendor_name
      );
    }

    if (!this.vendor_provides || this.vendor_provides.trim().length === 0) {
      throw new ValidationException(
        "Vendor provides is required",
        "vendor_provides",
        this.vendor_provides
      );
    }

    if (!this.website || this.website.trim().length === 0) {
      throw new ValidationException(
        "Website is required",
        "website",
        this.website
      );
    }

    if (
      !this.vendor_contact_person ||
      this.vendor_contact_person.trim().length === 0
    ) {
      throw new ValidationException(
        "Vendor contact person is required",
        "vendor_contact_person",
        this.vendor_contact_person
      );
    }

    if (!this.review_result || this.review_result.trim().length === 0) {
      throw new ValidationException(
        "Review result is required",
        "review_result",
        this.review_result
      );
    }

    if (!this.assignee || !numberValidation(this.assignee, 1)) {
      throw new ValidationException(
        "Valid assignee ID is required",
        "assignee",
        this.assignee
      );
    }

    if (!this.reviewer || !numberValidation(this.reviewer, 1)) {
      throw new ValidationException(
        "Valid reviewer ID is required",
        "reviewer",
        this.reviewer
      );
    }

    if (this.order_no !== undefined && !numberValidation(this.order_no, 1)) {
      throw new ValidationException(
        "Order number must be a positive integer",
        "order_no",
        this.order_no
      );
    }
  }

  /**
   * Check if vendor is a demo vendor
   */
  isDemoVendor(): boolean {
    return this.is_demo ?? false;
  }

  /**
   * Check if vendor can be modified
   */
  canBeModified(): boolean {
    if (this.isDemoVendor()) {
      throw new BusinessLogicException(
        "Demo vendors cannot be modified",
        "DEMO_VENDOR_RESTRICTION",
        { vendorId: this.id, vendorName: this.vendor_name }
      );
    }
    return true;
  }

  /**
   * Check if vendor review is completed
   */
  isReviewCompleted(): boolean {
    return this.review_status === "Reviewed";
  }

  /**
   * Check if vendor review is in progress
   */
  isReviewInProgress(): boolean {
    return this.review_status === "In review";
  }

  /**
   * Check if vendor review requires follow-up
   */
  requiresFollowUp(): boolean {
    return this.review_status === "Requires follow-up";
  }

  /**
   * Check if vendor has high risk status
   */
  hasHighRisk(): boolean {
    return (
      this.risk_status === "Very high risk" || this.risk_status === "High risk"
    );
  }

  /**
   * Get vendor summary for display
   */
  getSummary(): {
    id: number | undefined;
    vendorName: string;
    vendorProvides: string;
    reviewStatus: string;
    riskStatus: string;
    isDemo: boolean;
  } {
    return {
      id: this.id,
      vendorName: this.vendor_name,
      vendorProvides: this.vendor_provides,
      reviewStatus: this.review_status,
      riskStatus: this.risk_status,
      isDemo: this.isDemoVendor(),
    };
  }

  /**
   * Convert vendor model to JSON representation
   */
  toJSON(): any {
    return {
      id: this.id,
      order_no: this.order_no,
      vendor_name: this.vendor_name,
      vendor_provides: this.vendor_provides,
      assignee: this.assignee,
      website: this.website,
      vendor_contact_person: this.vendor_contact_person,
      review_result: this.review_result,
      review_status: this.review_status,
      reviewer: this.reviewer,
      risk_status: this.risk_status,
      review_date: this.review_date?.toISOString(),
      is_demo: this.is_demo,
      created_at: this.created_at?.toISOString(),
    };
  }

  /**
   * Create VendorModel instance from JSON data
   */
  static fromJSON(json: any): VendorModel {
    return new VendorModel(json);
  }

  /**
   * Static method to find vendor by ID with validation
   */
  static async findByIdWithValidation(id: number): Promise<VendorModel> {
    if (!numberValidation(id, 1)) {
      throw new ValidationException(
        "Valid ID is required (must be >= 1)",
        "id",
        id
      );
    }

    const vendor = await VendorModel.findByPk(id);
    if (!vendor) {
      throw new NotFoundException("Vendor not found", "Vendor", id);
    }

    return vendor;
  }

  constructor(init?: Partial<IVendor>) {
    super();
    Object.assign(this, init);
  }
}
