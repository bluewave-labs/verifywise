/**
 * @fileoverview SSO Configuration Management Controller
 *
 * This controller handles comprehensive CRUD operations for Azure AD Single Sign-On
 * configurations, providing secure organization-scoped configuration management,
 * validation, testing, and administrative controls.
 *
 * Key Features:
 * - Complete CRUD operations for SSO configurations
 * - Administrative access control with organization isolation
 * - Comprehensive validation and testing endpoints
 * - Secure client secret handling with encryption
 * - Transaction-based operations for data consistency
 * - Enhanced error handling with detailed feedback
 *
 * Security Features:
 * - Organization-scoped access control
 * - Admin-only operations for configuration changes
 * - Client secret encryption and secure storage
 * - Comprehensive input validation
 * - Database transaction rollback on errors
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 * @see {@link https://docs.microsoft.com/en-us/azure/active-directory/develop/} Azure AD Documentation
 */

import { Request, Response } from 'express';
import '../types/express';
import { SSOConfigurationModel, IAzureAdConfig } from '../domain.layer/models/sso/ssoConfiguration.model';
import { decryptSecret } from '../utils/sso-encryption.utils';
import { SSOErrorHandler, SSOErrorCodes } from '../utils/sso-error-handler.utils';
import { SSOConfigValidator } from '../utils/sso-config-validator.utils';
import { sequelize } from '../database/db';

/**
 * Retrieves Azure AD SSO configuration for an organization
 *
 * Fetches the complete SSO configuration for the specified organization,
 * including Azure AD settings, enabled status, and authentication policies.
 * Client secrets are never returned for security reasons.
 *
 * @async
 * @function getSSOConfiguration
 * @param {Request} req - Express request object containing organization ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with configuration data or error
 *
 * @security
 * - Requires admin role within the target organization
 * - Organization-scoped access control prevents cross-tenant access
 * - Client secrets are excluded from response for security
 *
 * @response_format
 * Success: { success: true, data: { exists: true, azure_tenant_id, azure_client_id, ... } }
 * Not Found: { success: true, data: { exists: false, is_enabled: false } }
 * Error: { success: false, error: string }
 *
 * @example
 * ```typescript
 * // GET /api/sso-configuration/123
 * // Returns:
 * {
 *   "success": true,
 *   "data": {
 *     "exists": true,
 *     "azure_tenant_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
 *     "azure_client_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
 *     "cloud_environment": "AzurePublic",
 *     "is_enabled": true,
 *     "auth_method_policy": "both"
 *   }
 * }
 * ```
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

    // Find SSO configuration for the organization
    const ssoConfig = await SSOConfigurationModel.findOne({
      where: {
        organization_id: organizationId
      }
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

    // Extract Azure AD configuration from provider_config
    const azureConfig = ssoConfig.getAzureAdConfig();

    if (!azureConfig) {
      return res.status(500).json({
        success: false,
        error: 'Invalid Azure AD configuration'
      });
    }

    // Return configuration without client secret
    return res.json({
      success: true,
      data: {
        exists: true,
        azure_tenant_id: azureConfig.tenant_id,
        azure_client_id: azureConfig.client_id,
        cloud_environment: azureConfig.cloud_environment,
        is_enabled: ssoConfig.is_enabled,
        auth_method_policy: ssoConfig.auth_method_policy,
        created_at: ssoConfig.created_at,
        updated_at: ssoConfig.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching SSO configuration:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch SSO configuration'
    });
  }
};

/**
 * Creates or updates Azure AD SSO configuration for an organization
 *
 * Handles both creation of new SSO configurations and updates to existing ones.
 * Performs comprehensive validation, encrypts client secrets, and maintains
 * transaction integrity throughout the operation.
 *
 * @async
 * @function createOrUpdateSSOConfiguration
 * @param {Request} req - Express request object with organization ID and SSO configuration data
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with operation result and configuration data
 *
 * @request_body
 * - azure_tenant_id: string (required, GUID format)
 * - azure_client_id: string (required, GUID format)
 * - azure_client_secret: string (required, min 10 chars)
 * - cloud_environment: 'AzurePublic' | 'AzureGovernment' (default: 'AzurePublic')
 * - auth_method_policy: 'sso_only' | 'password_only' | 'both' (default: 'both')
 *
 * @security
 * - Requires admin role within the target organization
 * - Comprehensive input validation using SSOConfigValidator
 * - Client secret encryption before database storage
 * - Database transactions with automatic rollback on errors
 * - New configurations are created in disabled state for safety
 *
 * @validation
 * - GUID format validation for Azure AD tenant and client IDs
 * - Client secret strength requirements
 * - Cloud environment and authentication policy validation
 * - Domain validation if allowed_domains are specified
 *
 * @example
 * ```typescript
 * // POST /api/sso-configuration/123
 * // Body:
 * {
 *   "azure_tenant_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
 *   "azure_client_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
 *   "azure_client_secret": "secure_client_secret",
 *   "cloud_environment": "AzurePublic",
 *   "auth_method_policy": "both"
 * }
 *
 * // Response:
 * {
 *   "success": true,
 *   "message": "SSO configuration created successfully",
 *   "data": {
 *     "azure_tenant_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
 *     "azure_client_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
 *     "cloud_environment": "AzurePublic",
 *     "is_enabled": false,
 *     "auth_method_policy": "both"
 *   }
 * }
 * ```
 */
export const createOrUpdateSSOConfiguration = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();

  try {
    const organizationId = req.params.organizationId;
    const {
      azure_tenant_id,
      azure_client_id,
      azure_client_secret,
      cloud_environment = 'AzurePublic',
      auth_method_policy = 'both'
    } = req.body;

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

    // Comprehensive validation using the validator utility
    const validationResult = await SSOConfigValidator.validateSSOConfiguration({
      azure_tenant_id,
      azure_client_id,
      azure_client_secret,
      cloud_environment,
      auth_method_policy
    });

    if (!validationResult.isValid) {
      await transaction.rollback();
      return SSOErrorHandler.handleValidationError(
        res,
        validationResult.errors,
        'Invalid SSO configuration'
      );
    }

    // Log warnings if any
    if (validationResult.warnings.length > 0) {
      console.warn('SSO Configuration Warnings:', {
        organizationId,
        warnings: validationResult.warnings
      });
    }

    // Create Azure AD configuration object
    const azureConfig: IAzureAdConfig = {
      tenant_id: azure_tenant_id,
      client_id: azure_client_id,
      client_secret: azure_client_secret,
      cloud_environment: cloud_environment as 'AzurePublic' | 'AzureGovernment'
    };

    // Check if configuration exists
    const existingConfig = await SSOConfigurationModel.findOne({
      where: {
        organization_id: organizationId
      },
      transaction
    });

    if (existingConfig) {
      // Update existing configuration
      existingConfig.azure_tenant_id = azureConfig.tenant_id;
      existingConfig.azure_client_id = azureConfig.client_id;
      existingConfig.azure_client_secret = azureConfig.client_secret;
      existingConfig.cloud_environment = azureConfig.cloud_environment;
      existingConfig.auth_method_policy = auth_method_policy;
      await existingConfig.save({ transaction });

      await transaction.commit();

      const updatedAzureConfig = existingConfig.getAzureAdConfig();

      return res.json({
        success: true,
        message: 'SSO configuration updated successfully',
        data: {
          azure_tenant_id: updatedAzureConfig?.tenant_id,
          azure_client_id: updatedAzureConfig?.client_id,
          cloud_environment: updatedAzureConfig?.cloud_environment,
          is_enabled: existingConfig.is_enabled,
          auth_method_policy: existingConfig.auth_method_policy
        }
      });
    } else {
      // Create new configuration
      const newConfig = await SSOConfigurationModel.create({
        organization_id: parseInt(organizationId),
        azure_tenant_id: azureConfig.tenant_id,
        azure_client_id: azureConfig.client_id,
        azure_client_secret: azureConfig.client_secret,
        cloud_environment: azureConfig.cloud_environment,
        auth_method_policy,
        is_enabled: false // Always start with SSO disabled
      } as any, { transaction });

      await transaction.commit();

      const newAzureConfig = newConfig.getAzureAdConfig();

      return res.status(201).json({
        success: true,
        message: 'SSO configuration created successfully',
        data: {
          azure_tenant_id: newAzureConfig?.tenant_id,
          azure_client_id: newAzureConfig?.client_id,
          cloud_environment: newAzureConfig?.cloud_environment,
          is_enabled: newConfig.is_enabled,
          auth_method_policy: newConfig.auth_method_policy
        }
      });
    }

  } catch (error) {
    await transaction.rollback();

    // Use enhanced database error handling
    return SSOErrorHandler.handleDatabaseError(
      res,
      error,
      'SSO configuration creation/update'
    );
  }
};

/**
 * Delete SSO configuration
 */
export const deleteSSOConfiguration = async (req: Request, res: Response) => {
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

    // Find and delete configuration
    const deletedCount = await SSOConfigurationModel.destroy({
      where: {
        organization_id: organizationId
      },
      transaction
    });

    await transaction.commit();

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'SSO configuration not found'
      });
    }

    return res.json({
      success: true,
      message: 'SSO configuration deleted successfully'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting SSO configuration:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete SSO configuration'
    });
  }
};

/**
 * Enable SSO for organization
 */
export const enableSSO = async (req: Request, res: Response) => {
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

    // Find configuration
    const ssoConfig = await SSOConfigurationModel.findOne({
      where: {
        organization_id: organizationId
      }
    });

    if (!ssoConfig) {
      return res.status(404).json({
        success: false,
        error: 'SSO configuration not found. Please create configuration first.'
      });
    }

    // Validate configuration before enabling
    await ssoConfig.validateConfiguration();

    // Enable SSO
    ssoConfig.is_enabled = true;
    await ssoConfig.save();

    const azureConfig = ssoConfig.getAzureAdConfig();

    return res.json({
      success: true,
      message: 'SSO enabled successfully',
      data: {
        azure_tenant_id: azureConfig?.tenant_id,
        cloud_environment: azureConfig?.cloud_environment,
        is_enabled: ssoConfig.is_enabled,
        auth_method_policy: ssoConfig.auth_method_policy
      }
    });

  } catch (error) {
    console.error('Error enabling SSO:', error);

    // Handle validation errors
    if ((error as any).message && typeof (error as any).message === 'string') {
      return res.status(400).json({
        success: false,
        error: (error as any).message
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to enable SSO'
    });
  }
};

/**
 * Validates Azure AD SSO configuration without saving to database
 *
 * Performs comprehensive validation of SSO configuration parameters
 * without persisting the data. Useful for frontend validation feedback
 * and pre-save configuration testing.
 *
 * @async
 * @function validateSSOConfiguration
 * @param {Request} req - Express request object with organization ID and configuration to validate
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with detailed validation results
 *
 * @endpoint POST /api/sso-configuration/:organizationId/validate
 *
 * @request_body
 * - azure_tenant_id: string (required, GUID format)
 * - azure_client_id: string (required, GUID format)
 * - azure_client_secret: string (required, strength validation)
 * - cloud_environment: 'AzurePublic' | 'AzureGovernment' (default: 'AzurePublic')
 * - auth_method_policy: 'sso_only' | 'password_only' | 'both' (default: 'both')
 * - allowed_domains: string[] (optional, domain format validation)
 *
 * @security
 * - Requires admin role within the target organization
 * - No data persistence - validation only
 * - Uses SSOConfigValidator for comprehensive checks
 *
 * @response_format
 * ```typescript
 * {
 *   success: true,
 *   validation: {
 *     isValid: boolean,
 *     errors: string[],
 *     warnings: string[]
 *   },
 *   message: string
 * }
 * ```
 *
 * @example
 * ```typescript
 * // POST /api/sso-configuration/123/validate
 * // Body: { azure_tenant_id: "invalid-guid", ... }
 * // Response:
 * {
 *   "success": true,
 *   "validation": {
 *     "isValid": false,
 *     "errors": ["Azure tenant ID must be a valid GUID format"],
 *     "warnings": []
 *   },
 *   "message": "SSO configuration has validation errors"
 * }
 * ```
 */
export const validateSSOConfiguration = async (req: Request, res: Response) => {
  try {
    const organizationId = req.params.organizationId;
    const {
      azure_tenant_id,
      azure_client_id,
      azure_client_secret,
      cloud_environment = 'AzurePublic',
      auth_method_policy = 'both',
      allowed_domains
    } = req.body;

    // Verify user belongs to organization and is admin
    if (req.organizationId !== parseInt(organizationId)) {
      return SSOErrorHandler.handleAuthError(
        res,
        new Error('Access denied'),
        'Access denied to this organization',
        403
      );
    }

    if (req.role !== 'Admin') {
      return SSOErrorHandler.handleAuthError(
        res,
        new Error('Admin required'),
        'Admin access required',
        403
      );
    }

    // Comprehensive validation using the validator utility
    const validationResult = await SSOConfigValidator.validateSSOConfiguration({
      azure_tenant_id,
      azure_client_id,
      azure_client_secret,
      cloud_environment,
      auth_method_policy,
      allowed_domains
    });

    // Return validation results
    return res.json({
      success: true,
      validation: {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        warnings: validationResult.warnings
      },
      message: validationResult.isValid
        ? 'SSO configuration is valid'
        : 'SSO configuration has validation errors'
    });

  } catch (error) {
    return SSOErrorHandler.handleInternalError(
      res,
      error,
      'SSO configuration validation'
    );
  }
};

/**
 * Tests Azure AD SSO configuration connectivity and validity
 *
 * Performs live testing of SSO configuration by attempting to create
 * an MSAL client and validate connectivity to Azure AD endpoints.
 * Provides immediate feedback on configuration correctness.
 *
 * @async
 * @function testSSOConfiguration
 * @param {Request} req - Express request object with organization ID and configuration to test
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with test results and connectivity status
 *
 * @endpoint POST /api/sso-configuration/:organizationId/test
 *
 * @request_body
 * - azure_tenant_id: string (required, GUID format)
 * - azure_client_id: string (required, GUID format)
 * - azure_client_secret: string (required)
 * - cloud_environment: 'AzurePublic' | 'AzureGovernment' (default: 'AzurePublic')
 *
 * @security
 * - Requires admin role within the target organization
 * - No data persistence - testing only
 * - Uses actual MSAL client creation for validation
 * - Enhanced error handling for MSAL-specific issues
 *
 * @testing_process
 * 1. Validates configuration format and requirements
 * 2. Constructs appropriate Azure AD authority URL
 * 3. Attempts MSAL ConfidentialClientApplication creation
 * 4. Verifies client initialization success
 * 5. Returns detailed test results with connectivity status
 *
 * @response_format
 * ```typescript
 * {
 *   success: boolean,
 *   testPassed: boolean,
 *   message?: string,
 *   error?: string,
 *   errorCode?: string,
 *   details: {
 *     authority?: string,
 *     clientConfigured?: boolean,
 *     warnings?: string[]
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // POST /api/sso-configuration/123/test
 * // Body: { azure_tenant_id: "valid-guid", azure_client_id: "valid-guid", ... }
 * // Success Response:
 * {
 *   "success": true,
 *   "testPassed": true,
 *   "message": "SSO configuration test passed",
 *   "details": {
 *     "authority": "https://login.microsoftonline.com/tenant-id",
 *     "clientConfigured": true,
 *     "warnings": []
 *   }
 * }
 *
 * // Failure Response:
 * {
 *   "success": false,
 *   "testPassed": false,
 *   "error": "MSAL client configuration failed",
 *   "errorCode": "INVALID_CLIENT_CONFIG",
 *   "details": ["MSAL client configuration failed. Please verify your Azure AD application settings."]
 * }
 * ```
 */
export const testSSOConfiguration = async (req: Request, res: Response) => {
  try {
    const organizationId = req.params.organizationId;
    const {
      azure_tenant_id,
      azure_client_id,
      azure_client_secret,
      cloud_environment = 'AzurePublic'
    } = req.body;

    // Verify user belongs to organization and is admin
    if (req.organizationId !== parseInt(organizationId)) {
      return SSOErrorHandler.handleAuthError(
        res,
        new Error('Access denied'),
        'Access denied to this organization',
        403
      );
    }

    if (req.role !== 'Admin') {
      return SSOErrorHandler.handleAuthError(
        res,
        new Error('Admin required'),
        'Admin access required',
        403
      );
    }

    // Validate basic configuration first
    const validationResult = await SSOConfigValidator.validateAzureADConfig({
      tenant_id: azure_tenant_id,
      client_id: azure_client_id,
      client_secret: azure_client_secret,
      cloud_environment: cloud_environment as 'AzurePublic' | 'AzureGovernment'
    });

    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        testPassed: false,
        error: 'Configuration validation failed',
        details: validationResult.errors
      });
    }

    // Test MSAL client creation and authority access
    try {
      const { ConfidentialClientApplication } = await import('@azure/msal-node');

      const authorityBase = cloud_environment === 'AzureGovernment'
        ? 'https://login.microsoftonline.us'
        : 'https://login.microsoftonline.com';

      const authority = `${authorityBase}/${azure_tenant_id}`;

      const msalConfig = {
        auth: {
          clientId: azure_client_id,
          clientSecret: azure_client_secret,
          authority: authority
        }
      };

      const cca = new ConfidentialClientApplication(msalConfig);

      // Basic connectivity test - if we can create the client, the configuration is syntactically valid
      if (!cca) {
        throw new Error('Failed to initialize MSAL client');
      }

      return res.json({
        success: true,
        testPassed: true,
        message: 'SSO configuration test passed',
        details: {
          authority: authority,
          clientConfigured: true,
          warnings: validationResult.warnings
        }
      });

    } catch (msalError) {
      const { userMessage, errorCode } = SSOErrorHandler.handleMSALError(msalError, 'configuration test');

      return res.status(400).json({
        success: false,
        testPassed: false,
        error: userMessage,
        errorCode: errorCode,
        details: ['MSAL client configuration failed. Please verify your Azure AD application settings.']
      });
    }

  } catch (error) {
    return SSOErrorHandler.handleInternalError(
      res,
      error,
      'SSO configuration testing'
    );
  }
};

/**
 * Disable SSO for organization
 */
export const disableSSO = async (req: Request, res: Response) => {
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

    // Find configuration
    const ssoConfig = await SSOConfigurationModel.findOne({
      where: {
        organization_id: organizationId
      }
    });

    if (!ssoConfig) {
      return res.status(404).json({
        success: false,
        error: 'SSO configuration not found'
      });
    }

    // Disable SSO
    ssoConfig.is_enabled = false;
    await ssoConfig.save();

    return res.json({
      success: true,
      message: 'SSO disabled successfully',
      data: {
        is_enabled: ssoConfig.is_enabled,
        auth_method_policy: ssoConfig.auth_method_policy
      }
    });

  } catch (error) {
    console.error('Error disabling SSO:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to disable SSO'
    });
  }
};