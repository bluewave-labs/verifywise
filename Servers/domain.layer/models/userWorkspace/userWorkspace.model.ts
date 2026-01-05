/**
 * @fileoverview User-Workspace Model
 *
 * Defines the junction entity for User-Workspace many-to-many relationship.
 * Implements role-based access control within workspaces with support for
 * owner, admin, member, and viewer roles.
 *
 * Database Schema:
 * - id: Auto-incrementing primary key
 * - user_id: Foreign key to users table
 * - workspace_id: Foreign key to workspaces table
 * - role: User's role in the workspace (owner, admin, member, viewer)
 * - is_default: Whether this is the user's default workspace
 * - joined_at: When the user joined the workspace
 * - invited_by: Foreign key to user who invited this member
 * - created_at: Record creation timestamp
 * - updated_at: Last update timestamp
 *
 * Key Features:
 * - Role-based access control (RBAC)
 * - Default workspace per user
 * - Invitation tracking
 * - Permission checking methods
 *
 * @module domain.layer/models/userWorkspace
 */

import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table,
} from "sequelize-typescript";
import {
  IUserWorkspace,
  WorkspaceRole,
  WorkspaceRoleType,
} from "../../interfaces/i.userWorkspace";
import { UserModel } from "../user/user.model";
import { WorkspaceModel } from "../workspace/workspace.model";
import { numberValidation } from "../../validations/number.valid";
import {
  ValidationException,
  BusinessLogicException,
} from "../../exceptions/custom.exception";

@Table({
  tableName: "user_workspaces",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [
    {
      unique: true,
      fields: ["user_id", "workspace_id"],
      name: "idx_user_workspace_unique",
    },
    {
      fields: ["user_id"],
      name: "idx_user_workspaces_user_id",
    },
    {
      fields: ["workspace_id"],
      name: "idx_user_workspaces_workspace_id",
    },
    {
      fields: ["user_id", "is_default"],
      name: "idx_user_workspaces_default",
    },
  ],
})
export class UserWorkspaceModel
  extends Model<UserWorkspaceModel>
  implements IUserWorkspace
{
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id!: number;

  @ForeignKey(() => WorkspaceModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  workspace_id!: number;

  @Column({
    type: DataType.ENUM("owner", "admin", "member", "viewer"),
    allowNull: false,
    defaultValue: "member",
  })
  role!: WorkspaceRoleType;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_default?: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  joined_at?: Date;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  invited_by?: number;

  @Column({
    type: DataType.DATE,
  })
  created_at?: Date;

  @Column({
    type: DataType.DATE,
  })
  updated_at?: Date;

  // Associations
  @BelongsTo(() => UserModel, "user_id")
  user?: UserModel;

  @BelongsTo(() => WorkspaceModel)
  workspace?: WorkspaceModel;

  @BelongsTo(() => UserModel, "invited_by")
  inviter?: UserModel;

  /**
   * Validates workspace role
   *
   * @static
   * @param {string} role - Role to validate
   * @returns {boolean} True if role is valid
   */
  static isValidRole(role: string): role is WorkspaceRoleType {
    return Object.values(WorkspaceRole).includes(role as WorkspaceRoleType);
  }

  /**
   * Creates a new user-workspace association with validation
   *
   * @static
   * @async
   * @param {number} user_id - User ID
   * @param {number} workspace_id - Workspace ID
   * @param {WorkspaceRoleType} role - User's role in the workspace
   * @param {Object} [options] - Optional settings
   * @returns {Promise<UserWorkspaceModel>} UserWorkspaceModel instance (not yet persisted)
   * @throws {ValidationException} If any field fails validation
   */
  static async createUserWorkspace(
    user_id: number,
    workspace_id: number,
    role: WorkspaceRoleType,
    options?: {
      is_default?: boolean;
      invited_by?: number;
    }
  ): Promise<UserWorkspaceModel> {
    // Validate user_id
    if (!numberValidation(user_id, 1)) {
      throw new ValidationException(
        "Valid user ID is required",
        "user_id",
        user_id
      );
    }

    // Validate workspace_id
    if (!numberValidation(workspace_id, 1)) {
      throw new ValidationException(
        "Valid workspace ID is required",
        "workspace_id",
        workspace_id
      );
    }

    // Validate role
    if (!UserWorkspaceModel.isValidRole(role)) {
      throw new ValidationException(
        `Invalid role. Must be one of: ${Object.values(WorkspaceRole).join(", ")}`,
        "role",
        role
      );
    }

    // Validate invited_by if provided
    if (options?.invited_by !== undefined && !numberValidation(options.invited_by, 1)) {
      throw new ValidationException(
        "Invalid invited_by user ID",
        "invited_by",
        options.invited_by
      );
    }

    const userWorkspace = new UserWorkspaceModel();
    userWorkspace.user_id = user_id;
    userWorkspace.workspace_id = workspace_id;
    userWorkspace.role = role;
    userWorkspace.is_default = options?.is_default ?? false;
    userWorkspace.invited_by = options?.invited_by;
    userWorkspace.joined_at = new Date();
    userWorkspace.created_at = new Date();
    userWorkspace.updated_at = new Date();

    return userWorkspace;
  }

  /**
   * Updates user's role in workspace
   *
   * @async
   * @param {WorkspaceRoleType} newRole - New role to assign
   * @param {number} updatedBy - User ID of who is making the change
   * @returns {Promise<void>}
   * @throws {ValidationException} If role is invalid
   * @throws {BusinessLogicException} If owner tries to change own role
   */
  async updateRole(newRole: WorkspaceRoleType, updatedBy: number): Promise<void> {
    if (!UserWorkspaceModel.isValidRole(newRole)) {
      throw new ValidationException(
        `Invalid role. Must be one of: ${Object.values(WorkspaceRole).join(", ")}`,
        "role",
        newRole
      );
    }

    // Prevent owner from changing their own role
    if (this.role === WorkspaceRole.OWNER && this.user_id === updatedBy) {
      throw new BusinessLogicException(
        "Workspace owner cannot change their own role",
        "OWNER_ROLE_CHANGE_RESTRICTION",
        { userId: this.user_id, workspaceId: this.workspace_id }
      );
    }

    this.role = newRole;
    this.updated_at = new Date();
  }

  /**
   * Set as default workspace for user
   */
  setAsDefault(): void {
    this.is_default = true;
    this.updated_at = new Date();
  }

  /**
   * Remove as default workspace
   */
  removeAsDefault(): void {
    this.is_default = false;
    this.updated_at = new Date();
  }

  /**
   * Check if user is the workspace owner
   */
  isOwner(): boolean {
    return this.role === WorkspaceRole.OWNER;
  }

  /**
   * Check if user is an admin (owner or admin role)
   */
  isAdmin(): boolean {
    return this.role === WorkspaceRole.OWNER || this.role === WorkspaceRole.ADMIN;
  }

  /**
   * Check if user can manage workspace members
   */
  canManageMembers(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can edit workspace settings
   */
  canEditSettings(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can view workspace content
   */
  canView(): boolean {
    return true; // All roles can view
  }

  /**
   * Check if user can edit workspace content
   */
  canEditContent(): boolean {
    return this.role !== WorkspaceRole.VIEWER;
  }

  /**
   * Validates all data before persistence
   *
   * @async
   * @returns {Promise<void>}
   * @throws {ValidationException} If any required field is missing or invalid
   */
  async validateUserWorkspaceData(): Promise<void> {
    if (!numberValidation(this.user_id, 1)) {
      throw new ValidationException(
        "Valid user ID is required",
        "user_id",
        this.user_id
      );
    }

    if (!numberValidation(this.workspace_id, 1)) {
      throw new ValidationException(
        "Valid workspace ID is required",
        "workspace_id",
        this.workspace_id
      );
    }

    if (!UserWorkspaceModel.isValidRole(this.role)) {
      throw new ValidationException("Valid role is required", "role", this.role);
    }
  }

  /**
   * Returns safe JSON representation
   */
  toSafeJSON(): any {
    return {
      id: this.id,
      user_id: this.user_id,
      workspace_id: this.workspace_id,
      role: this.role,
      is_default: this.is_default,
      joined_at: this.joined_at?.toISOString(),
      invited_by: this.invited_by,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
    };
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): any {
    return this.toSafeJSON();
  }

  /**
   * Create instance from JSON data
   */
  static fromJSON(json: any): UserWorkspaceModel {
    return new UserWorkspaceModel(json);
  }

  /**
   * Finds user-workspace association by user and workspace IDs
   *
   * @static
   * @async
   * @param {number} user_id - User ID
   * @param {number} workspace_id - Workspace ID
   * @returns {Promise<UserWorkspaceModel | null>} Association or null
   */
  static async findByUserAndWorkspace(
    user_id: number,
    workspace_id: number
  ): Promise<UserWorkspaceModel | null> {
    if (!numberValidation(user_id, 1)) {
      throw new ValidationException(
        "Valid user ID is required",
        "user_id",
        user_id
      );
    }
    if (!numberValidation(workspace_id, 1)) {
      throw new ValidationException(
        "Valid workspace ID is required",
        "workspace_id",
        workspace_id
      );
    }

    return await UserWorkspaceModel.findOne({
      where: { user_id, workspace_id },
    });
  }

  /**
   * Finds all workspaces for a user
   *
   * @static
   * @async
   * @param {number} user_id - User ID
   * @returns {Promise<UserWorkspaceModel[]>} Array of associations
   */
  static async findByUserId(user_id: number): Promise<UserWorkspaceModel[]> {
    if (!numberValidation(user_id, 1)) {
      throw new ValidationException(
        "Valid user ID is required",
        "user_id",
        user_id
      );
    }

    return await UserWorkspaceModel.findAll({
      where: { user_id },
      include: [WorkspaceModel],
      order: [["is_default", "DESC"], ["created_at", "DESC"]],
    });
  }

  /**
   * Finds all users in a workspace
   *
   * @static
   * @async
   * @param {number} workspace_id - Workspace ID
   * @returns {Promise<UserWorkspaceModel[]>} Array of associations
   */
  static async findByWorkspaceId(
    workspace_id: number
  ): Promise<UserWorkspaceModel[]> {
    if (!numberValidation(workspace_id, 1)) {
      throw new ValidationException(
        "Valid workspace ID is required",
        "workspace_id",
        workspace_id
      );
    }

    return await UserWorkspaceModel.findAll({
      where: { workspace_id },
      include: [{ model: UserModel, as: "user" }],
      order: [["role", "ASC"], ["created_at", "ASC"]],
    });
  }

  /**
   * Gets user's default workspace
   *
   * @static
   * @async
   * @param {number} user_id - User ID
   * @returns {Promise<UserWorkspaceModel | null>} Default workspace association or null
   */
  static async getDefaultWorkspace(
    user_id: number
  ): Promise<UserWorkspaceModel | null> {
    if (!numberValidation(user_id, 1)) {
      throw new ValidationException(
        "Valid user ID is required",
        "user_id",
        user_id
      );
    }

    return await UserWorkspaceModel.findOne({
      where: { user_id, is_default: true },
      include: [WorkspaceModel],
    });
  }

  /**
   * Counts members in a workspace
   *
   * @static
   * @async
   * @param {number} workspace_id - Workspace ID
   * @returns {Promise<number>} Member count
   */
  static async countMembersByWorkspaceId(workspace_id: number): Promise<number> {
    if (!numberValidation(workspace_id, 1)) {
      throw new ValidationException(
        "Valid workspace ID is required",
        "workspace_id",
        workspace_id
      );
    }

    return await UserWorkspaceModel.count({ where: { workspace_id } });
  }

  /**
   * Removes a user from a workspace
   *
   * @static
   * @async
   * @param {number} user_id - User ID
   * @param {number} workspace_id - Workspace ID
   * @returns {Promise<number>} Number of deleted rows
   */
  static async removeUserFromWorkspace(
    user_id: number,
    workspace_id: number
  ): Promise<number> {
    if (!numberValidation(user_id, 1)) {
      throw new ValidationException(
        "Valid user ID is required",
        "user_id",
        user_id
      );
    }
    if (!numberValidation(workspace_id, 1)) {
      throw new ValidationException(
        "Valid workspace ID is required",
        "workspace_id",
        workspace_id
      );
    }

    return await UserWorkspaceModel.destroy({
      where: { user_id, workspace_id },
    });
  }

  /**
   * Get summary of user's workspace membership
   */
  getSummary(): {
    user_id: number;
    workspace_id: number;
    role: string;
    is_default: boolean;
    permissions: {
      canView: boolean;
      canEdit: boolean;
      canManageMembers: boolean;
      canEditSettings: boolean;
    };
  } {
    return {
      user_id: this.user_id,
      workspace_id: this.workspace_id,
      role: this.role,
      is_default: this.is_default ?? false,
      permissions: {
        canView: this.canView(),
        canEdit: this.canEditContent(),
        canManageMembers: this.canManageMembers(),
        canEditSettings: this.canEditSettings(),
      },
    };
  }

  constructor(init?: Partial<IUserWorkspace>) {
    super();
    if (init) {
      Object.assign(this, init);
    }
  }
}
