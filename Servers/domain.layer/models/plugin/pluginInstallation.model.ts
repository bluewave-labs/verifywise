import { QueryTypes } from "sequelize";
import { sequelize } from "../../../database/db";
import { IPluginInstallation } from "../../interfaces/i.pluginInstallation";
import { PluginInstallationStatus } from "../../enums/plugin.enum";
import { getTenantHash } from "../../../tools/getTenantHash";
import {
  ValidationException,
  NotFoundException,
} from "../../exceptions/custom.exception";

/**
 * Plugin Installation Model
 * Uses raw SQL queries to interact with tenant-scoped plugin_installations table
 */
export class PluginInstallationModel {
  /**
   * Create a new plugin installation
   */
  static async createInstallation(
    plugin_key: string,
    organization_id: number
  ): Promise<IPluginInstallation> {
    // Validate required fields
    if (!plugin_key || plugin_key.trim().length === 0) {
      throw new ValidationException(
        "Plugin key is required",
        "plugin_key",
        plugin_key
      );
    }

    if (!organization_id || organization_id < 1) {
      throw new ValidationException(
        "Valid organization ID is required (must be >= 1)",
        "organization_id",
        organization_id
      );
    }

    const tenantHash = getTenantHash(organization_id);

    // Check if already installed
    const existing = await sequelize.query(
      `SELECT * FROM "${tenantHash}".plugin_installations
       WHERE plugin_key = :plugin_key
       LIMIT 1`,
      {
        replacements: { plugin_key: plugin_key.trim() },
        type: QueryTypes.SELECT,
      }
    );

    if (existing && existing.length > 0) {
      throw new ValidationException(
        "Plugin is already installed",
        "plugin_key",
        plugin_key
      );
    }

    // Create installation record
    const result = await sequelize.query(
      `INSERT INTO "${tenantHash}".plugin_installations
       (plugin_key, status, created_at, updated_at)
       VALUES (:plugin_key, :status, NOW(), NOW())
       RETURNING *`,
      {
        replacements: {
          plugin_key: plugin_key.trim(),
          status: PluginInstallationStatus.INSTALLED,
        },
        type: QueryTypes.INSERT,
      }
    );

    return (result[0] as any)[0] as IPluginInstallation;
  }

  /**
   * Find installation by plugin key
   */
  static async findByPlugin(
    plugin_key: string,
    organization_id: number
  ): Promise<IPluginInstallation | null> {
    const tenantHash = getTenantHash(organization_id);

    const results = await sequelize.query(
      `SELECT * FROM "${tenantHash}".plugin_installations
       WHERE plugin_key = :plugin_key
       LIMIT 1`,
      {
        replacements: { plugin_key: plugin_key.trim() },
        type: QueryTypes.SELECT,
      }
    );

    return results.length > 0 ? (results[0] as IPluginInstallation) : null;
  }

  /**
   * Get all installed plugins for an organization
   */
  static async getInstalledPlugins(
    organization_id: number
  ): Promise<IPluginInstallation[]> {
    const tenantHash = getTenantHash(organization_id);

    const results = await sequelize.query(
      `SELECT * FROM "${tenantHash}".plugin_installations
       ORDER BY installed_at DESC`,
      {
        type: QueryTypes.SELECT,
      }
    );

    return results as IPluginInstallation[];
  }

  /**
   * Find installation by ID
   */
  static async findById(
    id: number,
    organization_id: number
  ): Promise<IPluginInstallation | null> {
    if (!id || id < 1) {
      throw new ValidationException(
        "Valid installation ID is required (must be >= 1)",
        "id",
        id
      );
    }

    const tenantHash = getTenantHash(organization_id);

    const results = await sequelize.query(
      `SELECT * FROM "${tenantHash}".plugin_installations
       WHERE id = :id
       LIMIT 1`,
      {
        replacements: { id },
        type: QueryTypes.SELECT,
      }
    );

    return results.length > 0 ? (results[0] as IPluginInstallation) : null;
  }

  /**
   * Find installation by ID with validation
   */
  static async findByIdWithValidation(
    id: number,
    organization_id: number
  ): Promise<IPluginInstallation> {
    const installation = await this.findById(id, organization_id);

    if (!installation) {
      throw new NotFoundException("Plugin installation not found", "installation", id);
    }

    return installation;
  }

  /**
   * Update installation status
   */
  static async updateStatus(
    id: number,
    organization_id: number,
    status: PluginInstallationStatus
  ): Promise<IPluginInstallation> {
    const tenantHash = getTenantHash(organization_id);

    const results = await sequelize.query(
      `UPDATE "${tenantHash}".plugin_installations
       SET status = :status, installed_at = NOW(), error_message = NULL, updated_at = NOW()
       WHERE id = :id
       RETURNING *`,
      {
        replacements: { id, status },
        type: QueryTypes.UPDATE,
      }
    );

    if (!results || !results[0] || !(results[0] as any)[0]) {
      throw new NotFoundException("Plugin installation not found after update", "installation", id);
    }

    return (results[0] as any)[0] as IPluginInstallation;
  }

  /**
   * Delete installation
   */
  static async delete(
    id: number,
    organization_id: number
  ): Promise<void> {
    const tenantHash = getTenantHash(organization_id);

    await sequelize.query(
      `DELETE FROM "${tenantHash}".plugin_installations
       WHERE id = :id`,
      {
        replacements: { id },
        type: QueryTypes.DELETE,
      }
    );
  }

  /**
   * Update configuration
   */
  static async updateConfiguration(
    id: number,
    organization_id: number,
    configuration: any
  ): Promise<IPluginInstallation> {
    const tenantHash = getTenantHash(organization_id);

    const results = await sequelize.query(
      `UPDATE "${tenantHash}".plugin_installations
       SET configuration = :configuration, updated_at = NOW()
       WHERE id = :id
       RETURNING *`,
      {
        replacements: { id, configuration: JSON.stringify(configuration) },
        type: QueryTypes.UPDATE,
      }
    );

    if (!results || !results[0] || !(results[0] as any)[0]) {
      throw new NotFoundException("Plugin installation not found after configuration update", "installation", id);
    }

    return (results[0] as any)[0] as IPluginInstallation;
  }

  /**
   * Convert snake_case to camelCase for frontend
   */
  static toJSON(installation: IPluginInstallation): any {
    return {
      id: installation.id,
      pluginKey: installation.plugin_key,
      status: installation.status,
      installedAt: installation.installed_at,
      errorMessage: installation.error_message,
      configuration: installation.configuration,
      metadata: installation.metadata,
      createdAt: installation.created_at,
      updatedAt: installation.updated_at,
    };
  }
}
