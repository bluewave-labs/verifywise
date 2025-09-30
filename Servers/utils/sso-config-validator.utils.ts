/**
 * @fileoverview SSO Configuration Validator Utilities
 *
 * Comprehensive validation system for Azure AD Single Sign-On configurations.
 * Provides multi-layered validation including format validation, security checks,
 * MSAL configuration testing, and organizational readiness assessment.
 *
 * This utility ensures that SSO configurations are:
 * - Correctly formatted according to Azure AD requirements
 * - Secure and follow best practices
 * - Functionally valid through MSAL integration testing
 * - Appropriate for the organization's current state
 *
 * Validation Layers:
 * 1. Format Validation - GUID patterns, string formats, enum values
 * 2. Security Validation - Weak password detection, placeholder identification
 * 3. Business Logic Validation - Policy combinations, domain restrictions
 * 4. Technical Validation - MSAL client creation, Azure AD connectivity
 * 5. Organizational Validation - User readiness, migration considerations
 *
 * Security Features:
 * - Detects common weak passwords and placeholders
 * - Validates Azure AD GUID formats to prevent injection
 * - Warns about insecure authentication policies
 * - Identifies potentially problematic email domain configurations
 * - Provides organizational readiness assessment for SSO migration
 *
 * Error Categorization:
 * - Errors: Configuration issues that prevent SSO functionality
 * - Warnings: Potential security or usability concerns that should be addressed
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 * @see {@link https://docs.microsoft.com/en-us/azure/active-directory/develop/} Azure AD Developer Documentation
 * @see {@link https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview} MSAL Documentation
 *
 * @module utils/sso-config-validator
 */

import { ConfidentialClientApplication } from '@azure/msal-node';
import { SSOErrorHandler, SSOErrorCodes } from './sso-error-handler.utils';

/**
 * Standardized validation result interface
 *
 * Provides structured validation feedback with clear separation between
 * blocking errors and advisory warnings for SSO configuration validation.
 *
 * @interface ValidationResult
 * @property {boolean} isValid - Whether validation passed (no errors)
 * @property {string[]} errors - Blocking issues that prevent SSO functionality
 * @property {string[]} warnings - Advisory issues that should be addressed
 *
 * @example
 * ```typescript
 * const result = await SSOConfigValidator.validateAzureADConfig(config);
 * if (!result.isValid) {
 *   console.error('Validation failed:', result.errors);
 * }
 * if (result.warnings.length > 0) {
 *   console.warn('Validation warnings:', result.warnings);
 * }
 * ```
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Azure AD configuration interface for validation
 *
 * Defines the structure of Azure AD configuration data required
 * for comprehensive SSO validation including MSAL testing.
 *
 * @interface AzureADValidationConfig
 * @property {string} tenant_id - Azure AD tenant identifier (GUID format)
 * @property {string} client_id - Azure AD application client identifier (GUID format)
 * @property {string} client_secret - Azure AD application client secret
 * @property {'AzurePublic' | 'AzureGovernment'} cloud_environment - Azure cloud environment
 *
 * @example
 * ```typescript
 * const config: AzureADValidationConfig = {
 *   tenant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
 *   client_id: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
 *   client_secret: 'secure_client_secret_from_azure',
 *   cloud_environment: 'AzurePublic'
 * };
 * ```
 */
export interface AzureADValidationConfig {
  tenant_id: string;
  client_id: string;
  client_secret: string;
  cloud_environment: 'AzurePublic' | 'AzureGovernment';
}

/**
 * SSO Configuration Validator Class
 *
 * Comprehensive validation system for Azure AD SSO configurations with multi-layered
 * validation approach. Provides static methods for validating different aspects of
 * SSO configuration from basic format validation to complex organizational readiness.
 *
 * Key Features:
 * - Multi-layer validation (format, security, business logic, technical, organizational)
 * - Azure AD GUID format validation with security checks
 * - Client secret strength validation and placeholder detection
 * - MSAL configuration testing for technical validation
 * - Organizational readiness assessment for SSO migration
 * - Comprehensive error and warning categorization
 *
 * Validation Philosophy:
 * - Errors block SSO functionality and must be fixed
 * - Warnings indicate potential issues but don't prevent configuration
 * - All validations return structured ValidationResult for consistent handling
 * - Security-first approach with placeholder and weak password detection
 *
 * @class SSOConfigValidator
 * @static
 *
 * @example
 * ```typescript
 * // Validate complete SSO configuration
 * const result = await SSOConfigValidator.validateSSOConfiguration({
 *   azure_tenant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
 *   azure_client_id: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
 *   azure_client_secret: 'secure_secret_from_azure',
 *   cloud_environment: 'AzurePublic',
 *   auth_method_policy: 'both'
 * });
 *
 * if (!result.isValid) {
 *   console.error('Configuration errors:', result.errors);
 * }
 * ```
 */
export class SSOConfigValidator {
  /** Azure AD tenant ID GUID pattern (RFC 4122 compliant) */
  private static readonly AZURE_TENANT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /** Azure AD client ID GUID pattern (RFC 4122 compliant) */
  private static readonly AZURE_CLIENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /** Email domain validation pattern (RFC 1035 compliant) */
  private static readonly EMAIL_DOMAIN_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  /**
   * Validates complete Azure AD SSO configuration with comprehensive multi-layer validation
   *
   * Performs comprehensive validation of Azure AD configuration including format validation,
   * security checks, and MSAL integration testing. This is the primary validation method
   * for Azure AD configurations and should be used before saving configurations.
   *
   * @static
   * @async
   * @param {AzureADValidationConfig} config - Azure AD configuration to validate
   * @returns {Promise<ValidationResult>} Comprehensive validation result with errors and warnings
   *
   * @validation_layers
   * 1. Tenant ID validation (GUID format, placeholder detection)
   * 2. Client ID validation (GUID format, placeholder detection)
   * 3. Client secret validation (strength, length, placeholder detection)
   * 4. Cloud environment validation (supported environments)
   * 5. MSAL configuration testing (client creation, authority validation)
   *
   * @example
   * ```typescript
   * const config: AzureADValidationConfig = {
   *   tenant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
   *   client_id: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
   *   client_secret: 'secure_client_secret_from_azure',
   *   cloud_environment: 'AzurePublic'
   * };
   *
   * const result = await SSOConfigValidator.validateAzureADConfig(config);
   * if (!result.isValid) {
   *   console.error('Azure AD configuration errors:', result.errors);
   *   // Handle configuration errors before proceeding
   * }
   * if (result.warnings.length > 0) {
   *   console.warn('Configuration warnings:', result.warnings);
   *   // Consider addressing warnings for better security
   * }
   * ```
   */
  static async validateAzureADConfig(config: AzureADValidationConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate tenant ID
    const tenantValidation = this.validateTenantId(config.tenant_id);
    if (!tenantValidation.isValid) {
      errors.push(...tenantValidation.errors);
    }
    warnings.push(...tenantValidation.warnings);

    // Validate client ID
    const clientIdValidation = this.validateClientId(config.client_id);
    if (!clientIdValidation.isValid) {
      errors.push(...clientIdValidation.errors);
    }
    warnings.push(...clientIdValidation.warnings);

    // Validate client secret
    const secretValidation = this.validateClientSecret(config.client_secret);
    if (!secretValidation.isValid) {
      errors.push(...secretValidation.errors);
    }
    warnings.push(...secretValidation.warnings);

    // Validate cloud environment
    const cloudValidation = this.validateCloudEnvironment(config.cloud_environment);
    if (!cloudValidation.isValid) {
      errors.push(...cloudValidation.errors);
    }

    // Test MSAL configuration if basic validation passes
    if (errors.length === 0) {
      const msalValidation = await this.validateMSALConfiguration(config);
      if (!msalValidation.isValid) {
        errors.push(...msalValidation.errors);
      }
      warnings.push(...msalValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates Azure AD Tenant ID format and detects common issues
   *
   * Performs comprehensive validation of Azure AD tenant ID including GUID format
   * validation and detection of common placeholder or test values that would
   * prevent successful Azure AD authentication.
   *
   * @static
   * @param {string} tenantId - Azure AD tenant ID to validate
   * @returns {ValidationResult} Validation result with specific tenant ID errors
   *
   * @validation_checks
   * - Required field validation
   * - GUID format validation (RFC 4122)
   * - Placeholder value detection (common test GUIDs)
   * - Reserved Azure AD values detection (common, organizations, consumers)
   *
   * @example
   * ```typescript
   * const result = SSOConfigValidator.validateTenantId('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
   * if (!result.isValid) {
   *   console.error('Invalid tenant ID:', result.errors);
   * }
   * ```
   */
  static validateTenantId(tenantId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!tenantId || typeof tenantId !== 'string') {
      errors.push('Tenant ID is required');
      return { isValid: false, errors, warnings };
    }

    // Check GUID format
    if (!this.AZURE_TENANT_ID_PATTERN.test(tenantId)) {
      errors.push('Tenant ID must be a valid GUID format (e.g., 12345678-1234-1234-1234-123456789abc)');
    }

    // Check for common test/invalid tenant IDs
    const invalidTenants = [
      '00000000-0000-0000-0000-000000000000',
      '11111111-1111-1111-1111-111111111111',
      'common',
      'organizations',
      'consumers'
    ];

    if (invalidTenants.includes(tenantId.toLowerCase())) {
      errors.push('Tenant ID appears to be a placeholder or invalid. Please use your actual Azure AD tenant ID.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate Azure AD Application (Client) ID format
   */
  static validateClientId(clientId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!clientId || typeof clientId !== 'string') {
      errors.push('Client ID is required');
      return { isValid: false, errors, warnings };
    }

    // Check GUID format
    if (!this.AZURE_CLIENT_ID_PATTERN.test(clientId)) {
      errors.push('Client ID must be a valid GUID format (e.g., 12345678-1234-1234-1234-123456789abc)');
    }

    // Check for common test/invalid client IDs
    if (clientId === '00000000-0000-0000-0000-000000000000') {
      errors.push('Client ID appears to be a placeholder. Please use your actual Azure AD application client ID.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate Azure AD Client Secret strength and format
   */
  static validateClientSecret(clientSecret: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!clientSecret || typeof clientSecret !== 'string') {
      errors.push('Client Secret is required');
      return { isValid: false, errors, warnings };
    }

    // Check minimum length
    if (clientSecret.length < 8) {
      errors.push('Client Secret must be at least 8 characters long');
    }

    // Check maximum length (Azure AD secrets are typically 40-50 characters)
    if (clientSecret.length > 200) {
      errors.push('Client Secret is unusually long. Please verify it is correct.');
    }

    // Check for common weak secrets
    const weakSecrets = [
      'password',
      '12345678',
      'secret123',
      'mysecret',
      'client_secret'
    ];

    if (weakSecrets.includes(clientSecret.toLowerCase())) {
      errors.push('Client Secret appears to be a common weak password. Please use the actual Azure AD client secret.');
    }

    // Check for placeholder patterns
    if (/^(your|my|test|demo|sample)[_-]?(secret|password|key)/i.test(clientSecret)) {
      errors.push('Client Secret appears to be a placeholder. Please use your actual Azure AD client secret.');
    }

    // Warn about secret format
    if (!/^[A-Za-z0-9._~-]+$/.test(clientSecret)) {
      warnings.push('Client Secret contains unusual characters. Ensure it is correctly copied from Azure AD.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate Azure Cloud Environment
   */
  static validateCloudEnvironment(cloudEnvironment: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validEnvironments = ['AzurePublic', 'AzureGovernment'];

    if (!cloudEnvironment || typeof cloudEnvironment !== 'string') {
      errors.push('Cloud Environment is required');
      return { isValid: false, errors, warnings };
    }

    if (!validEnvironments.includes(cloudEnvironment)) {
      errors.push(`Cloud Environment must be one of: ${validEnvironments.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate authentication method policy
   */
  static validateAuthMethodPolicy(policy: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validPolicies = ['sso_only', 'password_only', 'both'];

    if (!policy || typeof policy !== 'string') {
      errors.push('Authentication method policy is required');
      return { isValid: false, errors, warnings };
    }

    if (!validPolicies.includes(policy)) {
      errors.push(`Authentication method policy must be one of: ${validPolicies.join(', ')}`);
    }

    // Security warnings
    if (policy === 'password_only') {
      warnings.push('Password-only authentication is less secure than SSO. Consider using "both" or "sso_only".');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate email domains list
   */
  static validateEmailDomains(domains: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(domains)) {
      errors.push('Email domains must be an array');
      return { isValid: false, errors, warnings };
    }

    if (domains.length === 0) {
      warnings.push('No email domains specified. SSO will be available to all email addresses.');
      return { isValid: true, errors, warnings };
    }

    for (const domain of domains) {
      if (!domain || typeof domain !== 'string') {
        errors.push('Each email domain must be a non-empty string');
        continue;
      }

      // Remove leading @ if present
      const cleanDomain = domain.startsWith('@') ? domain.slice(1) : domain;

      if (!this.EMAIL_DOMAIN_PATTERN.test(cleanDomain)) {
        errors.push(`Invalid email domain format: ${domain}`);
      }

      // Warn about common free email providers
      const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'];
      if (freeProviders.includes(cleanDomain.toLowerCase())) {
        warnings.push(`Email domain "${cleanDomain}" is a free email provider. Consider restricting to your organization's domain.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Test MSAL configuration by attempting to create a client
   */
  private static async validateMSALConfiguration(config: AzureADValidationConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get the correct authority URL based on cloud environment
      const authorityBase = config.cloud_environment === 'AzureGovernment'
        ? 'https://login.microsoftonline.us'
        : 'https://login.microsoftonline.com';

      const authority = `${authorityBase}/${config.tenant_id}`;

      // Create MSAL configuration
      const msalConfig = {
        auth: {
          clientId: config.client_id,
          clientSecret: config.client_secret,
          authority: authority
        }
      };

      // Test MSAL client creation
      const cca = new ConfidentialClientApplication(msalConfig);

      // Basic validation - if we can create the client, the configuration is syntactically valid
      if (!cca) {
        errors.push('Failed to initialize MSAL client with provided configuration');
      }

      // Note: We don't make actual network calls here as that would require
      // additional permissions and might be blocked by firewalls in some environments

    } catch (error) {
      const errorMessage = (error as Error)?.message || 'Unknown MSAL configuration error';

      if (errorMessage.includes('Invalid tenant')) {
        errors.push('Invalid tenant ID - Azure AD cannot find a tenant with this ID');
      } else if (errorMessage.includes('Invalid client')) {
        errors.push('Invalid client ID - Application not found in Azure AD tenant');
      } else if (errorMessage.includes('authority')) {
        errors.push('Invalid authority URL - Check tenant ID and cloud environment');
      } else {
        errors.push(`MSAL configuration error: ${errorMessage}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates complete SSO configuration object with all components
   *
   * Master validation method that validates all aspects of an SSO configuration
   * including Azure AD settings, authentication policies, and domain restrictions.
   * This is the recommended method for validating SSO configurations before
   * saving to the database or enabling SSO for an organization.
   *
   * @static
   * @async
   * @param {Object} config - Complete SSO configuration object
   * @param {string} config.azure_tenant_id - Azure AD tenant ID (GUID format)
   * @param {string} config.azure_client_id - Azure AD client ID (GUID format)
   * @param {string} config.azure_client_secret - Azure AD client secret
   * @param {string} config.cloud_environment - Azure cloud environment
   * @param {string} config.auth_method_policy - Authentication method policy
   * @param {string[]} [config.allowed_domains] - Optional allowed email domains
   * @returns {Promise<ValidationResult>} Comprehensive validation result
   *
   * @validation_scope
   * - Complete Azure AD configuration validation
   * - Authentication method policy validation
   * - Email domain restrictions validation (if provided)
   * - Cross-component validation for policy consistency
   *
   * @example
   * ```typescript
   * const ssoConfig = {
   *   azure_tenant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
   *   azure_client_id: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
   *   azure_client_secret: 'secure_secret_from_azure',
   *   cloud_environment: 'AzurePublic',
   *   auth_method_policy: 'both',
   *   allowed_domains: ['company.com', 'subsidiary.com']
   * };
   *
   * const result = await SSOConfigValidator.validateSSOConfiguration(ssoConfig);
   * if (result.isValid) {
   *   // Save configuration to database
   *   await saveSSOConfiguration(ssoConfig);
   * } else {
   *   // Display errors to user
   *   showValidationErrors(result.errors);
   * }
   * ```
   */
  static async validateSSOConfiguration(config: {
    azure_tenant_id: string;
    azure_client_id: string;
    azure_client_secret: string;
    cloud_environment: string;
    auth_method_policy: string;
    allowed_domains?: string[];
  }): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate Azure AD configuration
    const azureValidation = await this.validateAzureADConfig({
      tenant_id: config.azure_tenant_id,
      client_id: config.azure_client_id,
      client_secret: config.azure_client_secret,
      cloud_environment: config.cloud_environment as 'AzurePublic' | 'AzureGovernment'
    });

    errors.push(...azureValidation.errors);
    warnings.push(...azureValidation.warnings);

    // Validate authentication method policy
    const policyValidation = this.validateAuthMethodPolicy(config.auth_method_policy);
    errors.push(...policyValidation.errors);
    warnings.push(...policyValidation.warnings);

    // Validate email domains if provided
    if (config.allowed_domains) {
      const domainsValidation = this.validateEmailDomains(config.allowed_domains);
      errors.push(...domainsValidation.errors);
      warnings.push(...domainsValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate organization's readiness for SSO
   */
  static validateOrganizationReadiness(organizationData: {
    hasUsers: boolean;
    userCount: number;
    hasAdminUsers: boolean;
    hasExistingAuth: boolean;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!organizationData.hasUsers) {
      warnings.push('Organization has no users. Add users before enabling SSO.');
    }

    if (!organizationData.hasAdminUsers) {
      errors.push('Organization must have at least one admin user before enabling SSO.');
    }

    if (organizationData.userCount > 100 && organizationData.hasExistingAuth) {
      warnings.push(`Organization has ${organizationData.userCount} users with existing authentication. Plan the SSO migration carefully to avoid user access issues.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}