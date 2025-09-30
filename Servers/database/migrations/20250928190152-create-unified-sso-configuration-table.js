'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create the unified_sso_configurations table
    await queryInterface.createTable('unified_sso_configurations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      provider_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Unique identifier for this provider instance within the organization'
      },
      provider_type: {
        type: Sequelize.ENUM('azure_ad', 'google', 'saml', 'okta', 'ping_identity'),
        allowNull: false,
        comment: 'Type of SSO provider'
      },
      provider_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Human-readable name for this provider instance'
      },
      client_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'OAuth/OIDC Client ID'
      },
      client_secret: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'OAuth/OIDC Client Secret (encrypted)'
      },
      cloud_environment: {
        type: Sequelize.ENUM(
          'azure_public', 'azure_government',
          'google_public',
          'public', 'government', 'private'
        ),
        allowNull: false,
        defaultValue: 'public',
        comment: 'Cloud environment for the provider'
      },
      is_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this provider is enabled'
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this is the primary SSO provider for the organization'
      },
      provider_config: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Provider-specific configuration (encrypted JSON)'
      },
      allowed_domains: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        comment: 'List of allowed email domains for this SSO configuration. NULL means no restrictions.'
      },
      default_role_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 2,
        comment: 'Default role ID assigned to new users created via SSO. Defaults to Reviewer (ID: 2).'
      },
      scopes: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: ['openid', 'profile', 'email'],
        comment: 'OAuth/OIDC scopes to request'
      },
      redirect_uri: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'OAuth/OIDC redirect URI'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      last_used_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp of when this provider was last used for authentication'
      }
    });

    // Create indexes for better performance
    await queryInterface.addIndex('unified_sso_configurations', {
      fields: ['organization_id', 'provider_id'],
      unique: true,
      name: 'unified_sso_configurations_org_provider_unique'
    });

    await queryInterface.addIndex('unified_sso_configurations', {
      fields: ['organization_id', 'provider_type'],
      name: 'unified_sso_configurations_org_type_idx'
    });

    await queryInterface.addIndex('unified_sso_configurations', {
      fields: ['organization_id', 'is_enabled'],
      name: 'unified_sso_configurations_org_enabled_idx'
    });

    await queryInterface.addIndex('unified_sso_configurations', {
      fields: ['organization_id', 'is_primary'],
      name: 'unified_sso_configurations_org_primary_idx'
    });

    await queryInterface.addIndex('unified_sso_configurations', {
      fields: ['provider_type'],
      name: 'unified_sso_configurations_provider_type_idx'
    });

    await queryInterface.addIndex('unified_sso_configurations', {
      fields: ['last_used_at'],
      name: 'unified_sso_configurations_last_used_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('unified_sso_configurations', 'unified_sso_configurations_org_provider_unique');
    await queryInterface.removeIndex('unified_sso_configurations', 'unified_sso_configurations_org_type_idx');
    await queryInterface.removeIndex('unified_sso_configurations', 'unified_sso_configurations_org_enabled_idx');
    await queryInterface.removeIndex('unified_sso_configurations', 'unified_sso_configurations_org_primary_idx');
    await queryInterface.removeIndex('unified_sso_configurations', 'unified_sso_configurations_provider_type_idx');
    await queryInterface.removeIndex('unified_sso_configurations', 'unified_sso_configurations_last_used_idx');

    // Drop the table
    await queryInterface.dropTable('unified_sso_configurations');

    // Drop the ENUMs (Note: this might affect other tables using the same ENUM)
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_unified_sso_configurations_provider_type";');
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_unified_sso_configurations_cloud_environment";');
  }
};