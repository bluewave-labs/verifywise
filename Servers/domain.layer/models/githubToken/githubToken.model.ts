/**
 * @fileoverview GitHub Token Model
 *
 * Sequelize model for github_tokens table.
 * Stores encrypted GitHub Personal Access Tokens for private repository access.
 *
 * Security Features:
 * - Tokens are encrypted at rest using AES-256-CBC
 * - Only one token per organization
 * - Token never returned to frontend (only status info)
 *
 * @module domain.layer/models/githubToken/githubToken.model
 */

import { Column, DataType, Model, Table } from "sequelize-typescript";
import { IGitHubToken } from "../../interfaces/i.aiDetection";

@Table({
  tableName: "github_tokens",
  timestamps: false,
})
export class GitHubTokenModel extends Model<GitHubTokenModel> implements IGitHubToken {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  encrypted_token!: string;

  @Column({
    type: DataType.STRING(100),
    defaultValue: "GitHub Personal Access Token",
  })
  token_name?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  created_by!: number;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  created_at?: Date;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  updated_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  last_used_at?: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Mark the token as recently used
   */
  markUsed(): void {
    this.last_used_at = new Date();
    this.updated_at = new Date();
  }

  constructor(init?: Partial<IGitHubToken>) {
    super();
    if (init) {
      Object.assign(this, init);
    }
  }
}
