/**
 * Represents available SSO providers in the system.
 *
 * @type SSOProvider
 *
 * @property {number} id - Primary key
 * @property {string} name - Unique provider name (e.g., 'azure-ad', 'google')
 * @property {string} display_name - Human-readable provider name
 * @property {boolean} is_active - Whether this provider is available for use
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

import { Column, DataType, Model, Table, PrimaryKey, AutoIncrement } from "sequelize-typescript";

export interface ISSOProvider {
  id?: number;
  name: string;
  display_name: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

@Table({
  tableName: "sso_providers",
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
export class SSOProviderModel
  extends Model<SSOProviderModel>
  implements ISSOProvider {

  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique identifier for the provider (e.g., azure-ad, google)'
  })
  name!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: 'Human-readable name for the provider'
  })
  display_name!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether this provider is available for configuration'
  })
  is_active!: boolean;

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


  /**
   * Check if this provider is Azure AD
   */
  public isAzureAD(): boolean {
    return this.name === 'azure-ad';
  }

  /**
   * Check if this provider is Google
   */
  public isGoogle(): boolean {
    return this.name === 'google';
  }

  /**
   * Check if this provider is SAML
   */
  public isSAML(): boolean {
    return this.name === 'saml';
  }

  /**
   * Check if this provider is Okta
   */
  public isOkta(): boolean {
    return this.name === 'okta';
  }

  /**
   * Get the provider type for configuration purposes
   */
  public getProviderType(): string {
    return this.name;
  }

  /**
   * Get configuration schema for this provider
   */
  public getConfigurationSchema(): object {
    switch (this.name) {
      case 'azure-ad':
        return {
          tenant_id: { required: true, type: 'string', format: 'uuid' },
          client_id: { required: true, type: 'string', format: 'uuid' },
          client_secret: { required: true, type: 'string', sensitive: true },
          cloud_environment: {
            required: false,
            type: 'string',
            enum: ['AzurePublic', 'AzureGovernment'],
            default: 'AzurePublic'
          }
        };
      case 'google':
        return {
          client_id: { required: true, type: 'string' },
          client_secret: { required: true, type: 'string', sensitive: true },
          hosted_domain: { required: false, type: 'string' }
        };
      case 'saml':
        return {
          entity_id: { required: true, type: 'string' },
          sso_url: { required: true, type: 'string', format: 'url' },
          certificate: { required: true, type: 'string' },
          sign_request: { required: false, type: 'boolean', default: false }
        };
      default:
        return {};
    }
  }
}