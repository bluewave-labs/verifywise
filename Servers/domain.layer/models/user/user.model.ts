import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { RoleModel } from "../role/role.model";
import { emailValidation } from "../../validations/email.valid";
import { numberValidation } from "../../validations/number.valid";
import { passwordValidation } from "../../validations/password.valid";
import {
  ValidationException,
  BusinessLogicException,
} from "../../exceptions/custom.exception";
import bcrypt from "bcrypt";

@Table({
  tableName: "users",
})
export class UserModel extends Model<UserModel> {
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
  surname!: string;

  @Column({
    type: DataType.STRING,
  })
  email!: string;

  @Column({
    type: DataType.STRING,
  })
  password_hash!: string;

  @ForeignKey(() => RoleModel)
  @Column({
    type: DataType.INTEGER,
  })
  role_id!: number;

  @Column({
    type: DataType.DATE,
  })
  created_at!: Date;

  @Column({
    type: DataType.DATE,
  })
  last_login!: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_demo?: boolean;

  static async createNewUser(
    name: string,
    surname: string,
    email: string,
    password: string,
    role_id: number
  ): Promise<UserModel> {
    // Validate email
    if (!emailValidation(email)) {
      throw new ValidationException("Invalid email format", "email", email);
    }

    // Validate password
    const passwordValidationResult = passwordValidation(password);
    if (!passwordValidationResult.isValid) {
      throw new ValidationException(
        "Password must contain at least one lowercase letter, one uppercase letter, one digit, and be at least 8 characters long",
        "password",
        undefined,
        { metadata: { validationDetails: passwordValidationResult } }
      );
    }

    // Validate role_id
    if (!numberValidation(role_id, 1)) {
      throw new ValidationException("Invalid role_id", "role_id", role_id);
    }

    // Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    // Create and return the user model instance
    const user = new UserModel();
    user.name = name;
    user.surname = surname;
    user.email = email;
    user.password_hash = password_hash;
    user.role_id = role_id;
    user.created_at = new Date();
    user.last_login = new Date();
    user.is_demo = false;

    return user;
  }

  /**
   * Update current user's profile information
   */
  async updateCurrentUser(updateData: {
    name?: string;
    surname?: string;
    email?: string;
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
      this.name = updateData.name.trim();
    }

    // Validate surname if provided
    if (updateData.surname !== undefined) {
      if (!updateData.surname || updateData.surname.trim().length === 0) {
        throw new ValidationException(
          "Surname is required",
          "surname",
          updateData.surname
        );
      }
      if (updateData.surname.trim().length < 2) {
        throw new ValidationException(
          "Surname must be at least 2 characters long",
          "surname",
          updateData.surname
        );
      }
      this.surname = updateData.surname.trim();
    }

    // Validate email if provided
    if (updateData.email !== undefined) {
      if (!emailValidation(updateData.email)) {
        throw new ValidationException(
          "Valid email is required",
          "email",
          updateData.email
        );
      }
      this.email = updateData.email.trim();
    }
  }

  /**
   * Validate user data before saving
   */
  async validateUserData(): Promise<void> {
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

    if (!this.surname || this.surname.trim().length === 0) {
      throw new ValidationException(
        "Surname is required",
        "surname",
        this.surname
      );
    }

    if (this.surname.trim().length < 2) {
      throw new ValidationException(
        "Surname must be at least 2 characters long",
        "surname",
        this.surname
      );
    }

    if (!this.email || !emailValidation(this.email)) {
      throw new ValidationException(
        "Valid email is required",
        "email",
        this.email
      );
    }

    if (!this.role_id || !numberValidation(this.role_id, 1)) {
      throw new ValidationException(
        "Valid role_id is required",
        "role_id",
        this.role_id
      );
    }
  }

  /**
   * Compare password with stored hash
   */
  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }

  /**
   * Update user's password with comprehensive validation
   */
  async updatePassword(
    newPassword: string,
    currentPassword?: string
  ): Promise<void> {
    // Validate new password
    const passwordValidationResult = passwordValidation(newPassword);
    if (!passwordValidationResult.isValid) {
      throw new ValidationException(
        "Password must contain at least one lowercase letter, one uppercase letter, one digit, and be at least 8 characters long",
        "password",
        undefined,
        { metadata: { validationDetails: passwordValidationResult } }
      );
    }

    // If current password is provided, verify it matches
    if (currentPassword) {
      const isCurrentPasswordValid = await this.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        throw new ValidationException(
          "Current password is incorrect",
          "currentPassword",
          undefined
        );
      }
    }

    // Prevent demo users from changing passwords
    if (this.isDemoUser()) {
      throw new BusinessLogicException(
        "Demo users cannot change their passwords",
        "DEMO_USER_RESTRICTION",
        { userId: this.id, userEmail: this.email }
      );
    }

    // Hash and update the password
    this.password_hash = await bcrypt.hash(newPassword, 10);
  }

  /**
   * Update user's role with security validations
   */
  async updateRole(newRoleId: number, currentUser: UserModel): Promise<void> {
    // Validate role_id
    if (!numberValidation(newRoleId, 1)) {
      throw new ValidationException(
        "Valid role_id is required (must be >= 1)",
        "role_id",
        newRoleId
      );
    }

    // Security check: Only administrators can update user roles
    if (!currentUser.isAdmin()) {
      throw new BusinessLogicException(
        "Only administrators can update user roles",
        "INSUFFICIENT_PERMISSIONS",
        {
          currentUserId: currentUser.id,
          targetUserId: this.id,
          requestedRoleId: newRoleId,
        }
      );
    }

    // Prevent demo users from being assigned admin roles
    if (this.isDemoUser() && newRoleId === 1) {
      throw new BusinessLogicException(
        "Demo users cannot be assigned admin roles",
        "DEMO_USER_RESTRICTION",
        { userId: this.id, requestedRoleId: newRoleId }
      );
    }

    // Prevent users from demoting themselves from admin role
    if (this.id === currentUser.id && this.role_id === 1 && newRoleId !== 1) {
      throw new BusinessLogicException(
        "Administrators cannot demote themselves from admin role",
        "SELF_DEMOTION_RESTRICTION",
        {
          userId: this.id,
          currentRoleId: this.role_id,
          requestedRoleId: newRoleId,
        }
      );
    }

    // Update the role
    this.role_id = newRoleId;
  }

  /**
   * Check if user can perform admin actions
   */
  canPerformAdminAction(): boolean {
    if (this.isDemoUser()) {
      throw new BusinessLogicException(
        "Demo users cannot perform admin actions",
        "DEMO_USER_RESTRICTION",
        { userId: this.id, userEmail: this.email }
      );
    }
    return this.isAdmin();
  }

  /**
   * Check if user can modify another user
   */
  canModifyUser(targetUserId: number): boolean {
    if (this.isDemoUser()) {
      throw new BusinessLogicException(
        "Demo users cannot modify other users",
        "DEMO_USER_RESTRICTION",
        { userId: this.id, targetUserId }
      );
    }

    // Admin can modify anyone, regular users can only modify themselves
    return this.isAdmin() || this.id === targetUserId;
  }

  /**
   * Validate email uniqueness (to be used before saving)
   * This method should be implemented with actual database query
   */
  static async validateEmailUniqueness(
    email: string,
    excludeUserId?: number
  ): Promise<boolean> {
    // This is a placeholder implementation
    // In real implementation, you would query the database like:
    // const existingUser = await UserModel.findOne({ where: { email } });
    // if (existingUser && existingUser.id !== excludeUserId) {
    //   return false; // Email already exists
    // }
    // return true; // Email is unique

    // For now, return true to allow the operation to proceed
    // The actual uniqueness check should be handled at the database level
    return true;
  }

  /**
   * Get user data without sensitive information
   */
  toSafeJSON(): any {
    const { password_hash, ...safeUser } = this.get({ plain: true });
    return safeUser;
  }

  /**
   * Get user's full name
   */
  getFullName(): string {
    return `${this.name} ${this.surname}`.trim();
  }

  /**
   * Check if user is a demo user
   */
  isDemoUser(): boolean {
    return this.is_demo ?? false;
  }

  /**
   * Check if user is an admin
   */
  isAdmin(): boolean {
    return this.role_id === 1;
  }

  /**
   * Update last login timestamp
   */
  updateLastLogin(): void {
    this.last_login = new Date();
  }

  /**
   * Create UserModel instance from JSON data
   */
  static fromJSON(json: any): UserModel {
    return new UserModel(json);
  }

  /**
   * Convert user model to JSON representation
   */
  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      surname: this.surname,
      email: this.email,
      role_id: this.role_id,
      created_at: this.created_at?.toISOString(),
      last_login: this.last_login?.toISOString(),
      is_demo: this.is_demo,
    };
  }

  /**
   * Get user's display name (first name + last name initial)
   */
  getDisplayName(): string {
    const firstName = this.name || "";
    const lastNameInitial = this.surname ? this.surname.charAt(0) + "." : "";
    return `${firstName} ${lastNameInitial}`.trim();
  }

  /**
   * Check if user account is active (not demo or has recent activity)
   */
  isActive(): boolean {
    if (this.isDemoUser()) {
      return false;
    }

    // Consider user active if they've logged in within the last 30 days
    if (this.last_login) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return this.last_login > thirtyDaysAgo;
    }

    return true; // New users are considered active
  }
}
