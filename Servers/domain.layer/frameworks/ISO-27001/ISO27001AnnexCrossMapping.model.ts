import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { numberValidation } from "../../validations/number.valid";
import { ValidationException } from "../../exceptions/custom.exception";
import { ISO27001AnnexControlModel } from "./iso27001AnnexControl.model";
import { IISO27001AnnexCrossMapping } from "../../interfaces/i.ISO27001AnnexCrossMapping";

@Table({
  tableName: "iso27001annex_cross_mapping",
})
export class ISO27001AnnexCrossMappingModel
  extends Model<ISO27001AnnexCrossMappingModel>
  implements IISO27001AnnexCrossMapping
{
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  clause_no!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  order_no!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  clause_title!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  relevance!: string;

  @ForeignKey(() => ISO27001AnnexControlModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  iso27001annex_control_id!: number;

  /**
   * Create a new ISO27001 Annex Cross Mapping
   */
  static async createNewCrossMapping(
    clause_no: number,
    order_no: number,
    clause_title: string,
    relevance: string,
    iso27001annex_control_id: number
  ): Promise<ISO27001AnnexCrossMappingModel> {
    // Validate clause_no
    if (!numberValidation(clause_no, 1)) {
      throw new ValidationException(
        "Clause number must be a positive integer",
        "clause_no",
        clause_no
      );
    }

    // Validate order_no
    if (!numberValidation(order_no, 1)) {
      throw new ValidationException(
        "Order number must be a positive integer",
        "order_no",
        order_no
      );
    }

    // Validate clause_title
    if (!clause_title || clause_title.trim().length === 0) {
      throw new ValidationException(
        "Clause title is required",
        "clause_title",
        clause_title
      );
    }

    if (clause_title.trim().length < 3) {
      throw new ValidationException(
        "Clause title must be at least 3 characters long",
        "clause_title",
        clause_title
      );
    }

    if (clause_title.trim().length > 255) {
      throw new ValidationException(
        "Clause title must not exceed 255 characters",
        "clause_title",
        clause_title
      );
    }

    // Validate relevance
    if (!relevance || relevance.trim().length === 0) {
      throw new ValidationException(
        "Relevance is required",
        "relevance",
        relevance
      );
    }

    if (relevance.trim().length < 5) {
      throw new ValidationException(
        "Relevance must be at least 5 characters long",
        "relevance",
        relevance
      );
    }

    if (relevance.trim().length > 500) {
      throw new ValidationException(
        "Relevance must not exceed 500 characters",
        "relevance",
        relevance
      );
    }

    // Validate iso27001annex_control_id
    if (!numberValidation(iso27001annex_control_id, 1)) {
      throw new ValidationException(
        "Valid annex control ID is required",
        "iso27001annex_control_id",
        iso27001annex_control_id
      );
    }

    // Create and return the cross mapping model instance
    const crossMapping = new ISO27001AnnexCrossMappingModel();
    crossMapping.clause_no = clause_no;
    crossMapping.order_no = order_no;
    crossMapping.clause_title = clause_title.trim();
    crossMapping.relevance = relevance.trim();
    crossMapping.iso27001annex_control_id = iso27001annex_control_id;

    return crossMapping;
  }

  /**
   * Update cross mapping information
   */
  async updateCrossMapping(updateData: {
    clause_no?: number;
    order_no?: number;
    clause_title?: string;
    relevance?: string;
    iso27001annex_control_id?: number;
  }): Promise<void> {
    // Validate clause_no if provided
    if (updateData.clause_no !== undefined) {
      if (!numberValidation(updateData.clause_no, 1)) {
        throw new ValidationException(
          "Clause number must be a positive integer",
          "clause_no",
          updateData.clause_no
        );
      }
      this.clause_no = updateData.clause_no;
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

    // Validate clause_title if provided
    if (updateData.clause_title !== undefined) {
      if (
        !updateData.clause_title ||
        updateData.clause_title.trim().length === 0
      ) {
        throw new ValidationException(
          "Clause title is required",
          "clause_title",
          updateData.clause_title
        );
      }
      if (updateData.clause_title.trim().length < 3) {
        throw new ValidationException(
          "Clause title must be at least 3 characters long",
          "clause_title",
          updateData.clause_title
        );
      }
      if (updateData.clause_title.trim().length > 255) {
        throw new ValidationException(
          "Clause title must not exceed 255 characters",
          "clause_title",
          updateData.clause_title
        );
      }
      this.clause_title = updateData.clause_title.trim();
    }

    // Validate relevance if provided
    if (updateData.relevance !== undefined) {
      if (!updateData.relevance || updateData.relevance.trim().length === 0) {
        throw new ValidationException(
          "Relevance is required",
          "relevance",
          updateData.relevance
        );
      }
      if (updateData.relevance.trim().length < 5) {
        throw new ValidationException(
          "Relevance must be at least 5 characters long",
          "relevance",
          updateData.relevance
        );
      }
      if (updateData.relevance.trim().length > 500) {
        throw new ValidationException(
          "Relevance must not exceed 500 characters",
          "relevance",
          updateData.relevance
        );
      }
      this.relevance = updateData.relevance.trim();
    }

    // Validate iso27001annex_control_id if provided
    if (updateData.iso27001annex_control_id !== undefined) {
      if (!numberValidation(updateData.iso27001annex_control_id, 1)) {
        throw new ValidationException(
          "Valid annex control ID is required",
          "iso27001annex_control_id",
          updateData.iso27001annex_control_id
        );
      }
      this.iso27001annex_control_id = updateData.iso27001annex_control_id;
    }
  }

  /**
   * Validate cross mapping data before saving
   */
  async validateCrossMappingData(): Promise<void> {
    if (!numberValidation(this.clause_no, 1)) {
      throw new ValidationException(
        "Valid clause number is required (must be >= 1)",
        "clause_no",
        this.clause_no
      );
    }

    if (!numberValidation(this.order_no, 1)) {
      throw new ValidationException(
        "Valid order number is required (must be >= 1)",
        "order_no",
        this.order_no
      );
    }

    if (!this.clause_title || this.clause_title.trim().length === 0) {
      throw new ValidationException(
        "Clause title is required",
        "clause_title",
        this.clause_title
      );
    }

    if (this.clause_title.trim().length < 3) {
      throw new ValidationException(
        "Clause title must be at least 3 characters long",
        "clause_title",
        this.clause_title
      );
    }

    if (this.clause_title.trim().length > 255) {
      throw new ValidationException(
        "Clause title must not exceed 255 characters",
        "clause_title",
        this.clause_title
      );
    }

    if (!this.relevance || this.relevance.trim().length === 0) {
      throw new ValidationException(
        "Relevance is required",
        "relevance",
        this.relevance
      );
    }

    if (this.relevance.trim().length < 5) {
      throw new ValidationException(
        "Relevance must be at least 5 characters long",
        "relevance",
        this.relevance
      );
    }

    if (this.relevance.trim().length > 500) {
      throw new ValidationException(
        "Relevance must not exceed 500 characters",
        "relevance",
        this.relevance
      );
    }

    if (!numberValidation(this.iso27001annex_control_id, 1)) {
      throw new ValidationException(
        "Valid annex control ID is required",
        "iso27001annex_control_id",
        this.iso27001annex_control_id
      );
    }
  }

  /**
   * Check if cross mapping belongs to a specific control
   */
  belongsToControl(controlId: number): boolean {
    return this.iso27001annex_control_id === controlId;
  }

  /**
   * Get formatted clause identifier
   */
  getClauseIdentifier(): string {
    return `Clause ${this.clause_no}`;
  }

  /**
   * Get full clause display name
   */
  getFullClauseName(): string {
    return `${this.getClauseIdentifier()} - ${this.clause_title}`;
  }

  /**
   * Get mapping summary information
   */
  getMappingSummary(): {
    id: number | undefined;
    clause_no: number;
    order_no: number;
    clause_title: string;
    relevance: string;
    control_id: number;
    clause_identifier: string;
    full_clause_name: string;
  } {
    return {
      id: this.id,
      clause_no: this.clause_no,
      order_no: this.order_no,
      clause_title: this.clause_title,
      relevance: this.relevance,
      control_id: this.iso27001annex_control_id,
      clause_identifier: this.getClauseIdentifier(),
      full_clause_name: this.getFullClauseName(),
    };
  }

  /**
   * Validate uniqueness of clause number within the same control
   * This method should be implemented with actual database query
   */
  static async validateClauseNumberUniqueness(
    clause_no: number,
    iso27001annex_control_id: number,
    excludeMappingId?: number
  ): Promise<boolean> {
    // This is a placeholder implementation
    // In real implementation, you would query the database like:
    // const existingMapping = await ISO27001AnnexCrossMappingModel.findOne({
    //   where: { clause_no, iso27001annex_control_id }
    // });
    // if (existingMapping && existingMapping.id !== excludeMappingId) {
    //   return false; // Clause number already exists for this control
    // }
    // return true; // Clause number is unique

    // For now, return true to allow the operation to proceed
    // The actual uniqueness check should be handled at the database level
    return true;
  }

  /**
   * Get cross mapping data as safe JSON
   */
  toSafeJSON(): any {
    return this.get({ plain: true });
  }

  /**
   * Create ISO27001AnnexCrossMappingModel instance from JSON data
   */
  static fromJSON(json: any): ISO27001AnnexCrossMappingModel {
    return new ISO27001AnnexCrossMappingModel(json);
  }

  /**
   * Convert cross mapping model to JSON representation
   */
  toJSON(): any {
    return {
      id: this.id,
      clause_no: this.clause_no,
      order_no: this.order_no,
      clause_title: this.clause_title,
      relevance: this.relevance,
      iso27001annex_control_id: this.iso27001annex_control_id,
      clause_identifier: this.getClauseIdentifier(),
      full_clause_name: this.getFullClauseName(),
    };
  }

  /**
   * Get cross mapping display information
   */
  getDisplayInfo(): {
    identifier: string;
    title: string;
    fullName: string;
    order: number;
    relevance: string;
  } {
    return {
      identifier: this.getClauseIdentifier(),
      title: this.clause_title,
      fullName: this.getFullClauseName(),
      order: this.order_no,
      relevance: this.relevance,
    };
  }

  /**
   * Check if cross mapping is valid for ISO 27001 framework
   */
  isValidForISO27001(): boolean {
    // Basic validation for ISO 27001 cross mappings
    // Clause numbers should typically be between 1 and 200 for ISO 27001
    return this.clause_no >= 1 && this.clause_no <= 200;
  }

  /**
   * Get mapping priority based on order number
   */
  getPriority(): "high" | "medium" | "low" {
    if (this.order_no <= 10) return "high";
    if (this.order_no <= 25) return "medium";
    return "low";
  }

  /**
   * Check if mapping is highly relevant
   */
  isHighlyRelevant(): boolean {
    const relevanceLower = this.relevance.toLowerCase();
    return (
      relevanceLower.includes("high") ||
      relevanceLower.includes("critical") ||
      relevanceLower.includes("essential") ||
      relevanceLower.includes("required")
    );
  }

  /**
   * Check if mapping is moderately relevant
   */
  isModeratelyRelevant(): boolean {
    const relevanceLower = this.relevance.toLowerCase();
    return (
      relevanceLower.includes("medium") ||
      relevanceLower.includes("moderate") ||
      relevanceLower.includes("important") ||
      relevanceLower.includes("recommended")
    );
  }

  /**
   * Check if mapping is low relevance
   */
  isLowRelevant(): boolean {
    const relevanceLower = this.relevance.toLowerCase();
    return (
      relevanceLower.includes("low") ||
      relevanceLower.includes("optional") ||
      relevanceLower.includes("nice to have") ||
      relevanceLower.includes("consider")
    );
  }
}
