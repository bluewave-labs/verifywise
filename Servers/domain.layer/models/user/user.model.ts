import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { RoleModel } from "../../../models/role.model";
import { emailValidation } from "../../validations/email.valid";
import { numberValidation } from "../../validations/number.valid";
import { passwordValidation } from "../../validations/password.valid";
import {
  ValidationException,
  BusinessLogicException,
  ConflictException,
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
   * Validate user data before saving
   */
  async validateUserData(): Promise<void> {
    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationException("Name is required", "name", this.name);
    }

    if (!this.surname || this.surname.trim().length === 0) {
      throw new ValidationException(
        "Surname is required",
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
   * Update password with new hash
   */
  async updatePassword(newPassword: string): Promise<void> {
    const passwordValidationResult = passwordValidation(newPassword);
    if (!passwordValidationResult.isValid) {
      throw new ValidationException(
        "Password must contain at least one lowercase letter, one uppercase letter, one digit, and be at least 8 characters long",
        "password",
        undefined,
        { metadata: { validationDetails: passwordValidationResult } }
      );
    }

    this.password_hash = await bcrypt.hash(newPassword, 10);
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
   */
  static async validateEmailUniqueness(
    email: string,
    excludeUserId?: number
  ): Promise<void> {
    // This would typically check against the database
    // For now, we'll throw a business logic exception as placeholder
    // In real implementation, you'd query the database here
    throw new BusinessLogicException(
      "Email uniqueness validation should be implemented with database query",
      "EMAIL_UNIQUENESS_CHECK",
      { email, excludeUserId }
    );
  }

  /**
   * Get user data without sensitive information
   */
  toSafeJSON(): any {
    const { password_hash, ...safeUser } = this.get({ plain: true });
    return safeUser;
  }

  isDemoUser(): boolean {
    return this.is_demo ?? false;
  }

  isAdmin(): boolean {
    return this.role_id === 1;
  }

  updateLastLogin(): void {
    this.last_login = new Date();
  }

  static fromJSON(json: any): UserModel {
    return new UserModel(json);
  }

  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      surname: this.surname,
      email: this.email,
      role_id: this.role_id,
      created_at: this.created_at.toISOString(),
      last_login: this.last_login.toISOString(),
    };
  }
}
