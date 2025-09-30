/**
 * Unified SSO Configuration Model
 *
 * Replaces the original Azure AD-specific model with a flexible, multi-provider
 * configuration model that can support Azure AD, Google, SAML, and other providers.
 */

import { Column, DataType, Model, Table, ForeignKey, BelongsTo, Index } from "sequelize-typescript";
import { OrganizationModel } from "../organization/organization.model";
import { encryptSecret, decryptSecret, isEncrypted } from "../../../utils/sso-encryption.utils";
import {
  SSOProviderType,
  SSOProviderConfig,
  CloudEnvironment
} from "../../../interfaces/sso-provider.interface";
import crypto from 'crypto';

export interface IUnifiedSSOConfiguration {
  id?: number;
  organization_id: number;
  provider_id: string; // Unique identifier for this provider instance
  provider_type: SSOProviderType;
  provider_name: string; // Human-readable name

  // Core configuration
  client_id: string;
  client_secret: string; // Encrypted
  cloud_environment: CloudEnvironment;
  is_enabled: boolean;
  is_primary: boolean; // Whether this is the primary SSO provider for the org

  // Provider-specific configuration (JSON, encrypted)
  provider_config: string; // Encrypted JSON containing provider-specific settings

  // Security settings
  allowed_domains?: string[];
  default_role_id?: number;

  // OAuth/OIDC settings
  scopes?: string[];
  redirect_uri?: string;

  // Timestamps
  created_at?: Date;
  updated_at?: Date;
  last_used_at?: Date;
}

@Table({
  tableName: "unified_sso_configurations",
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['organization_id', 'provider_id']
    },
    {
      fields: ['organization_id', 'provider_type']
    },
    {
      fields: ['organization_id', 'is_enabled']
    },
    {
      fields: ['organization_id', 'is_primary']
    }
  ]
})
export class UnifiedSSOConfigurationModel
  extends Model<UnifiedSSOConfigurationModel>
  implements IUnifiedSSOConfiguration {

  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  @ForeignKey(() => OrganizationModel)
  @Index
  organization_id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: 'Unique identifier for this provider instance within the organization'
  })
  @Index
  provider_id!: string;

  @Column({
    type: DataType.ENUM(...Object.values(SSOProviderType)),
    allowNull: false,
    comment: 'Type of SSO provider (azure_ad, google, saml, etc.)'
  })
  @Index
  provider_type!: SSOProviderType;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: 'Human-readable name for this provider instance'
  })
  provider_name!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: 'OAuth/OIDC Client ID'
  })
  client_id!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: 'OAuth/OIDC Client Secret (encrypted)',
    set(this: UnifiedSSOConfigurationModel, value: string) {
      // Encrypt the secret before storing if it's not already encrypted
      if (value && !isEncrypted(value)) {
        this.setDataValue('client_secret', encryptSecret(value));
      } else {
        this.setDataValue('client_secret', value);
      }
    }
  })
  client_secret!: string;

  @Column({
    type: DataType.ENUM(...Object.values(CloudEnvironment)),
    allowNull: false,
    defaultValue: CloudEnvironment.PUBLIC,
    comment: 'Cloud environment for the provider'
  })
  cloud_environment!: CloudEnvironment;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether this provider is enabled'
  })
  @Index
  is_enabled!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether this is the primary SSO provider for the organization'
  })
  @Index
  is_primary!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Provider-specific configuration (encrypted JSON)',
    set(this: UnifiedSSOConfigurationModel, value: any) {
      if (value) {
        const jsonString = typeof value === 'string' ? value : JSON.stringify(value);
        if (!isEncrypted(jsonString)) {
          this.setDataValue('provider_config', encryptSecret(jsonString));
        } else {
          this.setDataValue('provider_config', jsonString);
        }
      } else {
        this.setDataValue('provider_config', '');
      }
    }
  })
  provider_config!: string;

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

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: ['openid', 'profile', 'email'],
    comment: 'OAuth/OIDC scopes to request'
  })
  scopes?: string[];

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    comment: 'OAuth/OIDC redirect URI'
  })
  redirect_uri?: string;

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
    type: DataType.DATE,
    allowNull: true,
    comment: 'Timestamp of when this provider was last used for authentication'
  })
  last_used_at?: Date;

  @BelongsTo(() => OrganizationModel)
  organization!: OrganizationModel;

  /**
   * Get decrypted client secret
   */
  public getDecryptedSecret(): string {
    if (!this.client_secret) return '';
    try {
      return decryptSecret(this.client_secret);
    } catch (error) {
      console.error('Failed to decrypt client secret:', error);
      return '';
    }
  }

  /**
   * Set and encrypt client secret
   */
  public setClientSecret(plainTextSecret: string): void {
    this.client_secret = encryptSecret(plainTextSecret);
  }

  /**
   * Get decrypted provider-specific configuration
   */
  public getProviderConfig<T = any>(): T | null {
    if (!this.provider_config) return null;
    try {
      const decryptedConfig = decryptSecret(this.provider_config);
      return JSON.parse(decryptedConfig) as T;
    } catch (error) {
      console.error('Failed to decrypt provider configuration:', error);
      return null;
    }
  }

  /**
   * Set and encrypt provider-specific configuration
   */
  public setProviderConfig(config: any): void {
    const jsonString = typeof config === 'string' ? config : JSON.stringify(config);
    this.provider_config = encryptSecret(jsonString);
  }

  /**
   * Get base URLs for provider based on cloud environment
   */
  public getProviderUrls(): { authUrl?: string; tokenUrl?: string; userInfoUrl?: string; logoutUrl?: string } {
    switch (this.provider_type) {
      case SSOProviderType.AZURE_AD:
        return this.getAzureADUrls();
      case SSOProviderType.GOOGLE:
        return this.getGoogleUrls();
      case SSOProviderType.SAML:
        return this.getSAMLUrls();
      default:
        return {};
    }
  }

  /**
   * Get Azure AD URLs based on cloud environment
   */
  private getAzureADUrls(): { authUrl?: string; tokenUrl?: string; userInfoUrl?: string; logoutUrl?: string } {
    const baseUrl = this.cloud_environment === CloudEnvironment.AZURE_GOVERNMENT
      ? 'https://login.microsoftonline.us'
      : 'https://login.microsoftonline.com';

    const graphUrl = this.cloud_environment === CloudEnvironment.AZURE_GOVERNMENT
      ? 'https://graph.microsoft.us'
      : 'https://graph.microsoft.com';

    const config = this.getProviderConfig<{ tenantId?: string }>();
    const tenantId = config?.tenantId || 'common';

    return {
      authUrl: `${baseUrl}/${tenantId}/oauth2/v2.0/authorize`,
      tokenUrl: `${baseUrl}/${tenantId}/oauth2/v2.0/token`,
      userInfoUrl: `${graphUrl}/v1.0/me`,
      logoutUrl: `${baseUrl}/${tenantId}/oauth2/v2.0/logout`
    };
  }

  /**
   * Get Google URLs
   */
  private getGoogleUrls(): { authUrl?: string; tokenUrl?: string; userInfoUrl?: string; logoutUrl?: string } {
    return {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      logoutUrl: 'https://accounts.google.com/logout'
    };
  }

  /**
   * Get SAML URLs from provider configuration
   */
  private getSAMLUrls(): { authUrl?: string; tokenUrl?: string; userInfoUrl?: string; logoutUrl?: string } {
    const config = this.getProviderConfig<{
      ssoUrl?: string;
      sloUrl?: string;
      metadataUrl?: string;
    }>();

    return {
      authUrl: config?.ssoUrl,
      logoutUrl: config?.sloUrl,
      userInfoUrl: config?.metadataUrl
    };
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

        try {
          const exactBuffer = Buffer.from(domain.padEnd(64, '\0'));
          const baseDomainBuffer = Buffer.from(baseDomain.padEnd(64, '\0'));

          // Check exact match with base domain
          const exactMatchResult = domain.length === baseDomain.length &&
            crypto.timingSafeEqual(exactBuffer.subarray(0, baseDomain.length), baseDomainBuffer.subarray(0, baseDomain.length));

          // Check wildcard match (domain ends with .baseDomain)
          const wildcardMatchResult = domain.endsWith('.' + baseDomain);

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

      // Use bitwise OR with numeric conversion for true constant-time operation
      isAllowed = Boolean((isAllowed ? 1 : 0) | (domainMatches ? 1 : 0));
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
   * Convert to provider configuration format
   */
  public toProviderConfig(): SSOProviderConfig {
    const providerSpecificConfig = this.getProviderConfig() || {};

    return {
      providerId: this.provider_id,
      providerType: this.provider_type,
      organizationId: this.organization_id,
      isEnabled: this.is_enabled,
      cloudEnvironment: this.cloud_environment,
      clientId: this.client_id,
      clientSecret: this.getDecryptedSecret(),
      allowedDomains: this.allowed_domains,
      defaultRoleId: this.default_role_id,
      scopes: this.scopes,
      customParameters: {},
      createdAt: this.created_at,
      updatedAt: this.updated_at,
      ...providerSpecificConfig
    };
  }

  /**
   * Create from provider configuration format
   */
  public static fromProviderConfig(config: SSOProviderConfig): Partial<IUnifiedSSOConfiguration> {
    const {
      providerId,
      providerType,
      organizationId,
      isEnabled,
      cloudEnvironment,
      clientId,
      clientSecret,
      allowedDomains,
      defaultRoleId,
      scopes,
      customParameters,
      ...providerSpecificConfig
    } = config;

    return {
      provider_id: providerId,
      provider_type: providerType,
      organization_id: organizationId,
      is_enabled: isEnabled,
      cloud_environment: cloudEnvironment,
      client_id: clientId,
      client_secret: clientSecret,
      allowed_domains: allowedDomains,
      default_role_id: defaultRoleId,
      scopes: scopes,
      provider_config: JSON.stringify({
        ...providerSpecificConfig,
        customParameters
      }),
      provider_name: `${providerType}_${providerId}`
    };
  }

  /**
   * Validate the configuration before saving
   */
  public async validateConfiguration(): Promise<void> {
    // Validate provider type
    if (!Object.values(SSOProviderType).includes(this.provider_type)) {
      throw new Error(`Invalid provider type: ${this.provider_type}`);
    }

    // Validate required fields
    if (!this.client_id || !this.client_secret) {
      throw new Error('Client ID and Client Secret are required.');
    }

    // Provider-specific validation
    switch (this.provider_type) {
      case SSOProviderType.AZURE_AD:
        await this.validateAzureADConfig();
        break;
      case SSOProviderType.GOOGLE:
        await this.validateGoogleConfig();
        break;
      case SSOProviderType.SAML:
        await this.validateSAMLConfig();
        break;
    }

    // Validate default_role_id exists
    if (this.default_role_id) {
      if (this.default_role_id < 1 || this.default_role_id > 4) {
        throw new Error('Invalid default role ID. Must be between 1-4.');
      }
    }
  }

  /**
   * Validate Azure AD specific configuration
   */
  private async validateAzureADConfig(): Promise<void> {
    const config = this.getProviderConfig<{ tenantId?: string }>();

    if (!config?.tenantId) {
      throw new Error('Azure AD Tenant ID is required.');
    }

    // Validate GUID format for tenant_id and client_id
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!guidRegex.test(config.tenantId)) {
      throw new Error('Azure tenant ID must be a valid GUID format.');
    }

    if (!guidRegex.test(this.client_id)) {
      throw new Error('Azure client ID must be a valid GUID format.');
    }

    if (this.cloud_environment !== CloudEnvironment.AZURE_PUBLIC &&
        this.cloud_environment !== CloudEnvironment.AZURE_GOVERNMENT) {
      throw new Error('Cloud environment must be azure_public or azure_government for Azure AD.');
    }
  }

  /**
   * Validate Google specific configuration
   */
  private async validateGoogleConfig(): Promise<void> {
    // Google-specific validation logic
    if (this.cloud_environment !== CloudEnvironment.GOOGLE_PUBLIC &&
        this.cloud_environment !== CloudEnvironment.PUBLIC) {
      throw new Error('Cloud environment must be google_public or public for Google.');
    }
  }

  /**
   * Validate SAML specific configuration
   */
  private async validateSAMLConfig(): Promise<void> {
    const config = this.getProviderConfig<{
      ssoUrl?: string;
      metadataUrl?: string;
      entityId?: string;
    }>();

    if (!config?.ssoUrl && !config?.metadataUrl) {
      throw new Error('SAML SSO URL or Metadata URL is required.');
    }

    if (!config?.entityId) {
      throw new Error('SAML Entity ID is required.');
    }
  }

  /**
   * Update last used timestamp
   */
  public async markAsUsed(): Promise<void> {
    this.last_used_at = new Date();
    await this.save();
  }
}

export default UnifiedSSOConfigurationModel;