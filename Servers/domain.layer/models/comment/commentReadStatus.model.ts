/**
 * @fileoverview Comment Read Status Model
 *
 * Tracks when users last read comments for specific table/row combinations.
 * Used to calculate unread message counts and mark messages as read.
 *
 * Database Schema:
 * - id: Auto-incrementing primary key
 * - user_id: Foreign key to UserModel (reader)
 * - table_id: Identifier for the table (e.g., "vendors", "risk-management")
 * - row_id: Identifier for the row within the table
 * - organization_id: Foreign key to OrganizationModel (multi-tenancy)
 * - last_read_at: Timestamp when user last viewed/read comments for this row
 * - created_at: Record creation timestamp
 * - updated_at: Last update timestamp
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
import {
  ValidationException,
} from "../../exceptions/custom.exception";

@Table({
  tableName: "comment_read_status",
  timestamps: true,
  underscored: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
})
export class CommentReadStatusModel extends Model<CommentReadStatusModel> {
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

  @BelongsTo(() => UserModel, { foreignKey: 'user_id', as: 'user' })
  user?: UserModel;

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
  last_read_at!: Date;

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

  /**
   * Update or create read status for a user/table/row combination
   * Accepts row_id as string or number for flexibility
   */
  static async markAsRead(
    user_id: number,
    table_id: string,
    row_id: string | number,
    organization_id: number
  ): Promise<CommentReadStatusModel> {
    // Normalize row_id to string and trim
    const normalizedRowId = String(row_id).trim();
    const normalizedTableId = table_id.trim();

    // Validate inputs
    if (!user_id || user_id <= 0) {
      throw new ValidationException(
        "Valid user ID is required",
        "user_id",
        user_id
      );
    }

    if (!normalizedTableId) {
      throw new ValidationException(
        "Table ID is required",
        "table_id",
        table_id
      );
    }

    if (!normalizedRowId) {
      throw new ValidationException("Row ID is required", "row_id", row_id);
    }

    if (!organization_id || organization_id <= 0) {
      throw new ValidationException(
        "Valid organization ID is required",
        "organization_id",
        organization_id
      );
    }

    // Use upsert to create or update the read status
    const [readStatus] = await CommentReadStatusModel.upsert(
      {
        user_id,
        table_id: normalizedTableId,
        row_id: normalizedRowId,
        organization_id,
        last_read_at: new Date(),
      } as any,
      {
        conflictFields: ['user_id', 'table_id', 'row_id', 'organization_id'],
        returning: true,
      }
    );

    return readStatus;
  }

  /**
   * Get the last read timestamp for a user/table/row combination
   * Accepts row_id as string or number for flexibility
   */
  static async getLastReadAt(
    user_id: number,
    table_id: string,
    row_id: string | number,
    organization_id: number
  ): Promise<Date | null> {
    // Normalize row_id to match storage format
    const normalizedRowId = String(row_id).trim();

    const readStatus = await CommentReadStatusModel.findOne({
      where: {
        user_id,
        table_id: table_id.trim(),
        row_id: normalizedRowId,
        organization_id,
      },
    });

    return readStatus ? readStatus.last_read_at : null;
  }
}
