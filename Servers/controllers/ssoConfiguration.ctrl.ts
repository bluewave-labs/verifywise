import { Request, Response } from 'express';
import { SSOConfigurationModel } from '../domain.layer/models/sso/ssoConfiguration.model';
import { decryptSecret } from '../utils/sso-encryption.utils';
import { sequelize } from '../database/db';

/**
 * SSO Configuration Controller
 * Handles CRUD operations for SSO configuration
 */

/**
 * Get SSO configuration for an organization
 */
export const getSSOConfiguration = async (req: Request, res: Response) => {
  try {
    const organizationId = req.params.organizationId;

    // Verify user belongs to organization and is admin
    if (req.organizationId !== parseInt(organizationId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this organization'
      });
    }

    if (req.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Find SSO configuration
    const ssoConfig = await SSOConfigurationModel.findOne({
      where: { organization_id: organizationId }
    });

    if (!ssoConfig) {
      return res.json({
        success: true,
        data: {
          exists: false,
          is_enabled: false
        }
      });
    }

    // Return configuration without client secret
    return res.json({
      success: true,
      data: {
        exists: true,
        azure_tenant_id: ssoConfig.azure_tenant_id,
        azure_client_id: ssoConfig.azure_client_id,
        cloud_environment: ssoConfig.cloud_environment,
        is_enabled: ssoConfig.is_enabled,
        created_at: ssoConfig.created_at,
        updated_at: ssoConfig.updated_at
      }
    });
  } catch (error) {
    console.error('Error getting SSO configuration:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve SSO configuration'
    });
  }
};

/**
 * Create or update SSO configuration
 */
export const createOrUpdateSSOConfiguration = async (req: Request, res: Response) => {
  try {
    const organizationId = req.params.organizationId;

    // Verify user belongs to organization and is admin
    if (req.organizationId !== parseInt(organizationId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this organization'
      });
    }

    if (req.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const {
      azure_tenant_id,
      azure_client_id,
      azure_client_secret,
      cloud_environment = 'AzurePublic'
    } = req.body;

    // Validate required fields
    if (!azure_tenant_id || !azure_client_id || !azure_client_secret) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: azure_tenant_id, azure_client_id, azure_client_secret'
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(azure_tenant_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid azure_tenant_id format. Must be a valid UUID'
      });
    }

    if (!uuidRegex.test(azure_client_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid azure_client_id format. Must be a valid UUID'
      });
    }

    // Validate client secret length
    if (azure_client_secret.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Azure client secret must be at least 10 characters'
      });
    }

    // Validate cloud environment
    if (!['AzurePublic', 'AzureGovernment'].includes(cloud_environment)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cloud_environment. Must be AzurePublic or AzureGovernment'
      });
    }

    // Check if configuration exists
    const existingConfig = await SSOConfigurationModel.findOne({
      where: { organization_id: organizationId }
    });

    if (existingConfig) {
      // Update existing configuration
      await existingConfig.update({
        azure_tenant_id,
        azure_client_id,
        azure_client_secret, // Will be encrypted by model setter
        cloud_environment
      });

      return res.json({
        success: true,
        message: 'SSO configuration updated successfully',
        data: {
          azure_tenant_id: existingConfig.azure_tenant_id,
          azure_client_id: existingConfig.azure_client_id,
          cloud_environment: existingConfig.cloud_environment,
          is_enabled: existingConfig.is_enabled
        }
      });
    } else {
      // Create new configuration
      const newConfig = await SSOConfigurationModel.create({
        organization_id: parseInt(organizationId),
        azure_tenant_id,
        azure_client_id,
        azure_client_secret, // Will be encrypted by model setter
        cloud_environment,
        is_enabled: false // Always start with SSO disabled
      } as any);

      return res.status(201).json({
        success: true,
        message: 'SSO configuration created successfully',
        data: {
          azure_tenant_id: newConfig.azure_tenant_id,
          azure_client_id: newConfig.azure_client_id,
          cloud_environment: newConfig.cloud_environment,
          is_enabled: newConfig.is_enabled
        }
      });
    }
  } catch (error) {
    console.error('Error creating/updating SSO configuration:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save SSO configuration'
    });
  }
};

/**
 * Delete SSO configuration
 */
export const deleteSSOConfiguration = async (req: Request, res: Response) => {
  try {
    const organizationId = req.params.organizationId;

    // Verify user belongs to organization and is admin
    if (req.organizationId !== parseInt(organizationId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this organization'
      });
    }

    if (req.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Find and delete configuration
    const ssoConfig = await SSOConfigurationModel.findOne({
      where: { organization_id: organizationId }
    });

    if (!ssoConfig) {
      return res.status(404).json({
        success: false,
        error: 'SSO configuration not found'
      });
    }

    // Don't allow deletion if SSO is enabled
    if (ssoConfig.is_enabled) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete SSO configuration while it is enabled. Please disable SSO first.'
      });
    }

    await ssoConfig.destroy();

    return res.json({
      success: true,
      message: 'SSO configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting SSO configuration:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete SSO configuration'
    });
  }
};

/**
 * Enable SSO for an organization
 */
export const enableSSO = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();

  try {
    const organizationId = req.params.organizationId;

    // Verify user belongs to organization and is admin
    if (req.organizationId !== parseInt(organizationId)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Access denied to this organization'
      });
    }

    if (req.role !== 'Admin') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Find SSO configuration
    const ssoConfig = await SSOConfigurationModel.findOne({
      where: { organization_id: organizationId },
      transaction
    });

    if (!ssoConfig) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'SSO configuration not found. Please configure SSO first.'
      });
    }

    if (ssoConfig.is_enabled) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'SSO is already enabled for this organization'
      });
    }

    // Enable SSO
    await ssoConfig.update({ is_enabled: true }, { transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: 'SSO has been successfully enabled for this organization',
      data: {
        is_enabled: true,
        azure_tenant_id: ssoConfig.azure_tenant_id,
        cloud_environment: ssoConfig.cloud_environment
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error enabling SSO:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to enable SSO'
    });
  }
};

/**
 * Disable SSO for an organization
 */
export const disableSSO = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();

  try {
    const organizationId = req.params.organizationId;

    // Verify user belongs to organization and is admin
    if (req.organizationId !== parseInt(organizationId)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Access denied to this organization'
      });
    }

    if (req.role !== 'Admin') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Find SSO configuration
    const ssoConfig = await SSOConfigurationModel.findOne({
      where: { organization_id: organizationId },
      transaction
    });

    if (!ssoConfig) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'SSO configuration not found'
      });
    }

    if (!ssoConfig.is_enabled) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'SSO is already disabled for this organization'
      });
    }

    // Disable SSO
    await ssoConfig.update({ is_enabled: false }, { transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: 'SSO has been successfully disabled for this organization. Users can now authenticate with username/password.',
      data: {
        is_enabled: false
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error disabling SSO:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to disable SSO'
    });
  }
};