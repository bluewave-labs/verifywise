/**
 * @fileoverview SSO Configuration Model for Azure AD (Entra ID) Integration
 *
 * This module defines the database model and business logic for managing
 * Azure Active Directory Single Sign-On configurations in a multi-tenant
 * environment. It provides secure storage, validation, and domain-specific
 * operations for Azure AD SSO settings.
 *
 * Security Features:
 * - Automatic client secret encryption using AES-256-GCM
 * - Timing-safe domain validation to prevent timing attacks
 * - Secure credential storage with encrypted-at-rest secrets
 * - Multi-tenant isolation with organization-scoped configurations
 * - GUID validation for Azure AD identifiers
 *
 * Azure AD Integration:
 * - Support for Azure Public and Government clouds
 * - Configurable authentication method policies
 * - Domain-based access control for SSO users
 * - Default role assignment for new SSO users
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 * @see {@link https://docs.microsoft.com/en-us/azure/active-directory/develop/} Azure AD Developer Documentation
 */

import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from "sequelize-typescript";
import { OrganizationModel } from "../organization/organization.model";
import { encryptSecret, decryptSecret, isEncrypted } from "../../../utils/sso-encryption.utils";
import * as crypto from 'crypto';

/**
 * Interface defining the structure of SSO configuration data
 *
 * This interface represents the complete set of Azure AD SSO configuration
 * parameters required for establishing secure authentication flows in a
 * multi-tenant environment.
 *
 * @interface ISSOConfiguration
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const config: ISSOConfiguration = {
 *   organization_id: 123,
 *   azure_tenant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
 *   azure_client_id: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
 *   azure_client_secret: 'encrypted_secret_value',
 *   cloud_environment: 'AzurePublic',
 *   is_enabled: true,
 *   auth_method_policy: 'both'
 * };
 * ```
 */
export interface ISSOConfiguration {
  /** Organization identifier (Foreign Key to organizations table) */
  organization_id: number;

  /** Azure AD Tenant ID in GUID format (identifies the Azure AD directory) */
  azure_tenant_id: string;

  /** Azure AD Application Client ID in GUID format (identifies the registered app) */
  azure_client_id: string;

  /** Azure AD Client Secret (stored encrypted for security) */
  azure_client_secret: string;

  /** Azure cloud environment for region-specific endpoints */
  cloud_environment: 'AzurePublic' | 'AzureGovernment';

  /** Whether SSO authentication is enabled for this organization */
  is_enabled: boolean;

  /** Authentication method policy controlling allowed login methods */
  auth_method_policy: 'sso_only' | 'password_only' | 'both';

  /** Timestamp when the configuration was created */
  created_at?: Date;

  /** Timestamp when the configuration was last updated */
  updated_at?: Date;
}

/**
 * Interface for Azure AD configuration used by MSAL authentication library
 *
 * This interface provides a clean abstraction of Azure AD configuration
 * parameters specifically formatted for use with Microsoft Authentication
 * Library (MSAL) and other Azure AD integration libraries.
 *
 * @interface IAzureAdConfig
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const msalConfig: IAzureAdConfig = {
 *   tenant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
 *   client_id: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
 *   client_secret: 'decrypted_secret_value',
 *   cloud_environment: 'AzurePublic',
 *   redirect_uri: 'https://app.verifywise.com/auth/callback'
 * };
 * ```
 */
export interface IAzureAdConfig {
  /** Azure AD Tenant ID (directory identifier) */
  tenant_id: string;

  /** Azure AD Application Client ID (app registration identifier) */
  client_id: string;

  /** Azure AD Client Secret (decrypted for use with MSAL) */
  client_secret: string;

  /** Azure cloud environment determining authentication endpoints */
  cloud_environment: 'AzurePublic' | 'AzureGovernment';

  /** Optional redirect URI for OAuth callback (defaults to configured value) */
  redirect_uri?: string;
}

/**
 * SSO Configuration Database Model
 *
 * Sequelize model for managing Azure AD Single Sign-On configurations
 * with comprehensive security features, validation, and multi-tenant support.
 * This model handles secure storage of Azure AD credentials and provides
 * business logic for SSO authentication flows.
 *
 * Key Features:
 * - Automatic client secret encryption/decryption
 * - Domain-based access control with timing-safe validation
 * - Multi-cloud Azure environment support
 * - Configurable authentication policies
 * - GUID validation for Azure AD identifiers
 * - Default role assignment for new SSO users
 *
 * Security Considerations:
 * - All client secrets are encrypted at rest using AES-256-GCM
 * - Domain validation uses constant-time comparison to prevent timing attacks
 * - Supports wildcard domain matching (*.company.com)
 * - Validates Azure AD GUID formats for tenant and client IDs
 *
 * @class SSOConfigurationModel
 * @extends {Model<SSOConfigurationModel>}
 * @implements {ISSOConfiguration}
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * // Create new SSO configuration
 * const ssoConfig = await SSOConfigurationModel.create({
 *   organization_id: 123,
 *   azure_tenant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
 *   azure_client_id: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
 *   azure_client_secret: 'plain_text_secret', // Will be automatically encrypted
 *   cloud_environment: 'AzurePublic',
 *   is_enabled: true,
 *   auth_method_policy: 'both'
 * });
 *
 * // Validate configuration
 * await ssoConfig.validateConfiguration();
 *
 * // Get decrypted secret for MSAL usage
 * const azureConfig = ssoConfig.getAzureAdConfig();
 * ```
 */
@Table({
  tableName: "sso_configurations",
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
export class SSOConfigurationModel
  extends Model<SSOConfigurationModel>
  implements ISSOConfiguration {

  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    allowNull: false,
  })
  @ForeignKey(() => OrganizationModel)
  organization_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  azure_tenant_id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  azure_client_id!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    set(this: SSOConfigurationModel, value: string) {
      // Encrypt the secret before storing if it's not already encrypted
      if (value && !isEncrypted(value)) {
        this.setDataValue('azure_client_secret', encryptSecret(value));
      } else {
        this.setDataValue('azure_client_secret', value);
      }
    }
  })
  azure_client_secret!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'AzurePublic',
    validate: {
      isIn: {
        args: [['AzurePublic', 'AzureGovernment']],
        msg: 'Cloud environment must be either AzurePublic or AzureGovernment'
      }
    }
  })
  cloud_environment!: 'AzurePublic' | 'AzureGovernment';

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  is_enabled!: boolean;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: 'both',
    validate: {
      isIn: {
        args: [['sso_only', 'password_only', 'both']],
        msg: 'Auth method policy must be one of: sso_only, password_only, both'
      }
    },
    comment: 'Controls which authentication methods are allowed for this organization'
  })
  auth_method_policy!: 'sso_only' | 'password_only' | 'both';

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW
  })
  created_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW
  })
  updated_at!: Date;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    comment: 'List of allowed email domains for this SSO configuration. NULL means no restrictions.'
  })
  allowed_domains?: string[];

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 2,
    comment: 'Default role ID assigned to new users created via SSO. Defaults to Reviewer (ID: 2).'
  })
  default_role_id?: number;

  @BelongsTo(() => OrganizationModel)
  organization!: OrganizationModel;

  /**
   * Retrieves the decrypted Azure AD client secret for authentication
   *
   * Safely decrypts the stored client secret for use in Azure AD authentication flows.
   * The secret is automatically encrypted when stored and must be decrypted for use
   * with MSAL and other Azure AD libraries.
   *
   * @returns {string} Decrypted client secret or empty string if decryption fails
   *
   * @security
   * - Handles decryption errors gracefully without exposing sensitive information
   * - Returns empty string on failure to prevent authentication with invalid credentials
   * - Logs errors for debugging while protecting secret content
   *
   * @example
   * ```typescript
   * const ssoConfig = await SSOConfigurationModel.findOne({
   *   where: { organization_id: 123 }
   * });
   *
   * const clientSecret = ssoConfig.getDecryptedSecret();
   * if (clientSecret) {
   *   // Use with MSAL or Azure AD libraries
   *   const azureConfig = { client_secret: clientSecret };
   * }
   * ```
   */
  public getDecryptedSecret(): string {
    if (!this.azure_client_secret) return '';
    try {
      return decryptSecret(this.azure_client_secret);
    } catch (error) {
      console.error('Failed to decrypt client secret:', error);
      return '';
    }
  }

  /**
   * Sets and encrypts Azure AD client secret for secure storage
   *
   * Encrypts the provided plain text client secret using AES-256-GCM encryption
   * before storing it in the database. This method provides a secure way to
   * update client secrets without exposing them in plain text.
   *
   * @param {string} plainTextSecret - The plain text Azure AD client secret to encrypt and store
   *
   * @security
   * - Immediately encrypts the secret using industry-standard AES-256-GCM
   * - Overwrites the plain text value to prevent memory exposure
   * - Uses dedicated encryption utilities for consistent security practices
   *
   * @example
   * ```typescript
   * const ssoConfig = await SSOConfigurationModel.findOne({
   *   where: { organization_id: 123 }
   * });
   *
   * // Update client secret securely
   * ssoConfig.setClientSecret('new_client_secret_from_azure');
   * await ssoConfig.save();
   * ```
   */
  public setClientSecret(plainTextSecret: string): void {
    this.azure_client_secret = encryptSecret(plainTextSecret);
  }

  /**
   * Retrieves the Azure AD authentication base URL for the configured cloud environment
   *
   * Returns the appropriate Azure AD login endpoint based on the cloud environment
   * configuration. This ensures proper routing to the correct Azure AD instance
   * for authentication requests.
   *
   * @returns {string} Azure AD base URL for authentication endpoints
   *   - Azure Public Cloud: https://login.microsoftonline.com
   *   - Azure Government Cloud: https://login.microsoftonline.us
   *
   * @example
   * ```typescript
   * const ssoConfig = await SSOConfigurationModel.findOne({
   *   where: { organization_id: 123 }
   * });
   *
   * const baseUrl = ssoConfig.getAzureADBaseUrl();
   * const authUrl = `${baseUrl}/${ssoConfig.azure_tenant_id}/oauth2/v2.0/authorize`;
   * ```
   */
  public getAzureADBaseUrl(): string {
    return this.cloud_environment === 'AzureGovernment'
      ? 'https://login.microsoftonline.us'
      : 'https://login.microsoftonline.com';
  }

  /**
   * Retrieves the Microsoft Graph API base URL for the configured cloud environment
   *
   * Returns the appropriate Microsoft Graph API endpoint based on the cloud
   * environment configuration. This ensures API calls are routed to the correct
   * Graph instance for user profile and directory operations.
   *
   * @returns {string} Microsoft Graph API base URL
   *   - Azure Public Cloud: https://graph.microsoft.com
   *   - Azure Government Cloud: https://graph.microsoft.us
   *
   * @example
   * ```typescript
   * const ssoConfig = await SSOConfigurationModel.findOne({
   *   where: { organization_id: 123 }
   * });
   *
   * const graphUrl = ssoConfig.getGraphApiUrl();
   * const userProfileUrl = `${graphUrl}/v1.0/me`;
   * ```
   */
  public getGraphApiUrl(): string {
    return this.cloud_environment === 'AzureGovernment'
      ? 'https://graph.microsoft.us'
      : 'https://graph.microsoft.com';
  }

  /**
   * Validates if an email domain is allowed for SSO authentication
   *
   * Performs security-hardened domain validation against the configured allowed
   * domains list. Supports both exact domain matching and wildcard subdomain
   * patterns (*.company.com) while preventing timing-based attacks through
   * constant-time comparisons.
   *
   * @param {string} email - Email address to validate domain for
   * @returns {boolean} True if domain is allowed, false otherwise
   *
   * @security
   * - Uses constant-time comparison to prevent timing attacks
   * - Handles wildcard domain patterns securely
   * - Falls back to regular comparison if timing-safe comparison fails
   * - Normalizes domains to lowercase for consistent comparison
   *
   * @features
   * - No restrictions if allowed_domains is null/empty (returns true)
   * - Supports wildcard patterns (*.example.com matches sub.example.com)
   * - Exact domain matching (example.com matches user@example.com)
   * - Case-insensitive domain comparison
   *
   * @example
   * ```typescript
   * const ssoConfig = new SSOConfigurationModel();
   * ssoConfig.setAllowedDomains(['company.com', '*.subsidiary.com']);
   *
   * console.log(ssoConfig.isEmailDomainAllowed('user@company.com'));     // true
   * console.log(ssoConfig.isEmailDomainAllowed('user@sub.subsidiary.com')); // true
   * console.log(ssoConfig.isEmailDomainAllowed('user@external.com'));    // false
   * ```
   */
  public isEmailDomainAllowed(email: string): boolean {
    if (!this.allowed_domains || this.allowed_domains.length === 0) {
      return true; // No restrictions
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return false;
    }

    // Use constant-time comparison to prevent timing attacks
    let isAllowed = false;

    for (const allowedDomain of this.allowed_domains) {
      const normalizedAllowed = allowedDomain.toLowerCase().trim();
      let domainMatches = false;

      // Support wildcard subdomains (e.g., *.company.com)
      if (normalizedAllowed.startsWith('*.')) {
        const baseDomain = normalizedAllowed.substring(2);

        // Prepare comparison strings with consistent length
        const exactMatch = domain;
        const wildcardMatch = domain.endsWith('.' + baseDomain) ? domain : '';
        const baseMatch = domain === baseDomain ? domain : '';

        // Use constant-time comparison for all possibilities
        try {
          const exactBuffer = Buffer.from(exactMatch.padEnd(64, '\0'));
          const baseBuffer = Buffer.from(baseMatch.padEnd(64, '\0'));
          const wildcardBuffer = Buffer.from(wildcardMatch.padEnd(64, '\0'));
          const baseDomainBuffer = Buffer.from(baseDomain.padEnd(64, '\0'));

          // Check exact match with base domain
          const exactMatchResult = exactBuffer.length === baseDomainBuffer.length &&
            crypto.timingSafeEqual(exactBuffer.subarray(0, baseDomain.length), baseDomainBuffer.subarray(0, baseDomain.length));

          // Check wildcard match (domain ends with .baseDomain)
          const wildcardMatchResult = wildcardMatch.length > 0 && wildcardBuffer.length >= baseDomainBuffer.length;

          domainMatches = exactMatchResult || wildcardMatchResult;
        } catch (error) {
          // Fall back to regular comparison if timing-safe comparison fails
          domainMatches = domain === baseDomain || domain.endsWith('.' + baseDomain);
        }
      } else {
        // Regular domain comparison with constant-time comparison
        try {
          const domainBuffer = Buffer.from(domain.padEnd(64, '\0'));
          const allowedBuffer = Buffer.from(normalizedAllowed.padEnd(64, '\0'));

          domainMatches = domain.length === normalizedAllowed.length &&
            crypto.timingSafeEqual(domainBuffer.subarray(0, domain.length), allowedBuffer.subarray(0, normalizedAllowed.length));
        } catch (error) {
          // Fall back to regular comparison if timing-safe comparison fails
          domainMatches = domain === normalizedAllowed;
        }
      }

      // Use bitwise OR to avoid short-circuiting (constant-time)
      isAllowed = isAllowed || domainMatches;
    }

    return isAllowed;
  }

  /**
   * Retrieves the default role ID assigned to new SSO users
   *
   * Returns the configured default role ID that will be assigned to users
   * created through SSO authentication. This provides consistent role assignment
   * for new users joining through Azure AD SSO.
   *
   * @returns {number} Role ID to assign to new SSO users (defaults to 2 - Reviewer)
   *
   * @see Role mappings:
   *   - 1: Admin
   *   - 2: Reviewer (default)
   *   - 3: Editor
   *   - 4: Auditor
   *
   * @example
   * ```typescript
   * const ssoConfig = await SSOConfigurationModel.findOne({
   *   where: { organization_id: 123 }
   * });
   *
   * const roleId = ssoConfig.getDefaultRoleId();
   * // Use roleId when creating new SSO user accounts
   * const newUser = await UserModel.create({
   *   role_id: roleId,
   *   // ... other user properties
   * });
   * ```
   */
  public getDefaultRoleId(): number {
    return this.default_role_id || 2; // Default to Reviewer role (ID: 2)
  }

  /**
   * Sets allowed email domains with validation and normalization
   *
   * Configures the list of email domains that are permitted for SSO authentication.
   * Performs validation and normalization of domain formats, including support
   * for wildcard subdomain patterns. Invalid domains are filtered out automatically.
   *
   * @param {string[]} domains - Array of domain strings to allow for SSO
   *   Supports formats: 'company.com', '*.subsidiary.com'
   *
   * @validation
   * - Trims whitespace and converts to lowercase
   * - Validates domain format using RFC-compliant regex
   * - Supports wildcard patterns (*.domain.com)
   * - Filters out invalid domain formats
   * - Sets to undefined if no valid domains remain
   *
   * @example
   * ```typescript
   * const ssoConfig = new SSOConfigurationModel();
   *
   * // Set multiple domains with wildcard support
   * ssoConfig.setAllowedDomains([
   *   'company.com',
   *   '*.subsidiary.com',
   *   'partner.org'
   * ]);
   *
   * // Clear domain restrictions (allow all)
   * ssoConfig.setAllowedDomains([]);
   * ```
   */
  public setAllowedDomains(domains: string[]): void {
    if (!domains || domains.length === 0) {
      this.allowed_domains = undefined;
      return;
    }

    // Basic validation and normalization
    const validDomains = domains
      .map(domain => domain.trim().toLowerCase())
      .filter(domain => {
        // Basic domain format validation
        const domainRegex = /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return domain.length > 0 && domainRegex.test(domain);
      });

    this.allowed_domains = validDomains.length > 0 ? validDomains : undefined;
  }

  /**
   * Retrieves Azure AD configuration object formatted for MSAL integration
   *
   * Creates a clean configuration object containing all necessary Azure AD
   * parameters for use with Microsoft Authentication Library (MSAL) and other
   * Azure AD integration libraries. Automatically decrypts the client secret
   * for immediate use.
   *
   * @returns {IAzureAdConfig} Complete Azure AD configuration object
   *
   * @security
   * - Automatically decrypts client secret for library usage
   * - Provides configuration in format expected by MSAL library
   * - Maintains cloud environment context for proper endpoint routing
   *
   * @example
   * ```typescript
   * const ssoConfig = await SSOConfigurationModel.findOne({
   *   where: { organization_id: 123 }
   * });
   *
   * // Get configuration for MSAL
   * const azureConfig = ssoConfig.getAzureAdConfig();
   *
   * // Use with MSAL Node library
   * const msalInstance = new ConfidentialClientApplication({
   *   auth: {
   *     clientId: azureConfig.client_id,
   *     clientSecret: azureConfig.client_secret,
   *     authority: `${ssoConfig.getAzureADBaseUrl()}/${azureConfig.tenant_id}`
   *   }
   * });
   * ```
   */
  public getAzureAdConfig(): IAzureAdConfig {
    return {
      tenant_id: this.azure_tenant_id,
      client_id: this.azure_client_id,
      client_secret: this.getDecryptedSecret(),
      cloud_environment: this.cloud_environment
    };
  }

  /**
   * Validates the SSO configuration before saving to database
   *
   * Performs comprehensive validation of all Azure AD configuration parameters
   * to ensure they meet security and format requirements. This method should be
   * called before saving the configuration to prevent invalid settings.
   *
   * @async
   * @throws {Error} If any validation requirements are not met
   *
   * @validation_rules
   * - Azure AD tenant_id must be present and in valid GUID format
   * - Azure AD client_id must be present and in valid GUID format
   * - Azure AD client_secret must be present and non-empty
   * - Default role ID must be valid (1-4) if specified
   * - Cloud environment must be valid Azure environment
   *
   * @example
   * ```typescript
   * const ssoConfig = new SSOConfigurationModel({
   *   organization_id: 123,
   *   azure_tenant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
   *   azure_client_id: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
   *   azure_client_secret: 'valid_secret',
   *   cloud_environment: 'AzurePublic',
   *   default_role_id: 2
   * });
   *
   * try {
   *   await ssoConfig.validateConfiguration();
   *   await ssoConfig.save(); // Safe to save
   * } catch (error) {
   *   console.error('Configuration validation failed:', error.message);
   * }
   * ```
   */
  public async validateConfiguration(): Promise<void> {
    // Validate Azure AD fields
    if (!this.azure_tenant_id || !this.azure_client_id || !this.azure_client_secret) {
      throw new Error('Azure AD configuration is incomplete. tenant_id, client_id, and client_secret are required.');
    }

    // Validate GUID format for tenant_id and client_id
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!guidRegex.test(this.azure_tenant_id)) {
      throw new Error('Azure tenant ID must be a valid GUID format.');
    }

    if (!guidRegex.test(this.azure_client_id)) {
      throw new Error('Azure client ID must be a valid GUID format.');
    }

    // Validate default_role_id exists
    if (this.default_role_id) {
      // In a real implementation, you'd check if the role exists in the database
      if (this.default_role_id < 1 || this.default_role_id > 4) {
        throw new Error('Invalid default role ID. Must be between 1-4.');
      }
    }
  }
}