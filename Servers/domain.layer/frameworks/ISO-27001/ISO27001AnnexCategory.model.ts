import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { numberValidation } from "../../validations/number.valid";
import {
  ValidationException,
  BusinessLogicException,
} from "../../exceptions/custom.exception";
import { FrameworkModel } from "../../models/frameworks/frameworks.model";
import { ProjectModel } from "../../models/project/project.model";

@Table({
  tableName: "iso27001annex_category",
})
export class ISO27001AnnexCategoryModel extends Model<ISO27001AnnexCategoryModel> {
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
  arrangement!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  category_no!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  category_name!: string;

  @ForeignKey(() => FrameworkModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  framework_id!: number;

  @ForeignKey(() => ProjectModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  project_id!: number;

  /**
   * Create a new ISO27001 Annex Category
   */
  static async createNewAnnexCategory(
    arrangement: number,
    category_no: number,
    category_name: string,
    framework_id: number,
    project_id: number
  ): Promise<ISO27001AnnexCategoryModel> {
    // Validate arrangement
    if (!numberValidation(arrangement, 1)) {
      throw new ValidationException(
        "Arrangement must be a positive integer",
        "arrangement",
        arrangement
      );
    }

    // Validate category_no
    if (!numberValidation(category_no, 1)) {
      throw new ValidationException(
        "Category number must be a positive integer",
        "category_no",
        category_no
      );
    }

    // Validate category_name
    if (!category_name || category_name.trim().length === 0) {
      throw new ValidationException(
        "Category name is required",
        "category_name",
        category_name
      );
    }

    if (category_name.trim().length < 2) {
      throw new ValidationException(
        "Category name must be at least 2 characters long",
        "category_name",
        category_name
      );
    }

    if (category_name.trim().length > 255) {
      throw new ValidationException(
        "Category name must not exceed 255 characters",
        "category_name",
        category_name
      );
    }

    // Validate framework_id
    if (!numberValidation(framework_id, 1)) {
      throw new ValidationException(
        "Framework ID must be a positive integer",
        "framework_id",
        framework_id
      );
    }

    // Validate project_id
    if (!numberValidation(project_id, 1)) {
      throw new ValidationException(
        "Project ID must be a positive integer",
        "project_id",
        project_id
      );
    }

    // Create and return the annex category model instance
    const annexCategory = new ISO27001AnnexCategoryModel();
    annexCategory.arrangement = arrangement;
    annexCategory.category_no = category_no;
    annexCategory.category_name = category_name.trim();
    annexCategory.framework_id = framework_id;
    annexCategory.project_id = project_id;

    return annexCategory;
  }

  /**
   * Update annex category information
   */
  async updateAnnexCategory(updateData: {
    arrangement?: number;
    category_no?: number;
    category_name?: string;
    framework_id?: number;
    project_id?: number;
  }): Promise<void> {
    // Validate arrangement if provided
    if (updateData.arrangement !== undefined) {
      if (!numberValidation(updateData.arrangement, 1)) {
        throw new ValidationException(
          "Arrangement must be a positive integer",
          "arrangement",
          updateData.arrangement
        );
      }
      this.arrangement = updateData.arrangement;
    }

    // Validate category_no if provided
    if (updateData.category_no !== undefined) {
      if (!numberValidation(updateData.category_no, 1)) {
        throw new ValidationException(
          "Category number must be a positive integer",
          "category_no",
          updateData.category_no
        );
      }
      this.category_no = updateData.category_no;
    }

    // Validate category_name if provided
    if (updateData.category_name !== undefined) {
      if (
        !updateData.category_name ||
        updateData.category_name.trim().length === 0
      ) {
        throw new ValidationException(
          "Category name is required",
          "category_name",
          updateData.category_name
        );
      }
      if (updateData.category_name.trim().length < 2) {
        throw new ValidationException(
          "Category name must be at least 2 characters long",
          "category_name",
          updateData.category_name
        );
      }
      if (updateData.category_name.trim().length > 255) {
        throw new ValidationException(
          "Category name must not exceed 255 characters",
          "category_name",
          updateData.category_name
        );
      }
      this.category_name = updateData.category_name.trim();
    }

    // Validate framework_id if provided
    if (updateData.framework_id !== undefined) {
      if (!numberValidation(updateData.framework_id, 1)) {
        throw new ValidationException(
          "Framework ID must be a positive integer",
          "framework_id",
          updateData.framework_id
        );
      }
      this.framework_id = updateData.framework_id;
    }

    // Validate project_id if provided
    if (updateData.project_id !== undefined) {
      if (!numberValidation(updateData.project_id, 1)) {
        throw new ValidationException(
          "Project ID must be a positive integer",
          "project_id",
          updateData.project_id
        );
      }
      this.project_id = updateData.project_id;
    }
  }

  /**
   * Validate annex category data before saving
   */
  async validateAnnexCategoryData(): Promise<void> {
    if (!numberValidation(this.arrangement, 1)) {
      throw new ValidationException(
        "Valid arrangement is required (must be >= 1)",
        "arrangement",
        this.arrangement
      );
    }

    if (!numberValidation(this.category_no, 1)) {
      throw new ValidationException(
        "Valid category number is required (must be >= 1)",
        "category_no",
        this.category_no
      );
    }

    if (!this.category_name || this.category_name.trim().length === 0) {
      throw new ValidationException(
        "Category name is required",
        "category_name",
        this.category_name
      );
    }

    if (this.category_name.trim().length < 2) {
      throw new ValidationException(
        "Category name must be at least 2 characters long",
        "category_name",
        this.category_name
      );
    }

    if (this.category_name.trim().length > 255) {
      throw new ValidationException(
        "Category name must not exceed 255 characters",
        "category_name",
        this.category_name
      );
    }

    if (!numberValidation(this.framework_id, 1)) {
      throw new ValidationException(
        "Valid framework ID is required (must be >= 1)",
        "framework_id",
        this.framework_id
      );
    }

    if (!numberValidation(this.project_id, 1)) {
      throw new ValidationException(
        "Valid project ID is required (must be >= 1)",
        "project_id",
        this.project_id
      );
    }
  }

  /**
   * Check if annex category belongs to a specific project
   */
  belongsToProject(projectId: number): boolean {
    return this.project_id === projectId;
  }

  /**
   * Check if annex category belongs to a specific framework
   */
  belongsToFramework(frameworkId: number): boolean {
    return this.framework_id === frameworkId;
  }

  /**
   * Get formatted category identifier
   */
  getCategoryIdentifier(): string {
    return `A.${this.category_no}`;
  }

  /**
   * Get full category display name
   */
  getFullCategoryName(): string {
    return `${this.getCategoryIdentifier()} - ${this.category_name}`;
  }

  /**
   * Validate uniqueness of category number within the same project and framework
   * This method should be implemented with actual database query
   */
  static async validateCategoryNumberUniqueness(
    category_no: number,
    framework_id: number,
    project_id: number,
    excludeCategoryId?: number
  ): Promise<boolean> {
    // This is a placeholder implementation
    // In real implementation, you would query the database like:
    // const existingCategory = await ISO27001AnnexCategoryModel.findOne({
    //   where: { category_no, framework_id, project_id }
    // });
    // if (existingCategory && existingCategory.id !== excludeCategoryId) {
    //   return false; // Category number already exists for this project/framework
    // }
    // return true; // Category number is unique

    // For now, return true to allow the operation to proceed
    // The actual uniqueness check should be handled at the database level
    return true;
  }

  /**
   * Get annex category data as safe JSON
   */
  toSafeJSON(): any {
    return this.get({ plain: true });
  }

  /**
   * Create ISO27001AnnexCategoryModel instance from JSON data
   */
  static fromJSON(json: any): ISO27001AnnexCategoryModel {
    return new ISO27001AnnexCategoryModel(json);
  }

  /**
   * Convert annex category model to JSON representation
   */
  toJSON(): any {
    return {
      id: this.id,
      arrangement: this.arrangement,
      category_no: this.category_no,
      category_name: this.category_name,
      framework_id: this.framework_id,
      project_id: this.project_id,
      category_identifier: this.getCategoryIdentifier(),
      full_category_name: this.getFullCategoryName(),
    };
  }

  /**
   * Get category display information
   */
  getDisplayInfo(): {
    identifier: string;
    name: string;
    fullName: string;
    arrangement: number;
  } {
    return {
      identifier: this.getCategoryIdentifier(),
      name: this.category_name,
      fullName: this.getFullCategoryName(),
      arrangement: this.arrangement,
    };
  }

  /**
   * Check if annex category is valid for ISO 27001 framework
   */
  isValidForISO27001(): boolean {
    // Basic validation for ISO 27001 annex categories
    // Category numbers should typically be between 1 and 50 for ISO 27001
    return this.category_no >= 1 && this.category_no <= 50;
  }

  /**
   * Get category priority based on arrangement
   */
  getPriority(): "high" | "medium" | "low" {
    if (this.arrangement <= 10) return "high";
    if (this.arrangement <= 25) return "medium";
    return "low";
  }
}
