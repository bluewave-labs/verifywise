/**
 * @fileoverview Comment Model
 *
 * Defines the Comment entity for row-level comments system.
 * Supports multi-tenancy and is table/row-scoped for flexible attachment to any table row.
 *
 * Database Schema:
 * - id: Auto-incrementing primary key
 * - table_id: Identifier for the table (e.g., "vendors", "risk-management")
 * - row_id: Identifier for the row within the table
 * - message: Comment text content
 * - user_id: Foreign key to UserModel (comment author)
 * - organization_id: Foreign key to OrganizationModel (multi-tenancy)
 * - created_at: Comment creation timestamp
 * - updated_at: Last update timestamp
 *
 * @module domain.layer/models/comment
 */

import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from "sequelize-typescript";
import { UserModel } from "../user/user.model";
import { OrganizationModel } from "../organization/organization.model";
import { CommentReactionModel } from "./commentReaction.model";
import { CommentFileModel } from "./commentFile.model";
import {
  ValidationException,
  BusinessLogicException,
} from "../../exceptions/custom.exception";

@Table({
  tableName: "comments",
  timestamps: true,
  underscored: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
})
export class CommentModel extends Model<CommentModel> {
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
  table_id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  row_id!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  message!: string;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id!: number;

  @BelongsTo(() => UserModel, { foreignKey: 'user_id', as: 'user' })
  user?: UserModel;

  @ForeignKey(() => OrganizationModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  organization_id!: number;

  @BelongsTo(() => OrganizationModel, { foreignKey: 'organization_id', as: 'organization' })
  organization?: OrganizationModel;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  updated_at?: Date;

  @HasMany(() => CommentReactionModel, { foreignKey: 'comment_id', as: 'reactions' })
  reactions?: CommentReactionModel[];

  @HasMany(() => CommentFileModel, { foreignKey: 'comment_id', as: 'files' })
  files?: CommentFileModel[];

  /**
   * Create a new comment with validation
   */
  static async createNewComment(
    table_id: string,
    row_id: string,
    message: string,
    user_id: number,
    organization_id: number
  ): Promise<CommentModel> {
    // Validate required fields
    if (!table_id || table_id.trim().length === 0) {
      throw new ValidationException(
        "Table ID is required",
        "table_id",
        table_id
      );
    }

    if (!row_id || row_id.trim().length === 0) {
      throw new ValidationException("Row ID is required", "row_id", row_id);
    }

    if (!message || message.trim().length === 0) {
      throw new ValidationException("Message is required", "message", message);
    }

    // Validate message length (max 10000 characters)
    if (message.trim().length > 10000) {
      throw new ValidationException(
        "Message cannot exceed 10000 characters",
        "message",
        message.length
      );
    }

    // Basic XSS prevention: check for suspicious patterns
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // event handlers like onclick=
      /<iframe/gi,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(message)) {
        throw new ValidationException(
          "Message contains potentially unsafe content",
          "message",
          "HTML/script content detected"
        );
      }
    }

    if (!user_id || user_id <= 0) {
      throw new ValidationException(
        "Valid user ID is required",
        "user_id",
        user_id
      );
    }

    if (!organization_id || organization_id <= 0) {
      throw new ValidationException(
        "Valid organization ID is required",
        "organization_id",
        organization_id
      );
    }

    const comment = new CommentModel();
    comment.table_id = table_id.trim();
    comment.row_id = row_id.trim();
    comment.message = message.trim();
    comment.user_id = user_id;
    comment.organization_id = organization_id;

    return comment;
  }

  /**
   * Update comment message
   */
  async updateMessage(newMessage: string): Promise<void> {
    if (!newMessage || newMessage.trim().length === 0) {
      throw new ValidationException(
        "Message cannot be empty",
        "message",
        newMessage
      );
    }

    // Validate message length (max 10000 characters)
    if (newMessage.trim().length > 10000) {
      throw new ValidationException(
        "Message cannot exceed 10000 characters",
        "message",
        newMessage.length
      );
    }

    // Basic XSS prevention: check for suspicious patterns
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // event handlers like onclick=
      /<iframe/gi,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(newMessage)) {
        throw new ValidationException(
          "Message contains potentially unsafe content",
          "message",
          "HTML/script content detected"
        );
      }
    }

    this.message = newMessage.trim();
    this.updated_at = new Date();
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): any {
    return {
      id: this.id,
      table_id: this.table_id,
      row_id: this.row_id,
      message: this.message,
      user_id: this.user_id,
      organization_id: this.organization_id,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
      user: this.user ? {
        id: this.user.id,
        name: this.user.name,
        surname: this.user.surname,
      } : undefined,
    };
  }
}
