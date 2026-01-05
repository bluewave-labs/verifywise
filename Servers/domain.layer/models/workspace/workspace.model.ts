/**
 * @fileoverview Workspace Model
 *
 * Defines the Workspace entity for multi-tenant workspace architecture within organizations.
 * Each workspace represents an isolated environment with its own database schema and
 * optional OIDC (OpenID Connect) configuration for SSO.
 *
 * Database Schema:
 * - id: Auto-incrementing primary key
 * - org_id: Foreign key to organizations table
 * - name: Workspace display name (2-255 chars)
 * - slug: URL-friendly identifier (unique, lowercase alphanumeric + hyphens)
 * - schema_name: PostgreSQL schema name (unique, auto-generated from slug)
 * - oidc_enabled: Whether OIDC SSO is enabled
 * - oidc_issuer: OIDC provider URL
 * - oidc_client_id: OIDC client identifier
 * - oidc_client_secret_encrypted: Encrypted OIDC client secret
 * - is_active: Soft delete / deactivation flag
 * - created_at: Workspace creation timestamp
 * - updated_at: Last update timestamp
 *
 * Key Features:
 * - Slug validation (lowercase alphanumeric with hyphens)
 * - Auto-generated schema_name from slug
 * - OIDC configuration validation
 * - Soft delete via is_active flag
 * - Organization association
 *
 * @module domain.layer/models/workspace
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
  IWorkspace,
  IWorkspaceUpdate,
} from "../../interfaces/i.workspace";
import { OrganizationModel } from "../organization/organization.model";
import { numberValidation } from "../../validations/number.valid";
import {
  ValidationException,
  BusinessLogicException,
  NotFoundException,
} from "../../exceptions/custom.exception";

/**
 * Slug validation regex: lowercase letters, numbers, hyphens (no leading/trailing hyphens)
 * Allows: test-workspace, my-project-123, abc, a1
 * Disallows: Test-Workspace, -test, test-, test--workspace, test_workspace
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * PostgreSQL schema name pattern: start with letter or underscore, followed by alphanumeric/underscore
 */
const SCHEMA_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/;

@Table({
  tableName: "workspaces",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
})
export class WorkspaceModel extends Model<WorkspaceModel> implements IWorkspace {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @ForeignKey(() => OrganizationModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  org_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING(63),
    allowNull: false,
    unique: true,
  })
  slug!: string;

  @Column({
    type: DataType.STRING(63),
    allowNull: false,
    unique: true,
  })
  schema_name!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  oidc_enabled?: boolean;

  @Column({
    type: DataType.STRING(512),
    allowNull: true,
  })
  oidc_issuer?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  oidc_client_id?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  oidc_client_secret_encrypted?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  is_active?: boolean;

  @Column({
    type: DataType.DATE,
  })
  created_at?: Date;

  @Column({
    type: DataType.DATE,
  })
  updated_at?: Date;

  // Associations
  @BelongsTo(() => OrganizationModel)
  organization?: OrganizationModel;

  /**
   * Validates slug format
   *
   * @static
   * @param {string} slug - Slug to validate
   * @returns {boolean} True if slug is valid
   */
  static validateSlug(slug: string): boolean {
    if (!slug || slug.trim().length === 0) {
      return false;
    }
    if (slug.length < 2 || slug.length > 63) {
      return false;
    }
    return SLUG_PATTERN.test(slug);
  }

  /**
   * Validates PostgreSQL schema name format
   *
   * @static
   * @param {string} schemaName - Schema name to validate
   * @returns {boolean} True if schema name is valid
   */
  static validateSchemaName(schemaName: string): boolean {
    if (!schemaName || schemaName.trim().length === 0) {
      return false;
    }
    return SCHEMA_NAME_PATTERN.test(schemaName) && schemaName.length <= 63;
  }

  /**
   * Generates a PostgreSQL schema name from slug
   *
   * @static
   * @param {string} slug - URL-friendly slug
   * @returns {string} Valid PostgreSQL schema name
   */
  static generateSchemaName(slug: string): string {
    return `ws_${slug.replace(/-/g, "_")}`;
  }

  /**
   * Creates a new workspace with validation
   *
   * Factory method that creates a WorkspaceModel instance with validated data.
   * Does NOT save to database - caller must persist using query utilities.
   *
   * @static
   * @async
   * @param {number} org_id - Organization ID
   * @param {string} name - Workspace display name (2-255 chars)
   * @param {string} slug - URL-friendly identifier (2-63 chars, lowercase alphanumeric + hyphens)
   * @param {Object} [options] - Optional OIDC configuration
   * @returns {Promise<WorkspaceModel>} WorkspaceModel instance (not yet persisted)
   * @throws {ValidationException} If any field fails validation
   */
  static async createNewWorkspace(
    org_id: number,
    name: string,
    slug: string,
    options?: {
      oidc_enabled?: boolean;
      oidc_issuer?: string;
      oidc_client_id?: string;
      oidc_client_secret_encrypted?: string;
    }
  ): Promise<WorkspaceModel> {
    // Validate org_id
    if (!numberValidation(org_id, 1)) {
      throw new ValidationException(
        "Valid organization ID is required",
        "org_id",
        org_id
      );
    }

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

    // Validate slug
    if (!WorkspaceModel.validateSlug(slug)) {
      throw new ValidationException(
        "Slug must be 2-63 lowercase alphanumeric characters with hyphens (no leading/trailing hyphens)",
        "slug",
        slug
      );
    }

    // Generate and validate schema_name
    const schema_name = WorkspaceModel.generateSchemaName(slug);
    if (!WorkspaceModel.validateSchemaName(schema_name)) {
      throw new ValidationException(
        "Generated schema name is invalid",
        "schema_name",
        schema_name
      );
    }

    // Validate OIDC fields if OIDC is enabled
    if (options?.oidc_enabled) {
      if (!options.oidc_issuer || options.oidc_issuer.trim().length === 0) {
        throw new ValidationException(
          "OIDC issuer is required when OIDC is enabled",
          "oidc_issuer",
          options.oidc_issuer
        );
      }
      if (!options.oidc_client_id || options.oidc_client_id.trim().length === 0) {
        throw new ValidationException(
          "OIDC client ID is required when OIDC is enabled",
          "oidc_client_id",
          options.oidc_client_id
        );
      }
      // Validate issuer URL format
      try {
        new URL(options.oidc_issuer);
      } catch {
        throw new ValidationException(
          "OIDC issuer must be a valid URL",
          "oidc_issuer",
          options.oidc_issuer
        );
      }
    }

    const workspace = new WorkspaceModel();
    workspace.org_id = org_id;
    workspace.name = name.trim();
    workspace.slug = slug;
    workspace.schema_name = schema_name;
    workspace.oidc_enabled = options?.oidc_enabled ?? false;
    workspace.oidc_issuer = options?.oidc_issuer;
    workspace.oidc_client_id = options?.oidc_client_id;
    workspace.oidc_client_secret_encrypted = options?.oidc_client_secret_encrypted;
    workspace.is_active = true;
    workspace.created_at = new Date();
    workspace.updated_at = new Date();

    return workspace;
  }

  /**
   * Updates workspace with validation
   *
   * @async
   * @param {IWorkspaceUpdate} updateData - Fields to update
   * @returns {Promise<void>}
   * @throws {ValidationException} If any field fails validation
   */
  async updateWorkspace(updateData: IWorkspaceUpdate): Promise<void> {
    if (updateData.name !== undefined) {
      if (!updateData.name || updateData.name.trim().length === 0) {
        throw new ValidationException("Name is required", "name", updateData.name);
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

    if (updateData.oidc_enabled !== undefined) {
      this.oidc_enabled = updateData.oidc_enabled;
    }

    // Update OIDC issuer with URL validation
    if (updateData.oidc_issuer !== undefined) {
      if (updateData.oidc_issuer && updateData.oidc_issuer.trim().length > 0) {
        try {
          new URL(updateData.oidc_issuer);
        } catch {
          throw new ValidationException(
            "OIDC issuer must be a valid URL",
            "oidc_issuer",
            updateData.oidc_issuer
          );
        }
      }
      this.oidc_issuer = updateData.oidc_issuer;
    }

    if (updateData.oidc_client_id !== undefined) {
      this.oidc_client_id = updateData.oidc_client_id;
    }

    if (updateData.oidc_client_secret_encrypted !== undefined) {
      this.oidc_client_secret_encrypted = updateData.oidc_client_secret_encrypted;
    }

    if (updateData.is_active !== undefined) {
      this.is_active = updateData.is_active;
    }

    // Validate OIDC configuration if enabled
    const willHaveOidcEnabled = updateData.oidc_enabled ?? this.oidc_enabled;
    if (willHaveOidcEnabled) {
      const issuer = updateData.oidc_issuer ?? this.oidc_issuer;
      const clientId = updateData.oidc_client_id ?? this.oidc_client_id;

      if (!issuer || issuer.trim().length === 0) {
        throw new ValidationException(
          "OIDC issuer is required when OIDC is enabled",
          "oidc_issuer",
          issuer
        );
      }
      if (!clientId || clientId.trim().length === 0) {
        throw new ValidationException(
          "OIDC client ID is required when OIDC is enabled",
          "oidc_client_id",
          clientId
        );
      }
    }

    this.updated_at = new Date();
  }

  /**
   * Validates all workspace data before persistence
   *
   * @async
   * @returns {Promise<void>}
   * @throws {ValidationException} If any required field is missing or invalid
   */
  async validateWorkspaceData(): Promise<void> {
    if (!numberValidation(this.org_id, 1)) {
      throw new ValidationException(
        "Valid organization ID is required",
        "org_id",
        this.org_id
      );
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationException("Name is required", "name", this.name);
    }

    if (!WorkspaceModel.validateSlug(this.slug)) {
      throw new ValidationException("Valid slug is required", "slug", this.slug);
    }

    if (!WorkspaceModel.validateSchemaName(this.schema_name)) {
      throw new ValidationException(
        "Valid schema_name is required",
        "schema_name",
        this.schema_name
      );
    }

    if (this.oidc_enabled) {
      if (!this.oidc_issuer || this.oidc_issuer.trim().length === 0) {
        throw new ValidationException(
          "OIDC issuer is required when OIDC is enabled",
          "oidc_issuer",
          this.oidc_issuer
        );
      }
      if (!this.oidc_client_id || this.oidc_client_id.trim().length === 0) {
        throw new ValidationException(
          "OIDC client ID is required when OIDC is enabled",
          "oidc_client_id",
          this.oidc_client_id
        );
      }
    }
  }

  /**
   * Check if workspace is active
   */
  isActiveWorkspace(): boolean {
    return this.is_active ?? true;
  }

  /**
   * Check if OIDC is fully configured
   */
  hasOidcConfigured(): boolean {
    return (
      this.oidc_enabled === true &&
      !!this.oidc_issuer &&
      !!this.oidc_client_id
    );
  }

  /**
   * Deactivate workspace
   * @throws {BusinessLogicException} If workspace is already deactivated
   */
  deactivate(): void {
    if (!this.is_active) {
      throw new BusinessLogicException(
        "Workspace is already deactivated",
        "WORKSPACE_ALREADY_DEACTIVATED",
        { workspaceId: this.id }
      );
    }
    this.is_active = false;
    this.updated_at = new Date();
  }

  /**
   * Activate workspace
   * @throws {BusinessLogicException} If workspace is already active
   */
  activate(): void {
    if (this.is_active) {
      throw new BusinessLogicException(
        "Workspace is already active",
        "WORKSPACE_ALREADY_ACTIVE",
        { workspaceId: this.id }
      );
    }
    this.is_active = true;
    this.updated_at = new Date();
  }

  /**
   * Returns workspace data without sensitive information
   */
  toSafeJSON(): any {
    return {
      id: this.id,
      org_id: this.org_id,
      name: this.name,
      slug: this.slug,
      schema_name: this.schema_name,
      oidc_enabled: this.oidc_enabled,
      oidc_issuer: this.oidc_issuer,
      oidc_client_id: this.oidc_client_id,
      // NOTE: oidc_client_secret_encrypted is excluded
      is_active: this.is_active,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
    };
  }

  /**
   * Convert workspace model to JSON representation
   */
  toJSON(): any {
    return this.toSafeJSON();
  }

  /**
   * Create WorkspaceModel instance from JSON data
   */
  static fromJSON(json: any): WorkspaceModel {
    return new WorkspaceModel(json);
  }

  /**
   * Finds workspace by ID with validation
   *
   * @static
   * @async
   * @param {number} id - Workspace ID (must be >= 1)
   * @returns {Promise<WorkspaceModel>} Workspace instance
   * @throws {ValidationException} If ID format is invalid
   * @throws {NotFoundException} If workspace not found
   */
  static async findByIdWithValidation(id: number): Promise<WorkspaceModel> {
    if (!numberValidation(id, 1)) {
      throw new ValidationException(
        "Valid ID is required (must be >= 1)",
        "id",
        id
      );
    }

    const workspace = await WorkspaceModel.findByPk(id);
    if (!workspace) {
      throw new NotFoundException("Workspace not found", "Workspace", id);
    }

    return workspace;
  }

  /**
   * Finds workspace by slug
   *
   * @static
   * @async
   * @param {string} slug - Workspace slug
   * @returns {Promise<WorkspaceModel | null>} Workspace instance or null
   * @throws {ValidationException} If slug format is invalid
   */
  static async findBySlug(slug: string): Promise<WorkspaceModel | null> {
    if (!WorkspaceModel.validateSlug(slug)) {
      throw new ValidationException("Valid slug is required", "slug", slug);
    }

    return await WorkspaceModel.findOne({ where: { slug } });
  }

  /**
   * Finds workspace by schema name
   *
   * @static
   * @async
   * @param {string} schemaName - PostgreSQL schema name
   * @returns {Promise<WorkspaceModel | null>} Workspace instance or null
   */
  static async findBySchemaName(schemaName: string): Promise<WorkspaceModel | null> {
    if (!WorkspaceModel.validateSchemaName(schemaName)) {
      throw new ValidationException(
        "Valid schema name is required",
        "schema_name",
        schemaName
      );
    }

    return await WorkspaceModel.findOne({ where: { schema_name: schemaName } });
  }

  /**
   * Finds all workspaces for an organization
   *
   * @static
   * @async
   * @param {number} orgId - Organization ID
   * @returns {Promise<WorkspaceModel[]>} Array of workspace instances
   */
  static async findByOrganizationId(orgId: number): Promise<WorkspaceModel[]> {
    if (!numberValidation(orgId, 1)) {
      throw new ValidationException(
        "Valid organization ID is required",
        "org_id",
        orgId
      );
    }

    return await WorkspaceModel.findAll({
      where: { org_id: orgId },
      order: [["created_at", "DESC"]],
    });
  }

  /**
   * Get workspace summary for display
   */
  getSummary(): {
    id: number | undefined;
    name: string;
    slug: string;
    is_active: boolean;
    has_oidc: boolean;
  } {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      is_active: this.is_active ?? true,
      has_oidc: this.hasOidcConfigured(),
    };
  }

  constructor(init?: Partial<IWorkspace>) {
    super();
    if (init) {
      Object.assign(this, init);
    }
  }
}
