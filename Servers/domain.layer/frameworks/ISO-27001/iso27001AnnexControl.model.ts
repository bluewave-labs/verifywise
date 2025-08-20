import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { numberValidation } from "../../validations/number.valid";
import { ValidationException } from "../../exceptions/custom.exception";
import { UserModel } from "../../models/user/user.model";
import { ISO27001AnnexCategoryModel } from "./ISO27001AnnexCategory.model";
import { IISO27001AnnexControl } from "../../interfaces/i.iso27001AnnexControl";

export type ControlStatus =
  | "Waiting"
  | "In progress"
  | "Done"
  | "Review"
  | "Approved";

@Table({
  tableName: "iso27001annex_control",
})
export class ISO27001AnnexControlModel
  extends Model<ISO27001AnnexControlModel>
  implements IISO27001AnnexControl
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
  control_no!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  requirement_summary!: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  key_questions!: string[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  evidence_examples!: string[];

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  implementation_description!: string;

  @Column({
    type: DataType.ENUM("Waiting", "In progress", "Done", "Review", "Approved"),
    allowNull: false,
    defaultValue: "Waiting",
  })
  status!: ControlStatus;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  owner?: number;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  reviewer?: number;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  approver?: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  due_date?: Date;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  cross_mappings?: object[];

  @ForeignKey(() => ISO27001AnnexCategoryModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  iso27001annex_category_id!: number;

  /**
   * Create a new ISO27001 Annex Control
   */
  static async createNewAnnexControl(
    control_no: number,
    title: string,
    requirement_summary: string,
    key_questions: string[],
    evidence_examples: string[],
    implementation_description: string,
    iso27001annex_category_id: number,
    owner?: number,
    reviewer?: number,
    approver?: number,
    due_date?: Date,
    cross_mappings?: object[]
  ): Promise<ISO27001AnnexControlModel> {
    // Validate control_no
    if (!numberValidation(control_no, 1)) {
      throw new ValidationException(
        "Control number must be a positive integer",
        "control_no",
        control_no
      );
    }

    // Validate title
    if (!title || title.trim().length === 0) {
      throw new ValidationException("Title is required", "title", title);
    }

    if (title.trim().length < 3) {
      throw new ValidationException(
        "Title must be at least 3 characters long",
        "title",
        title
      );
    }

    if (title.trim().length > 255) {
      throw new ValidationException(
        "Title must not exceed 255 characters",
        "title",
        title
      );
    }

    // Validate requirement_summary
    if (!requirement_summary || requirement_summary.trim().length === 0) {
      throw new ValidationException(
        "Requirement summary is required",
        "requirement_summary",
        requirement_summary
      );
    }

    if (requirement_summary.trim().length < 10) {
      throw new ValidationException(
        "Requirement summary must be at least 10 characters long",
        "requirement_summary",
        requirement_summary
      );
    }

    // Validate key_questions
    if (
      !key_questions ||
      !Array.isArray(key_questions) ||
      key_questions.length === 0
    ) {
      throw new ValidationException(
        "At least one key question is required",
        "key_questions",
        key_questions
      );
    }

    // Validate each key question
    key_questions.forEach((question, index) => {
      if (!question || question.trim().length === 0) {
        throw new ValidationException(
          `Key question at index ${index} cannot be empty`,
          "key_questions",
          question
        );
      }
      if (question.trim().length < 5) {
        throw new ValidationException(
          `Key question at index ${index} must be at least 5 characters long`,
          "key_questions",
          question
        );
      }
    });

    // Validate evidence_examples
    if (!evidence_examples || !Array.isArray(evidence_examples)) {
      throw new ValidationException(
        "Evidence examples must be an array",
        "evidence_examples",
        evidence_examples
      );
    }

    // Validate each evidence example
    evidence_examples.forEach((example, index) => {
      if (example && example.trim().length > 0 && example.trim().length < 5) {
        throw new ValidationException(
          `Evidence example at index ${index} must be at least 5 characters long if provided`,
          "evidence_examples",
          example
        );
      }
    });

    // Validate implementation_description
    if (
      !implementation_description ||
      implementation_description.trim().length === 0
    ) {
      throw new ValidationException(
        "Implementation description is required",
        "implementation_description",
        implementation_description
      );
    }

    if (implementation_description.trim().length < 20) {
      throw new ValidationException(
        "Implementation description must be at least 20 characters long",
        "implementation_description",
        implementation_description
      );
    }

    // Validate iso27001annex_category_id
    if (!numberValidation(iso27001annex_category_id, 1)) {
      throw new ValidationException(
        "Valid annex category ID is required",
        "iso27001annex_category_id",
        iso27001annex_category_id
      );
    }

    // Validate user IDs if provided
    if (owner !== undefined && !numberValidation(owner, 1)) {
      throw new ValidationException(
        "Valid owner ID is required",
        "owner",
        owner
      );
    }

    if (reviewer !== undefined && !numberValidation(reviewer, 1)) {
      throw new ValidationException(
        "Valid reviewer ID is required",
        "reviewer",
        reviewer
      );
    }

    if (approver !== undefined && !numberValidation(approver, 1)) {
      throw new ValidationException(
        "Valid approver ID is required",
        "approver",
        approver
      );
    }

    // Validate due_date if provided
    if (
      due_date !== undefined &&
      due_date !== null &&
      (!(due_date instanceof Date) || isNaN(due_date.getTime()))
    ) {
      throw new ValidationException(
        "Valid due date is required",
        "due_date",
        due_date
      );
    }

    // Create and return the annex control model instance
    const annexControl = new ISO27001AnnexControlModel();
    annexControl.control_no = control_no;
    annexControl.title = title.trim();
    annexControl.requirement_summary = requirement_summary.trim();
    annexControl.key_questions = key_questions.map((q) => q.trim());
    annexControl.evidence_examples = evidence_examples.map((e) => e.trim());
    annexControl.implementation_description = implementation_description.trim();
    annexControl.status = "Waiting";
    annexControl.owner = owner;
    annexControl.reviewer = reviewer;
    annexControl.approver = approver;
    annexControl.due_date = due_date;
    annexControl.cross_mappings = cross_mappings || [];
    annexControl.iso27001annex_category_id = iso27001annex_category_id;

    return annexControl;
  }

  /**
   * Update annex control information
   */
  async updateAnnexControl(updateData: {
    title?: string;
    requirement_summary?: string;
    key_questions?: string[];
    evidence_examples?: string[];
    implementation_description?: string;
    status?: ControlStatus;
    owner?: number;
    reviewer?: number;
    approver?: number;
    due_date?: Date;
    cross_mappings?: object[];
  }): Promise<void> {
    // Validate title if provided
    if (updateData.title !== undefined) {
      if (!updateData.title || updateData.title.trim().length === 0) {
        throw new ValidationException(
          "Title is required",
          "title",
          updateData.title
        );
      }
      if (updateData.title.trim().length < 3) {
        throw new ValidationException(
          "Title must be at least 3 characters long",
          "title",
          updateData.title
        );
      }
      if (updateData.title.trim().length > 255) {
        throw new ValidationException(
          "Title must not exceed 255 characters",
          "title",
          updateData.title
        );
      }
      this.title = updateData.title.trim();
    }

    // Validate requirement_summary if provided
    if (updateData.requirement_summary !== undefined) {
      if (
        !updateData.requirement_summary ||
        updateData.requirement_summary.trim().length === 0
      ) {
        throw new ValidationException(
          "Requirement summary is required",
          "requirement_summary",
          updateData.requirement_summary
        );
      }
      if (updateData.requirement_summary.trim().length < 10) {
        throw new ValidationException(
          "Requirement summary must be at least 10 characters long",
          "requirement_summary",
          updateData.requirement_summary
        );
      }
      this.requirement_summary = updateData.requirement_summary.trim();
    }

    // Validate key_questions if provided
    if (updateData.key_questions !== undefined) {
      if (
        !Array.isArray(updateData.key_questions) ||
        updateData.key_questions.length === 0
      ) {
        throw new ValidationException(
          "At least one key question is required",
          "key_questions",
          updateData.key_questions
        );
      }
      updateData.key_questions.forEach((question, index) => {
        if (!question || question.trim().length === 0) {
          throw new ValidationException(
            `Key question at index ${index} cannot be empty`,
            "key_questions",
            question
          );
        }
        if (question.trim().length < 5) {
          throw new ValidationException(
            `Key question at index ${index} must be at least 5 characters long`,
            "key_questions",
            question
          );
        }
      });
      this.key_questions = updateData.key_questions.map((q) => q.trim());
    }

    // Validate evidence_examples if provided
    if (updateData.evidence_examples !== undefined) {
      if (!Array.isArray(updateData.evidence_examples)) {
        throw new ValidationException(
          "Evidence examples must be an array",
          "evidence_examples",
          updateData.evidence_examples
        );
      }
      updateData.evidence_examples.forEach((example, index) => {
        if (example && example.trim().length > 0 && example.trim().length < 5) {
          throw new ValidationException(
            `Evidence example at index ${index} must be at least 5 characters long if provided`,
            "evidence_examples",
            example
          );
        }
      });
      this.evidence_examples = updateData.evidence_examples.map((e) =>
        e.trim()
      );
    }

    // Validate implementation_description if provided
    if (updateData.implementation_description !== undefined) {
      if (
        !updateData.implementation_description ||
        updateData.implementation_description.trim().length === 0
      ) {
        throw new ValidationException(
          "Implementation description is required",
          "implementation_description",
          updateData.implementation_description
        );
      }
      if (updateData.implementation_description.trim().length < 20) {
        throw new ValidationException(
          "Implementation description must be at least 20 characters long",
          "implementation_description",
          updateData.implementation_description
        );
      }
      this.implementation_description =
        updateData.implementation_description.trim();
    }

    // Validate status if provided
    if (updateData.status !== undefined) {
      const validStatuses: ControlStatus[] = [
        "Waiting",
        "In progress",
        "Done",
        "Review",
        "Approved",
      ];
      if (!validStatuses.includes(updateData.status)) {
        throw new ValidationException(
          "Invalid status value",
          "status",
          updateData.status
        );
      }
      this.status = updateData.status;
    }

    // Validate user IDs if provided
    if (updateData.owner !== undefined) {
      if (updateData.owner !== null && !numberValidation(updateData.owner, 1)) {
        throw new ValidationException(
          "Valid owner ID is required",
          "owner",
          updateData.owner
        );
      }
      this.owner = updateData.owner;
    }

    if (updateData.reviewer !== undefined) {
      if (
        updateData.reviewer !== null &&
        !numberValidation(updateData.reviewer, 1)
      ) {
        throw new ValidationException(
          "Valid reviewer ID is required",
          "reviewer",
          updateData.reviewer
        );
      }
      this.reviewer = updateData.reviewer;
    }

    if (updateData.approver !== undefined) {
      if (
        updateData.approver !== null &&
        !numberValidation(updateData.approver, 1)
      ) {
        throw new ValidationException(
          "Valid approver ID is required",
          "approver",
          updateData.approver
        );
      }
      this.approver = updateData.approver;
    }

    // Validate due_date if provided
    if (updateData.due_date !== undefined) {
      if (
        updateData.due_date !== null &&
        (!(updateData.due_date instanceof Date) ||
          isNaN(updateData.due_date.getTime()))
      ) {
        throw new ValidationException(
          "Valid due date is required",
          "due_date",
          updateData.due_date
        );
      }
      this.due_date = updateData.due_date;
    }

    // Update cross_mappings if provided
    if (updateData.cross_mappings !== undefined) {
      this.cross_mappings = updateData.cross_mappings;
    }
  }

  /**
   * Validate annex control data before saving
   */
  async validateAnnexControlData(): Promise<void> {
    if (!numberValidation(this.control_no, 1)) {
      throw new ValidationException(
        "Valid control number is required (must be >= 1)",
        "control_no",
        this.control_no
      );
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new ValidationException("Title is required", "title", this.title);
    }

    if (this.title.trim().length < 3) {
      throw new ValidationException(
        "Title must be at least 3 characters long",
        "title",
        this.title
      );
    }

    if (
      !this.requirement_summary ||
      this.requirement_summary.trim().length === 0
    ) {
      throw new ValidationException(
        "Requirement summary is required",
        "requirement_summary",
        this.requirement_summary
      );
    }

    if (
      !this.key_questions ||
      !Array.isArray(this.key_questions) ||
      this.key_questions.length === 0
    ) {
      throw new ValidationException(
        "At least one key question is required",
        "key_questions",
        this.key_questions
      );
    }

    if (
      !this.implementation_description ||
      this.implementation_description.trim().length === 0
    ) {
      throw new ValidationException(
        "Implementation description is required",
        "implementation_description",
        this.implementation_description
      );
    }

    if (!numberValidation(this.iso27001annex_category_id, 1)) {
      throw new ValidationException(
        "Valid annex category ID is required",
        "iso27001annex_category_id",
        this.iso27001annex_category_id
      );
    }
  }

  /**
   * Check if control belongs to a specific category
   */
  belongsToCategory(categoryId: number): boolean {
    return this.iso27001annex_category_id === categoryId;
  }

  /**
   * Get formatted control identifier
   */
  getControlIdentifier(): string {
    return `A.${this.control_no}`;
  }

  /**
   * Get full control display name
   */
  getFullControlName(): string {
    return `${this.getControlIdentifier()} - ${this.title}`;
  }

  /**
   * Check if control is overdue
   */
  isOverdue(): boolean {
    if (!this.due_date) {
      return false;
    }
    return (
      new Date() > this.due_date &&
      this.status !== "Done" &&
      this.status !== "Approved"
    );
  }

  /**
   * Check if control is completed
   */
  isCompleted(): boolean {
    return this.status === "Done" || this.status === "Approved";
  }

  /**
   * Check if control is in review
   */
  isInReview(): boolean {
    return this.status === "Review";
  }

  /**
   * Check if control is in progress
   */
  isInProgress(): boolean {
    return this.status === "In progress";
  }

  /**
   * Get control progress percentage
   */
  getProgressPercentage(): number {
    switch (this.status) {
      case "Done":
      case "Approved":
        return 100;
      case "Review":
        return 75;
      case "In progress":
        return 50;
      case "Waiting":
      default:
        return 0;
    }
  }

  /**
   * Check if user can modify this control
   */
  canBeModifiedBy(userId: number, isAdmin: boolean = false): boolean {
    if (isAdmin) {
      return true;
    }

    return (
      this.owner === userId ||
      this.reviewer === userId ||
      this.approver === userId
    );
  }

  /**
   * Check if user can review this control
   */
  canBeReviewedBy(userId: number, isAdmin: boolean = false): boolean {
    if (isAdmin) {
      return true;
    }

    return this.reviewer === userId;
  }

  /**
   * Check if user can approve this control
   */
  canBeApprovedBy(userId: number, isAdmin: boolean = false): boolean {
    if (isAdmin) {
      return true;
    }

    return this.approver === userId;
  }

  /**
   * Get control summary information
   */
  getControlSummary(): {
    id: number | undefined;
    control_no: number;
    title: string;
    status: ControlStatus;
    progress: number;
    isOverdue: boolean;
    isCompleted: boolean;
    dueDate: Date | undefined;
  } {
    return {
      id: this.id,
      control_no: this.control_no,
      title: this.title,
      status: this.status,
      progress: this.getProgressPercentage(),
      isOverdue: this.isOverdue(),
      isCompleted: this.isCompleted(),
      dueDate: this.due_date,
    };
  }

  /**
   * Validate uniqueness of control number within the same category
   * This method should be implemented with actual database query
   */
  static async validateControlNumberUniqueness(
    control_no: number,
    iso27001annex_category_id: number,
    excludeControlId?: number
  ): Promise<boolean> {
    // This is a placeholder implementation
    // In real implementation, you would query the database like:
    // const existingControl = await ISO27001AnnexControlModel.findOne({
    //   where: { control_no, iso27001annex_category_id }
    // });
    // if (existingControl && existingControl.id !== excludeControlId) {
    //   return false; // Control number already exists for this category
    // }
    // return true; // Control number is unique

    // For now, return true to allow the operation to proceed
    // The actual uniqueness check should be handled at the database level
    return true;
  }

  /**
   * Get annex control data as safe JSON
   */
  toSafeJSON(): any {
    return this.get({ plain: true });
  }

  /**
   * Create ISO27001AnnexControlModel instance from JSON data
   */
  static fromJSON(json: any): ISO27001AnnexControlModel {
    return new ISO27001AnnexControlModel(json);
  }

  /**
   * Convert annex control model to JSON representation
   */
  toJSON(): any {
    return {
      id: this.id,
      control_no: this.control_no,
      title: this.title,
      requirement_summary: this.requirement_summary,
      key_questions: this.key_questions,
      evidence_examples: this.evidence_examples,
      implementation_description: this.implementation_description,
      status: this.status,
      owner: this.owner,
      reviewer: this.reviewer,
      approver: this.approver,
      due_date: this.due_date?.toISOString(),
      cross_mappings: this.cross_mappings,
      iso27001annex_category_id: this.iso27001annex_category_id,
      control_identifier: this.getControlIdentifier(),
      full_control_name: this.getFullControlName(),
      progress_percentage: this.getProgressPercentage(),
      is_overdue: this.isOverdue(),
      is_completed: this.isCompleted(),
    };
  }

  /**
   * Get control display information
   */
  getDisplayInfo(): {
    identifier: string;
    title: string;
    fullName: string;
    status: ControlStatus;
    progress: number;
  } {
    return {
      identifier: this.getControlIdentifier(),
      title: this.title,
      fullName: this.getFullControlName(),
      status: this.status,
      progress: this.getProgressPercentage(),
    };
  }

  /**
   * Check if control is valid for ISO 27001 framework
   */
  isValidForISO27001(): boolean {
    // Basic validation for ISO 27001 annex controls
    // Control numbers should typically be between 1 and 200 for ISO 27001
    return this.control_no >= 1 && this.control_no <= 200;
  }

  /**
   * Get control priority based on status and due date
   */
  getPriority(): "high" | "medium" | "low" {
    if (this.isOverdue()) {
      return "high";
    }
    if (this.status === "In progress" || this.status === "Review") {
      return "medium";
    }
    if (
      this.due_date &&
      new Date() > new Date(this.due_date.getTime() - 7 * 24 * 60 * 60 * 1000)
    ) {
      return "medium"; // Due within a week
    }
    return "low";
  }
}
