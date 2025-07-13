/**
 * Represents an organization in the system.
 *
 * @type Organization
 *
 * @property {number} id - The unique identifier for the organization.
 * @property {string} name - The name of the organization.
 * @property {string} logo - The logo URL of the organization.
 * @property {number[]} members - Array of user IDs who are members of this organization.
 * @property {number[]} projects - Array of project IDs associated with this organization.
 * @property {Date} created_at - The date and time when the organization was created.
 */

import { Column, DataType, Model, Table } from "sequelize-typescript";
import { IOrganization } from "../../interfaces/i.organization";
import { numberValidation } from "../../validations/number.valid";
import {
  ValidationException,
  BusinessLogicException,
  NotFoundException,
} from "../../exceptions/custom.exception";

@Table({
  tableName: "organizations",
  timestamps: true,
})
export class OrganizationModel
  extends Model<OrganizationModel>
  implements IOrganization
{
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.STRING,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
  })
  logo!: string;

  @Column({
    type: DataType.ARRAY(DataType.INTEGER),
  })
  members!: number[];

  @Column({
    type: DataType.ARRAY(DataType.INTEGER),
  })
  projects!: number[];

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
   * Create a new organization with comprehensive validation
   */
  static async createNewOrganization(
    name: string,
    logo?: string,
    members?: number[],
    projects?: number[],
    is_demo: boolean = false
  ): Promise<OrganizationModel> {
    // Validate name
    if (!name || name.trim().length === 0) {
      throw new ValidationException("Name is required", "name", name);
    }

    if (name.trim().length < 2) {
      throw new ValidationException(
        "Name must be at least 2 characters long",
        "name",
        name
      );
    }

    if (name.trim().length > 255) {
      throw new ValidationException(
        "Name must not exceed 255 characters",
        "name",
        name
      );
    }

    // Validate logo URL if provided
    if (logo !== undefined && logo !== null) {
      if (logo.trim().length === 0) {
        throw new ValidationException(
          "Logo URL cannot be empty if provided",
          "logo",
          logo
        );
      }

      // Basic URL validation
      try {
        new URL(logo);
      } catch {
        throw new ValidationException("Logo must be a valid URL", "logo", logo);
      }
    }

    // Validate members array if provided
    if (members !== undefined && members !== null) {
      if (!Array.isArray(members)) {
        throw new ValidationException(
          "Members must be an array",
          "members",
          members
        );
      }

      for (const memberId of members) {
        if (!numberValidation(memberId, 1)) {
          throw new ValidationException(
            "All member IDs must be positive integers",
            "members",
            members
          );
        }
      }
    }

    // Validate projects array if provided
    if (projects !== undefined && projects !== null) {
      if (!Array.isArray(projects)) {
        throw new ValidationException(
          "Projects must be an array",
          "projects",
          projects
        );
      }

      for (const projectId of projects) {
        if (!numberValidation(projectId, 1)) {
          throw new ValidationException(
            "All project IDs must be positive integers",
            "projects",
            projects
          );
        }
      }
    }

    // Create and return the organization model instance
    const organization = new OrganizationModel();
    organization.name = name.trim();
    organization.logo = logo || "";
    organization.members = members || [];
    organization.projects = projects || [];
    organization.is_demo = is_demo;
    organization.created_at = new Date();

    return organization;
  }

  /**
   * Update organization information with validation
   */
  async updateOrganization(updateData: {
    name?: string;
    logo?: string;
    members?: number[];
    projects?: number[];
  }): Promise<void> {
    // Validate name if provided
    if (updateData.name !== undefined) {
      if (!updateData.name || updateData.name.trim().length === 0) {
        throw new ValidationException(
          "Name is required",
          "name",
          updateData.name
        );
      }

      if (updateData.name.trim().length < 2) {
        throw new ValidationException(
          "Name must be at least 2 characters long",
          "name",
          updateData.name
        );
      }

      if (updateData.name.trim().length > 255) {
        throw new ValidationException(
          "Name must not exceed 255 characters",
          "name",
          updateData.name
        );
      }

      this.name = updateData.name.trim();
    }

    // Validate logo if provided
    if (updateData.logo !== undefined) {
      if (updateData.logo !== null && updateData.logo.trim().length === 0) {
        throw new ValidationException(
          "Logo URL cannot be empty if provided",
          "logo",
          updateData.logo
        );
      }

      if (updateData.logo !== null) {
        // Basic URL validation
        try {
          new URL(updateData.logo);
        } catch {
          throw new ValidationException(
            "Logo must be a valid URL",
            "logo",
            updateData.logo
          );
        }
      }

      this.logo = updateData.logo || "";
    }

    // Validate members if provided
    if (updateData.members !== undefined) {
      if (!Array.isArray(updateData.members)) {
        throw new ValidationException(
          "Members must be an array",
          "members",
          updateData.members
        );
      }

      for (const memberId of updateData.members) {
        if (!numberValidation(memberId, 1)) {
          throw new ValidationException(
            "All member IDs must be positive integers",
            "members",
            updateData.members
          );
        }
      }

      this.members = updateData.members;
    }

    // Validate projects if provided
    if (updateData.projects !== undefined) {
      if (!Array.isArray(updateData.projects)) {
        throw new ValidationException(
          "Projects must be an array",
          "projects",
          updateData.projects
        );
      }

      for (const projectId of updateData.projects) {
        if (!numberValidation(projectId, 1)) {
          throw new ValidationException(
            "All project IDs must be positive integers",
            "projects",
            updateData.projects
          );
        }
      }

      this.projects = updateData.projects;
    }
  }

  /**
   * Validate organization data before saving
   */
  async validateOrganizationData(): Promise<void> {
    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationException("Name is required", "name", this.name);
    }

    if (this.name.trim().length < 2) {
      throw new ValidationException(
        "Name must be at least 2 characters long",
        "name",
        this.name
      );
    }

    if (this.name.trim().length > 255) {
      throw new ValidationException(
        "Name must not exceed 255 characters",
        "name",
        this.name
      );
    }

    // Validate logo if present
    if (this.logo && this.logo.trim().length > 0) {
      try {
        new URL(this.logo);
      } catch {
        throw new ValidationException(
          "Logo must be a valid URL",
          "logo",
          this.logo
        );
      }
    }

    // Validate members array
    if (this.members && !Array.isArray(this.members)) {
      throw new ValidationException(
        "Members must be an array",
        "members",
        this.members
      );
    }

    if (this.members) {
      for (const memberId of this.members) {
        if (!numberValidation(memberId, 1)) {
          throw new ValidationException(
            "All member IDs must be positive integers",
            "members",
            this.members
          );
        }
      }
    }

    // Validate projects array
    if (this.projects && !Array.isArray(this.projects)) {
      throw new ValidationException(
        "Projects must be an array",
        "projects",
        this.projects
      );
    }

    if (this.projects) {
      for (const projectId of this.projects) {
        if (!numberValidation(projectId, 1)) {
          throw new ValidationException(
            "All project IDs must be positive integers",
            "projects",
            this.projects
          );
        }
      }
    }
  }

  /**
   * Check if organization is a demo organization
   */
  isDemoOrganization(): boolean {
    return this.is_demo ?? false;
  }

  /**
   * Check if organization can be modified
   */
  canBeModified(): boolean {
    if (this.isDemoOrganization()) {
      throw new BusinessLogicException(
        "Demo organizations cannot be modified",
        "DEMO_ORGANIZATION_RESTRICTION",
        { organizationId: this.id, organizationName: this.name }
      );
    }
    return true;
  }

  /**
   * Check if organization can be deleted
   */
  canBeDeleted(): boolean {
    if (this.isDemoOrganization()) {
      return false;
    }

    // Cannot delete organizations with active projects
    if (this.projects && this.projects.length > 0) {
      return false;
    }

    return true;
  }

  /**
   * Add a member to the organization
   */
  addMember(userId: number): void {
    if (!numberValidation(userId, 1)) {
      throw new ValidationException(
        "User ID must be a positive integer",
        "userId",
        userId
      );
    }

    if (!this.members) {
      this.members = [];
    }

    if (!this.members.includes(userId)) {
      this.members.push(userId);
    }
  }

  /**
   * Remove a member from the organization
   */
  removeMember(userId: number): void {
    if (!numberValidation(userId, 1)) {
      throw new ValidationException(
        "User ID must be a positive integer",
        "userId",
        userId
      );
    }

    if (this.members) {
      this.members = this.members.filter((id) => id !== userId);
    }
  }

  /**
   * Check if a user is a member of the organization
   */
  isMember(userId: number): boolean {
    if (!numberValidation(userId, 1)) {
      return false;
    }

    return this.members ? this.members.includes(userId) : false;
  }

  /**
   * Add a project to the organization
   */
  addProject(projectId: number): void {
    if (!numberValidation(projectId, 1)) {
      throw new ValidationException(
        "Project ID must be a positive integer",
        "projectId",
        projectId
      );
    }

    if (!this.projects) {
      this.projects = [];
    }

    if (!this.projects.includes(projectId)) {
      this.projects.push(projectId);
    }
  }

  /**
   * Remove a project from the organization
   */
  removeProject(projectId: number): void {
    if (!numberValidation(projectId, 1)) {
      throw new ValidationException(
        "Project ID must be a positive integer",
        "projectId",
        projectId
      );
    }

    if (this.projects) {
      this.projects = this.projects.filter((id) => id !== projectId);
    }
  }

  /**
   * Check if a project belongs to the organization
   */
  hasProject(projectId: number): boolean {
    if (!numberValidation(projectId, 1)) {
      return false;
    }

    return this.projects ? this.projects.includes(projectId) : false;
  }

  /**
   * Get organization member count
   */
  getMemberCount(): number {
    return this.members ? this.members.length : 0;
  }

  /**
   * Get organization project count
   */
  getProjectCount(): number {
    return this.projects ? this.projects.length : 0;
  }

  /**
   * Check if organization is active (has members or projects)
   */
  isActive(): boolean {
    return this.getMemberCount() > 0 || this.getProjectCount() > 0;
  }

  /**
   * Check if organization is empty (no members and no projects)
   */
  isEmpty(): boolean {
    return this.getMemberCount() === 0 && this.getProjectCount() === 0;
  }

  /**
   * Get organization age in days
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
   * Check if organization is recent (created within specified days)
   */
  isRecent(days: number = 30): boolean {
    return this.getAgeInDays() <= days;
  }

  /**
   * Get organization data without sensitive information
   */
  toSafeJSON(): any {
    return {
      id: this.id,
      name: this.name,
      logo: this.logo,
      memberCount: this.getMemberCount(),
      projectCount: this.getProjectCount(),
      isActive: this.isActive(),
      isDemo: this.isDemoOrganization(),
      created_at: this.created_at?.toISOString(),
    };
  }

  /**
   * Convert organization model to JSON representation
   */
  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      logo: this.logo,
      members: this.members,
      projects: this.projects,
      is_demo: this.is_demo,
      created_at: this.created_at?.toISOString(),
      memberCount: this.getMemberCount(),
      projectCount: this.getProjectCount(),
      isActive: this.isActive(),
      isEmpty: this.isEmpty(),
      ageInDays: this.getAgeInDays(),
    };
  }

  /**
   * Static method to create organization from JSON data
   */
  static fromJSON(json: any): OrganizationModel {
    return new OrganizationModel(json);
  }

  /**
   * Static method to find organization by ID with validation
   */
  static async findByIdWithValidation(id: number): Promise<OrganizationModel> {
    if (!numberValidation(id, 1)) {
      throw new ValidationException(
        "Valid ID is required (must be >= 1)",
        "id",
        id
      );
    }

    const organization = await OrganizationModel.findByPk(id);
    if (!organization) {
      throw new NotFoundException("Organization not found", "Organization", id);
    }

    return organization;
  }

  /**
   * Static method to find organizations by member ID
   */
  static async findByMemberId(memberId: number): Promise<OrganizationModel[]> {
    if (!numberValidation(memberId, 1)) {
      throw new ValidationException(
        "Valid member ID is required (must be >= 1)",
        "memberId",
        memberId
      );
    }

    return await OrganizationModel.findAll({
      where: {
        members: {
          [require("sequelize").Op.contains]: [memberId],
        },
      },
      order: [["created_at", "DESC"]],
    });
  }

  /**
   * Static method to find organizations by project ID
   */
  static async findByProjectId(
    projectId: number
  ): Promise<OrganizationModel[]> {
    if (!numberValidation(projectId, 1)) {
      throw new ValidationException(
        "Valid project ID is required (must be >= 1)",
        "projectId",
        projectId
      );
    }

    return await OrganizationModel.findAll({
      where: {
        projects: {
          [require("sequelize").Op.contains]: [projectId],
        },
      },
      order: [["created_at", "DESC"]],
    });
  }

  /**
   * Static method to update organization
   */
  static async updateOrganizationById(
    id: number,
    updateData: Partial<IOrganization>
  ): Promise<[number, OrganizationModel[]]> {
    if (!numberValidation(id, 1)) {
      throw new ValidationException(
        "Valid ID is required (must be >= 1)",
        "id",
        id
      );
    }

    return await OrganizationModel.update(updateData, {
      where: { id },
      returning: true,
    });
  }

  /**
   * Static method to delete organization
   */
  static async deleteOrganizationById(id: number): Promise<number> {
    if (!numberValidation(id, 1)) {
      throw new ValidationException(
        "Valid ID is required (must be >= 1)",
        "id",
        id
      );
    }

    return await OrganizationModel.destroy({
      where: { id },
    });
  }

  /**
   * Get organization summary for display
   */
  getSummary(): {
    id: number | undefined;
    name: string;
    memberCount: number;
    projectCount: number;
    isActive: boolean;
    isDemo: boolean;
  } {
    return {
      id: this.id,
      name: this.name,
      memberCount: this.getMemberCount(),
      projectCount: this.getProjectCount(),
      isActive: this.isActive(),
      isDemo: this.isDemoOrganization(),
    };
  }

  constructor(init?: Partial<IOrganization>) {
    super();
    Object.assign(this, init);
  }
}
