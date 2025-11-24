/**
 * @fileoverview Comment Reaction Model
 *
 * Defines the CommentReaction entity for emoji reactions on comments.
 * Supports multi-tenancy and prevents duplicate reactions from same user.
 *
 * Database Schema:
 * - id: Auto-incrementing primary key
 * - comment_id: Foreign key to CommentModel
 * - emoji: Emoji character
 * - user_id: Foreign key to UserModel (reactor)
 * - organization_id: Foreign key to OrganizationModel (multi-tenancy)
 * - created_at: Reaction timestamp
 *
 * @module domain.layer/models/comment
 */

import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { UserModel } from "../user/user.model";
import { OrganizationModel } from "../organization/organization.model";
import { CommentModel } from "./comment.model";
import {
  ValidationException,
  BusinessLogicException,
} from "../../exceptions/custom.exception";

@Table({
  tableName: "comment_reactions",
  timestamps: true,
  underscored: true,
  createdAt: "created_at",
  updatedAt: false,
})
export class CommentReactionModel extends Model<CommentReactionModel> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @ForeignKey(() => CommentModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  comment_id!: number;

  @BelongsTo(() => CommentModel, { foreignKey: 'comment_id', as: 'comment' })
  comment?: CommentModel;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
  })
  emoji!: string;

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

  /**
   * Create a new reaction with validation
   */
  static async createNewReaction(
    comment_id: number,
    emoji: string,
    user_id: number,
    organization_id: number
  ): Promise<CommentReactionModel> {
    // Validate required fields
    if (!comment_id || comment_id <= 0) {
      throw new ValidationException(
        "Valid comment ID is required",
        "comment_id",
        comment_id
      );
    }

    if (!emoji || emoji.trim().length === 0) {
      throw new ValidationException("Emoji is required", "emoji", emoji);
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

    // Check if user already reacted with this emoji
    const existingReaction = await CommentReactionModel.findOne({
      where: {
        comment_id,
        emoji: emoji.trim(),
        user_id,
        organization_id,
      },
    });

    if (existingReaction) {
      throw new BusinessLogicException(
        "User already reacted with this emoji",
        "DUPLICATE_REACTION",
        { comment_id, emoji, user_id }
      );
    }

    const reaction = new CommentReactionModel();
    reaction.comment_id = comment_id;
    reaction.emoji = emoji.trim();
    reaction.user_id = user_id;
    reaction.organization_id = organization_id;

    return reaction;
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): any {
    return {
      id: this.id,
      comment_id: this.comment_id,
      emoji: this.emoji,
      user_id: this.user_id,
      organization_id: this.organization_id,
      created_at: this.created_at?.toISOString(),
    };
  }
}
