/**
 * @fileoverview Comment File Model
 *
 * Defines the CommentFile entity for file attachments in the comments system.
 * Supports both comment-attached files and standalone row files.
 *
 * Database Schema:
 * - id: Auto-incrementing primary key
 * - table_id: Identifier for the table
 * - row_id: Identifier for the row within the table
 * - comment_id: Optional foreign key to CommentModel (null for standalone files)
 * - file_name: Original file name
 * - file_path: Server file path or DO Spaces URL
 * - file_size: File size in bytes
 * - mime_type: File MIME type
 * - user_id: Foreign key to UserModel (uploader)
 * - organization_id: Foreign key to OrganizationModel (multi-tenancy)
 * - created_at: Upload timestamp
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
  tableName: "comment_files",
  timestamps: true,
  underscored: true,
  createdAt: "created_at",
  updatedAt: false,
})
export class CommentFileModel extends Model<CommentFileModel> {
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

  @ForeignKey(() => CommentModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  comment_id?: number;

  @BelongsTo(() => CommentModel, { foreignKey: 'comment_id', as: 'comment' })
  comment?: CommentModel;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  file_name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  file_path!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  file_size!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  mime_type!: string;

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

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  deleted_by?: number;

  @BelongsTo(() => UserModel, { foreignKey: 'deleted_by', as: 'deletedByUser' })
  deletedByUser?: UserModel;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deleted_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at?: Date;

  /**
   * Create a new comment file with validation
   */
  static async createNewFile(
    table_id: string,
    row_id: string,
    file_name: string,
    file_path: string,
    file_size: number,
    mime_type: string,
    user_id: number,
    organization_id: number,
    comment_id?: number
  ): Promise<CommentFileModel> {
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

    if (!file_name || file_name.trim().length === 0) {
      throw new ValidationException(
        "File name is required",
        "file_name",
        file_name
      );
    }

    if (!file_path || file_path.trim().length === 0) {
      throw new ValidationException(
        "File path is required",
        "file_path",
        file_path
      );
    }

    if (!file_size || file_size <= 0) {
      throw new ValidationException(
        "Valid file size is required",
        "file_size",
        file_size
      );
    }

    if (!mime_type || mime_type.trim().length === 0) {
      throw new ValidationException(
        "MIME type is required",
        "mime_type",
        mime_type
      );
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

    const file = new CommentFileModel();
    file.table_id = table_id.trim();
    file.row_id = row_id.trim();
    file.file_name = file_name.trim();
    file.file_path = file_path.trim();
    file.file_size = file_size;
    file.mime_type = mime_type.trim();
    file.user_id = user_id;
    file.organization_id = organization_id;
    file.comment_id = comment_id;

    return file;
  }

  /**
   * Get file size in human-readable format
   */
  getFormattedFileSize(): string {
    const bytes = this.file_size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  /**
   * Check if file is an image
   */
  isImage(): boolean {
    return this.mime_type.startsWith("image/");
  }

  /**
   * Check if file is a document
   */
  isDocument(): boolean {
    const docTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    return docTypes.includes(this.mime_type);
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): any {
    return {
      id: this.id,
      table_id: this.table_id,
      row_id: this.row_id,
      comment_id: this.comment_id,
      file_name: this.file_name,
      file_path: this.file_path,
      file_size: this.file_size,
      formatted_size: this.getFormattedFileSize(),
      mime_type: this.mime_type,
      is_image: this.isImage(),
      is_document: this.isDocument(),
      user_id: this.user_id,
      user: this.user,
      organization_id: this.organization_id,
      created_at: this.created_at?.toISOString(),
      deleted_by: this.deleted_by,
      deletedByUser: this.deletedByUser,
      deleted_at: this.deleted_at?.toISOString(),
    };
  }
}
