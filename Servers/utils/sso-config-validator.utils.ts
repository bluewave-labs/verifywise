/**
 * SSO Configuration Validator Utility
 *
 * Provides comprehensive validation for SSO configurations including:
 * - Azure AD configuration validation
 * - Tenant ID and Client ID format validation
 * - Client secret strength validation
 * - Cloud environment validation
 * - Authentication policy validation
 * - Email domain validation
 */

import { ConfidentialClientApplication } from '@azure/msal-node';
import { SSOErrorHandler, SSOErrorCodes } from './sso-error-handler.utils';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AzureADValidationConfig {
  tenant_id: string;
  client_id: string;
  client_secret: string;
  cloud_environment: 'AzurePublic' | 'AzureGovernment';
}

/**
 * SSO Configuration Validator Class
 */
export class SSOConfigValidator {
  // Regex patterns for validation
  private static readonly AZURE_TENANT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  private static readonly AZURE_CLIENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  private static readonly EMAIL_DOMAIN_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  /**
   * Validate complete Azure AD SSO configuration
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
   * Validate Azure AD Tenant ID format
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
   * Validate complete SSO configuration object
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