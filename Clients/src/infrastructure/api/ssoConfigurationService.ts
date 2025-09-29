/**
 * @fileoverview SSO Configuration API Service
 *
 * This module provides a comprehensive API client for managing Azure AD Single Sign-On
 * configurations. It handles all HTTP communication with the backend SSO endpoints,
 * providing type-safe interfaces for configuration management, validation, and
 * authentication policy control.
 *
 * Features:
 * - Complete CRUD operations for SSO configurations
 * - Azure AD integration with multi-cloud support
 * - Authentication method policy management
 * - Type-safe API interfaces with comprehensive error handling
 * - Organization-scoped SSO configuration management
 *
 * Security Considerations:
 * - Client secrets are transmitted securely but never returned in responses
 * - All API calls are organization-scoped to prevent cross-tenant access
 * - Supports secure configuration updates with validation
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 * @see {@link https://docs.microsoft.com/en-us/azure/active-directory/develop/} Azure AD Documentation
 */

import CustomAxios from "./customAxios";

/**
 * Complete SSO configuration interface for Azure AD integration
 *
 * Represents the full structure of an SSO configuration including all
 * Azure AD parameters required for authentication flows.
 *
 * @interface SSOConfiguration
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const config: SSOConfiguration = {
 *   azure_tenant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
 *   azure_client_id: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
 *   azure_client_secret: 'secure_client_secret',
 *   cloud_environment: 'AzurePublic',
 *   is_enabled: true,
 *   auth_method_policy: 'both'
 * };
 * ```
 */
export interface SSOConfiguration {
  /** Azure AD Tenant ID in GUID format */
  azure_tenant_id: string;

  /** Azure AD Application Client ID in GUID format */
  azure_client_id: string;

  /** Azure AD Client Secret (never returned in API responses for security) */
  azure_client_secret: string;

  /** Azure cloud environment for region-specific endpoints */
  cloud_environment: 'AzurePublic' | 'AzureGovernment';

  /** Whether SSO authentication is currently enabled for the organization */
  is_enabled: boolean;

  /** Authentication method policy controlling allowed login methods */
  auth_method_policy: 'sso_only' | 'password_only' | 'both';

  /** ISO timestamp when the configuration was created */
  created_at?: string;

  /** ISO timestamp when the configuration was last updated */
  updated_at?: string;
}

/**
 * API response interface for retrieving SSO configuration
 *
 * Standardized response format for GET requests to retrieve organization
 * SSO configuration. Includes existence check and partial data structure
 * for security reasons (client secrets are never returned).
 *
 * @interface SSOConfigurationResponse
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const response: SSOConfigurationResponse = {
 *   success: true,
 *   data: {
 *     exists: true,
 *     azure_tenant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
 *     azure_client_id: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
 *     cloud_environment: 'AzurePublic',
 *     is_enabled: true,
 *     auth_method_policy: 'both'
 *   }
 * };
 * ```
 */
export interface SSOConfigurationResponse {
  /** Indicates if the API request was successful */
  success: boolean;

  /** Response data containing configuration details */
  data: {
    /** Whether an SSO configuration exists for this organization */
    exists: boolean;

    /** Azure AD Tenant ID (only if configuration exists) */
    azure_tenant_id?: string;

    /** Azure AD Application Client ID (only if configuration exists) */
    azure_client_id?: string;

    /** Azure cloud environment setting (only if configuration exists) */
    cloud_environment?: 'AzurePublic' | 'AzureGovernment';

    /** Current SSO enabled status (only if configuration exists) */
    is_enabled?: boolean;

    /** Authentication method policy (only if configuration exists) */
    auth_method_policy?: 'sso_only' | 'password_only' | 'both';

    /** ISO timestamp when configuration was created */
    created_at?: string;

    /** ISO timestamp when configuration was last updated */
    updated_at?: string;
  };
}

/**
 * Payload interface for creating or updating SSO configuration
 *
 * Data structure required when creating a new SSO configuration or updating
 * an existing one. All fields are required to ensure complete configuration.
 *
 * @interface CreateUpdateSSOConfigurationPayload
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const payload: CreateUpdateSSOConfigurationPayload = {
 *   azure_tenant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
 *   azure_client_id: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
 *   azure_client_secret: 'secure_client_secret',
 *   cloud_environment: 'AzurePublic',
 *   auth_method_policy: 'both'
 * };
 * ```
 */
export interface CreateUpdateSSOConfigurationPayload {
  /** Azure AD Tenant ID in GUID format (required) */
  azure_tenant_id: string;

  /** Azure AD Application Client ID in GUID format (required) */
  azure_client_id: string;

  /** Azure AD Client Secret for authentication (required) */
  azure_client_secret: string;

  /** Azure cloud environment for proper endpoint configuration (required) */
  cloud_environment: 'AzurePublic' | 'AzureGovernment';

  /** Authentication method policy for organization login control (required) */
  auth_method_policy: 'sso_only' | 'password_only' | 'both';
}

/**
 * API response interface for create/update SSO configuration operations
 *
 * Standardized response format for POST requests when creating or updating
 * SSO configurations. Includes success status, user message, and updated
 * configuration data (excluding sensitive information like client secrets).
 *
 * @interface CreateUpdateSSOConfigurationResponse
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const response: CreateUpdateSSOConfigurationResponse = {
 *   success: true,
 *   message: 'SSO configuration saved successfully',
 *   data: {
 *     azure_tenant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
 *     azure_client_id: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
 *     cloud_environment: 'AzurePublic',
 *     is_enabled: false,
 *     auth_method_policy: 'both'
 *   }
 * };
 * ```
 */
export interface CreateUpdateSSOConfigurationResponse {
  /** Indicates if the operation was successful */
  success: boolean;

  /** User-friendly message describing the operation result */
  message: string;

  /** Updated configuration data (excluding sensitive information) */
  data: {
    /** Azure AD Tenant ID that was saved */
    azure_tenant_id: string;

    /** Azure AD Application Client ID that was saved */
    azure_client_id: string;

    /** Azure cloud environment that was configured */
    cloud_environment: 'AzurePublic' | 'AzureGovernment';

    /** Current enabled status (configuration is created disabled by default) */
    is_enabled: boolean;

    /** Authentication method policy that was set */
    auth_method_policy: 'sso_only' | 'password_only' | 'both';
  };
}

/**
 * API response interface for SSO enable/disable operations
 *
 * Standardized response format for POST requests when enabling or disabling
 * SSO functionality for an organization. Includes the updated enabled status
 * and relevant configuration details.
 *
 * @interface SSOToggleResponse
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const response: SSOToggleResponse = {
 *   success: true,
 *   message: 'SSO enabled successfully',
 *   data: {
 *     is_enabled: true,
 *     azure_tenant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
 *     cloud_environment: 'AzurePublic'
 *   }
 * };
 * ```
 */
export interface SSOToggleResponse {
  /** Indicates if the toggle operation was successful */
  success: boolean;

  /** User-friendly message describing the operation result */
  message: string;

  /** Updated SSO status and related configuration details */
  data: {
    /** Current SSO enabled status after the operation */
    is_enabled: boolean;

    /** Azure AD Tenant ID (if configuration exists) */
    azure_tenant_id?: string;

    /** Azure cloud environment (if configuration exists) */
    cloud_environment?: 'AzurePublic' | 'AzureGovernment';
  };
}

/**
 * Standard API error response interface
 *
 * Standardized error response format used across all SSO API endpoints
 * when operations fail. Provides consistent error handling structure.
 *
 * @interface APIError
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const errorResponse: APIError = {
 *   success: false,
 *   error: 'Invalid Azure AD configuration: Tenant ID must be a valid GUID'
 * };
 * ```
 */
export interface APIError {
  /** Always false for error responses */
  success: false;

  /** Detailed error message explaining what went wrong */
  error: string;
}

/**
 * SSO Configuration API Service
 *
 * Comprehensive API client for managing Azure AD Single Sign-On configurations.
 * Provides type-safe methods for all CRUD operations, authentication policy
 * management, and SSO toggle functionality.
 *
 * All methods are organization-scoped to ensure proper multi-tenant isolation
 * and include comprehensive error handling with typed response interfaces.
 *
 * @namespace ssoConfigurationService
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * // Get existing SSO configuration
 * const config = await ssoConfigurationService.getSSOConfiguration('123');
 *
 * // Create or update SSO configuration
 * const payload = {
 *   azure_tenant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
 *   azure_client_id: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
 *   azure_client_secret: 'secure_secret',
 *   cloud_environment: 'AzurePublic' as const,
 *   auth_method_policy: 'both' as const
 * };
 * const result = await ssoConfigurationService.createOrUpdateSSOConfiguration('123', payload);
 *
 * // Enable SSO for organization
 * await ssoConfigurationService.enableSSO('123');
 * ```
 */
export const ssoConfigurationService = {
  /**
   * Retrieves SSO configuration for the specified organization
   *
   * Fetches the current Azure AD SSO configuration for an organization.
   * Returns configuration existence status and details (excluding sensitive
   * information like client secrets for security).
   *
   * @async
   * @param {string} organizationId - Unique identifier of the organization
   * @returns {Promise<SSOConfigurationResponse>} Configuration data and existence status
   *
   * @throws {APIError} When organization ID is invalid or access is denied
   *
   * @example
   * ```typescript
   * try {
   *   const config = await ssoConfigurationService.getSSOConfiguration('123');
   *   if (config.success && config.data.exists) {
   *     console.log('SSO is configured for tenant:', config.data.azure_tenant_id);
   *   } else {
   *     console.log('No SSO configuration found');
   *   }
   * } catch (error) {
   *   console.error('Failed to get SSO configuration:', error);
   * }
   * ```
   */
  async getSSOConfiguration(organizationId: string): Promise<SSOConfigurationResponse> {
    const response = await CustomAxios.get(`/sso-configuration/${organizationId}`);
    return response.data;
  },

  /**
   * Creates or updates Azure AD SSO configuration for an organization
   *
   * Submits complete SSO configuration including Azure AD credentials,
   * cloud environment settings, and authentication policies. Performs
   * server-side validation before saving the encrypted configuration.
   *
   * @async
   * @param {string} organizationId - Unique identifier of the organization
   * @param {CreateUpdateSSOConfigurationPayload} payload - Complete SSO configuration data
   * @returns {Promise<CreateUpdateSSOConfigurationResponse>} Operation result and updated configuration
   *
   * @throws {APIError} When validation fails or Azure AD credentials are invalid
   *
   * @security
   * - Client secret is encrypted server-side before storage
   * - GUID validation for tenant and client IDs
   * - Organization isolation prevents cross-tenant configuration access
   *
   * @example
   * ```typescript
   * const payload: CreateUpdateSSOConfigurationPayload = {
   *   azure_tenant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
   *   azure_client_id: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
   *   azure_client_secret: 'secure_client_secret',
   *   cloud_environment: 'AzurePublic',
   *   auth_method_policy: 'both'
   * };
   *
   * try {
   *   const result = await ssoConfigurationService.createOrUpdateSSOConfiguration('123', payload);
   *   console.log('Configuration saved:', result.message);
   * } catch (error) {
   *   console.error('Failed to save configuration:', error);
   * }
   * ```
   */
  async createOrUpdateSSOConfiguration(
    organizationId: string,
    payload: CreateUpdateSSOConfigurationPayload
  ): Promise<CreateUpdateSSOConfigurationResponse> {
    const response = await CustomAxios.post(`/sso-configuration/${organizationId}`, payload);
    return response.data;
  },

  /**
   * Deletes the SSO configuration for an organization
   *
   * Permanently removes the Azure AD SSO configuration including all
   * encrypted credentials and settings. This operation cannot be undone
   * and will disable SSO authentication for the organization.
   *
   * @async
   * @param {string} organizationId - Unique identifier of the organization
   * @returns {Promise<{success: boolean; message: string}>} Deletion confirmation
   *
   * @throws {APIError} When organization ID is invalid or configuration doesn't exist
   *
   * @security
   * - Permanently deletes encrypted client secrets
   * - Disables SSO authentication immediately
   * - Requires organization admin permissions
   *
   * @example
   * ```typescript
   * try {
   *   const result = await ssoConfigurationService.deleteSSOConfiguration('123');
   *   if (result.success) {
   *     console.log('SSO configuration deleted:', result.message);
   *   }
   * } catch (error) {
   *   console.error('Failed to delete SSO configuration:', error);
   * }
   * ```
   */
  async deleteSSOConfiguration(organizationId: string): Promise<{ success: boolean; message: string }> {
    const response = await CustomAxios.delete(`/sso-configuration/${organizationId}`);
    return response.data;
  },

  /**
   * Enables SSO authentication for an organization
   *
   * Activates Azure AD SSO authentication for the organization, allowing
   * users to sign in using their Azure AD credentials. Requires a valid
   * SSO configuration to be present before enabling.
   *
   * @async
   * @param {string} organizationId - Unique identifier of the organization
   * @returns {Promise<SSOToggleResponse>} Enable operation result and updated status
   *
   * @throws {APIError} When no SSO configuration exists or Azure AD validation fails
   *
   * @example
   * ```typescript
   * try {
   *   const result = await ssoConfigurationService.enableSSO('123');
   *   if (result.success && result.data.is_enabled) {
   *     console.log('SSO enabled successfully for tenant:', result.data.azure_tenant_id);
   *   }
   * } catch (error) {
   *   console.error('Failed to enable SSO:', error);
   * }
   * ```
   */
  async enableSSO(organizationId: string): Promise<SSOToggleResponse> {
    const response = await CustomAxios.post(`/sso-configuration/${organizationId}/enable`);
    return response.data;
  },

  /**
   * Disables SSO authentication for an organization
   *
   * Deactivates Azure AD SSO authentication for the organization while
   * preserving the configuration. Users will fall back to password-based
   * authentication or be restricted based on the auth_method_policy.
   *
   * @async
   * @param {string} organizationId - Unique identifier of the organization
   * @returns {Promise<SSOToggleResponse>} Disable operation result and updated status
   *
   * @throws {APIError} When organization ID is invalid or operation fails
   *
   * @example
   * ```typescript
   * try {
   *   const result = await ssoConfigurationService.disableSSO('123');
   *   if (result.success && !result.data.is_enabled) {
   *     console.log('SSO disabled successfully');
   *   }
   * } catch (error) {
   *   console.error('Failed to disable SSO:', error);
   * }
   * ```
   */
  async disableSSO(organizationId: string): Promise<SSOToggleResponse> {
    const response = await CustomAxios.post(`/sso-configuration/${organizationId}/disable`);
    return response.data;
  },

};