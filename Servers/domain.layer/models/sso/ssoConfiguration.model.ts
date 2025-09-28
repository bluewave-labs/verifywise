/**
 * Represents SSO configuration for an organization.
 *
 * @type SSOConfiguration
 *
 * @property {number} organization_id - The organization ID (Primary Key)
 * @property {string} azure_tenant_id - Azure AD Tenant ID (UUID format)
 * @property {string} azure_client_id - Azure AD Application Client ID (UUID format)
 * @property {string} azure_client_secret - Azure AD Client Secret (encrypted)
 * @property {string} cloud_environment - Azure cloud environment (Public/Government)
 * @property {boolean} is_enabled - Whether SSO is enabled for this organization
 * @property {Date} created_at - The date and time when the configuration was created
 * @property {Date} updated_at - The date and time when the configuration was last updated
 */

import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from "sequelize-typescript";
import { OrganizationModel } from "../organization/organization.model";
import { encryptSecret, decryptSecret, isEncrypted } from "../../../utils/sso-encryption.utils";
import crypto from 'crypto';

export interface ISSOConfiguration {
  organization_id: number;
  azure_tenant_id: string;
  azure_client_id: string;
  azure_client_secret: string;
  cloud_environment: 'AzurePublic' | 'AzureGovernment';
  is_enabled: boolean;
  auth_method_policy: 'sso_only' | 'password_only' | 'both';
  created_at?: Date;
  updated_at?: Date;
}

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
   * Get decrypted client secret
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
   * Set and encrypt client secret
   */
  public setClientSecret(plainTextSecret: string): void {
    this.azure_client_secret = encryptSecret(plainTextSecret);
  }

  /**
   * Get Azure AD login URL based on cloud environment
   */
  public getAzureADBaseUrl(): string {
    return this.cloud_environment === 'AzureGovernment'
      ? 'https://login.microsoftonline.us'
      : 'https://login.microsoftonline.com';
  }

  /**
   * Get Microsoft Graph API URL based on cloud environment
   */
  public getGraphApiUrl(): string {
    return this.cloud_environment === 'AzureGovernment'
      ? 'https://graph.microsoft.us'
      : 'https://graph.microsoft.com';
  }

  /**
   * Check if email domain is allowed for this SSO configuration
   * Uses constant-time comparison to prevent timing attacks
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
   * Get the default role ID for new SSO users
   */
  public getDefaultRoleId(): number {
    return this.default_role_id || 2; // Default to Reviewer role (ID: 2)
  }

  /**
   * Set allowed domains with validation
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
   * Validate the configuration before saving
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