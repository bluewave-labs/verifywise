import { ValidationResult, ValidationError } from '../interfaces/ISSOProvider';
import { SSOError, SSOErrorCode, createSSOError } from './SSOErrors';

export class SSOValidation {
  /**
   * Validate organization ID parameter
   */
  static validateOrganizationId(organizationId: any): number {
    if (!organizationId) {
      throw createSSOError(SSOErrorCode.INVALID_ORGANIZATION_ACCESS, {
        reason: 'Missing organization ID'
      });
    }

    const parsedId = parseInt(organizationId, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      throw createSSOError(SSOErrorCode.INVALID_ORGANIZATION_ACCESS, {
        reason: 'Invalid organization ID format',
        received: organizationId
      });
    }

    return parsedId;
  }

  /**
   * Validate provider ID parameter
   */
  static validateProviderId(providerId: any): number {
    if (!providerId) {
      throw createSSOError(SSOErrorCode.INVALID_CONFIGURATION, {
        reason: 'Missing provider ID'
      });
    }

    const parsedId = parseInt(providerId, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      throw createSSOError(SSOErrorCode.INVALID_CONFIGURATION, {
        reason: 'Invalid provider ID format',
        received: providerId
      });
    }

    return parsedId;
  }

  /**
   * Validate email format and domain
   */
  static validateEmail(email: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!email) {
      errors.push({
        field: 'email',
        message: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
      return { isValid: false, errors };
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }

    // Check for suspicious patterns
    if (email.length > 320) { // RFC 5321 limit
      errors.push({
        field: 'email',
        message: 'Email address is too long',
        code: 'EMAIL_TOO_LONG'
      });
    }

    if (email.includes('..')) {
      errors.push({
        field: 'email',
        message: 'Email contains consecutive dots',
        code: 'INVALID_EMAIL_PATTERN'
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate email domain against allowlist
   */
  static validateEmailDomain(email: string, allowedDomains: string[]): boolean {
    if (!allowedDomains || allowedDomains.length === 0) {
      return true; // No restrictions
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return false;
    }

    return allowedDomains.some(allowedDomain => {
      const normalizedAllowed = allowedDomain.toLowerCase().trim();

      // Support wildcard subdomains (e.g., *.company.com)
      if (normalizedAllowed.startsWith('*.')) {
        const baseDomain = normalizedAllowed.substring(2);
        return domain === baseDomain || domain.endsWith('.' + baseDomain);
      }

      return domain === normalizedAllowed;
    });
  }

  /**
   * Validate user name fields
   */
  static validateUserName(name: string, fieldName: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!name || name.trim().length === 0) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'NAME_REQUIRED'
      });
      return { isValid: false, errors };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 1) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least 1 character long`,
        code: 'NAME_TOO_SHORT'
      });
    }

    if (trimmedName.length > 100) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be less than 100 characters`,
        code: 'NAME_TOO_LONG'
      });
    }

    // Check for suspicious patterns
    const suspiciousPattern = /[<>{}[\]\\\/\x00-\x1f\x7f]/;
    if (suspiciousPattern.test(trimmedName)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} contains invalid characters`,
        code: 'INVALID_NAME_CHARACTERS'
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate authorization code from SSO provider
   */
  static validateAuthCode(code: any): string {
    if (!code) {
      throw createSSOError(SSOErrorCode.INVALID_AUTH_CODE, {
        reason: 'Missing authorization code'
      });
    }

    if (typeof code !== 'string') {
      throw createSSOError(SSOErrorCode.INVALID_AUTH_CODE, {
        reason: 'Authorization code must be a string',
        received: typeof code
      });
    }

    const trimmedCode = code.trim();
    if (trimmedCode.length === 0) {
      throw createSSOError(SSOErrorCode.INVALID_AUTH_CODE, {
        reason: 'Empty authorization code'
      });
    }

    // Basic sanity checks for authorization code
    if (trimmedCode.length < 10 || trimmedCode.length > 2000) {
      throw createSSOError(SSOErrorCode.INVALID_AUTH_CODE, {
        reason: 'Authorization code length is suspicious',
        length: trimmedCode.length
      });
    }

    return trimmedCode;
  }

  /**
   * Validate Azure AD configuration
   */
  static validateAzureAdConfiguration(config: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields
    const requiredFields = [
      'azure_client_id',
      'azure_client_secret',
      'azure_tenant_id'
    ];

    for (const field of requiredFields) {
      if (!config[field] || typeof config[field] !== 'string' || config[field].trim().length === 0) {
        errors.push({
          field,
          message: `${field} is required and must be a non-empty string`,
          code: 'REQUIRED_FIELD_MISSING'
        });
      }
    }

    // Validate Azure tenant ID format (GUID)
    if (config.azure_tenant_id) {
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!guidRegex.test(config.azure_tenant_id)) {
        errors.push({
          field: 'azure_tenant_id',
          message: 'Azure tenant ID must be a valid GUID format',
          code: 'INVALID_TENANT_ID_FORMAT'
        });
      }
    }

    // Validate Azure client ID format (GUID)
    if (config.azure_client_id) {
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!guidRegex.test(config.azure_client_id)) {
        errors.push({
          field: 'azure_client_id',
          message: 'Azure client ID must be a valid GUID format',
          code: 'INVALID_CLIENT_ID_FORMAT'
        });
      }
    }

    // Validate cloud environment
    if (config.azure_cloud_environment) {
      const validEnvironments = ['public', 'government', 'china', 'germany'];
      if (!validEnvironments.includes(config.azure_cloud_environment)) {
        errors.push({
          field: 'azure_cloud_environment',
          message: 'Invalid Azure cloud environment',
          code: 'INVALID_CLOUD_ENVIRONMENT'
        });
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Sanitize display name from SSO provider
   */
  static sanitizeDisplayName(name: string): string {
    if (!name) return '';

    return name
      .trim()
      .replace(/[<>{}[\]\\\/\x00-\x1f\x7f]/g, '') // Remove dangerous characters
      .substring(0, 100); // Limit length
  }

  /**
   * Validate role ID
   */
  static validateRoleId(roleId: any): number {
    if (roleId === undefined || roleId === null) {
      throw createSSOError(SSOErrorCode.INVALID_CONFIGURATION, {
        reason: 'Role ID is required'
      });
    }

    const parsedRoleId = parseInt(roleId, 10);
    if (isNaN(parsedRoleId) || parsedRoleId <= 0) {
      throw createSSOError(SSOErrorCode.INVALID_CONFIGURATION, {
        reason: 'Invalid role ID format',
        received: roleId
      });
    }

    return parsedRoleId;
  }

  /**
   * Validate allowed domains list
   */
  static validateAllowedDomains(domains: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (domains === null || domains === undefined) {
      return { isValid: true, errors }; // Null/undefined is valid (no restrictions)
    }

    if (!Array.isArray(domains)) {
      errors.push({
        field: 'allowed_domains',
        message: 'Allowed domains must be an array',
        code: 'INVALID_DOMAINS_FORMAT'
      });
      return { isValid: false, errors };
    }

    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i];

      if (typeof domain !== 'string') {
        errors.push({
          field: `allowed_domains[${i}]`,
          message: 'Domain must be a string',
          code: 'INVALID_DOMAIN_TYPE'
        });
        continue;
      }

      const trimmedDomain = domain.trim().toLowerCase();

      if (trimmedDomain.length === 0) {
        errors.push({
          field: `allowed_domains[${i}]`,
          message: 'Domain cannot be empty',
          code: 'EMPTY_DOMAIN'
        });
        continue;
      }

      // Basic domain format validation
      const domainRegex = /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!domainRegex.test(trimmedDomain)) {
        errors.push({
          field: `allowed_domains[${i}]`,
          message: 'Invalid domain format',
          code: 'INVALID_DOMAIN_FORMAT'
        });
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

export default SSOValidation;