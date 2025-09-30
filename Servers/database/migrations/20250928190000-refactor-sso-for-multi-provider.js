'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Create sso_providers table
      await queryInterface.createTable('sso_providers', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
          comment: 'Provider identifier (azure-ad, google, okta, etc.)'
        },
        display_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Human-readable provider name'
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          comment: 'Whether this provider type is available for configuration'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now')
        }
      }, { transaction });

      // 2. Insert default providers
      await queryInterface.bulkInsert('sso_providers', [
        {
          name: 'azure-ad',
          display_name: 'Microsoft Azure Active Directory',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'google',
          display_name: 'Google Workspace',
          is_active: false, // Not implemented yet
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'okta',
          display_name: 'Okta',
          is_active: false, // Not implemented yet
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'saml',
          display_name: 'SAML 2.0',
          is_active: false, // Not implemented yet
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      // 3. Create new sso_configurations table with proper structure
      await queryInterface.createTable('sso_configurations_new', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
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
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'sso_providers',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        provider_config: {
          type: Sequelize.JSONB,
          allowNull: false,
          comment: 'Encrypted provider-specific configuration'
        },
        is_enabled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        allowed_domains: {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: true,
          comment: 'List of allowed email domains for this SSO configuration'
        },
        default_role_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'roles',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          comment: 'Default role assigned to new users from this SSO provider'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now')
        }
      }, { transaction });

      // 4. Migrate existing Azure AD configurations
      const existingConfigs = await queryInterface.sequelize.query(
        'SELECT * FROM sso_configurations',
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      if (existingConfigs.length > 0) {
        // Get Azure AD provider ID
        const [azureAdProvider] = await queryInterface.sequelize.query(
          "SELECT id FROM sso_providers WHERE name = 'azure-ad'",
          { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
        );

        const azureAdProviderId = azureAdProvider.id;

        // Migrate each existing configuration
        for (const config of existingConfigs) {
          const providerConfig = {
            azure_client_id: config.azure_client_id,
            azure_client_secret: config.azure_client_secret_encrypted,
            azure_tenant_id: config.azure_tenant_id,
            azure_cloud_environment: config.azure_cloud_environment || 'public'
          };

          await queryInterface.bulkInsert('sso_configurations_new', [{
            organization_id: config.organization_id,
            provider_id: azureAdProviderId,
            provider_config: JSON.stringify(providerConfig),
            is_enabled: config.is_enabled,
            allowed_domains: null, // Will be set up separately
            default_role_id: 2, // Default to Reviewer role
            created_at: config.created_at || new Date(),
            updated_at: config.updated_at || new Date()
          }], { transaction });
        }
      }

      // 5. Drop old table and rename new one
      await queryInterface.dropTable('sso_configurations', { transaction });
      await queryInterface.renameTable('sso_configurations_new', 'sso_configurations', { transaction });

      // 6. Add indexes for performance
      await queryInterface.addIndex('sso_configurations',
        ['organization_id', 'provider_id'],
        {
          unique: true,
          name: 'idx_sso_config_org_provider',
          transaction
        }
      );

      await queryInterface.addIndex('sso_configurations',
        ['is_enabled', 'provider_id'],
        {
          name: 'idx_sso_config_enabled_provider',
          transaction
        }
      );

      await queryInterface.addIndex('sso_providers',
        ['name'],
        {
          unique: true,
          name: 'idx_sso_providers_name',
          transaction
        }
      );

      // 7. Update users table to include provider_id for tracking
      await queryInterface.addColumn('users', 'sso_provider_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'sso_providers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'SSO provider used for this user account'
      }, { transaction });

      // 8. Update existing SSO users to use Azure AD provider
      if (existingConfigs.length > 0) {
        await queryInterface.sequelize.query(
          `UPDATE users SET sso_provider_id = (SELECT id FROM sso_providers WHERE name = 'azure-ad')
           WHERE sso_enabled = true`,
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Remove provider_id column from users
      await queryInterface.removeColumn('users', 'sso_provider_id', { transaction });

      // 2. Create old sso_configurations table structure
      await queryInterface.createTable('sso_configurations_old', {
        organization_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          allowNull: false,
          references: {
            model: 'organizations',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        azure_client_id: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        azure_client_secret_encrypted: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        azure_tenant_id: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        azure_cloud_environment: {
          type: Sequelize.ENUM('public', 'government', 'china', 'germany'),
          allowNull: false,
          defaultValue: 'public'
        },
        is_enabled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now')
        }
      }, { transaction });

      // 3. Migrate Azure AD configurations back
      const newConfigs = await queryInterface.sequelize.query(
        `SELECT sc.*, sp.name as provider_name
         FROM sso_configurations sc
         JOIN sso_providers sp ON sc.provider_id = sp.id
         WHERE sp.name = 'azure-ad'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      for (const config of newConfigs) {
        const providerConfig = JSON.parse(config.provider_config);

        await queryInterface.bulkInsert('sso_configurations_old', [{
          organization_id: config.organization_id,
          azure_client_id: providerConfig.azure_client_id,
          azure_client_secret_encrypted: providerConfig.azure_client_secret,
          azure_tenant_id: providerConfig.azure_tenant_id,
          azure_cloud_environment: providerConfig.azure_cloud_environment,
          is_enabled: config.is_enabled,
          created_at: config.created_at,
          updated_at: config.updated_at
        }], { transaction });
      }

      // 4. Drop new tables
      await queryInterface.dropTable('sso_configurations', { transaction });
      await queryInterface.dropTable('sso_providers', { transaction });

      // 5. Rename old table back
      await queryInterface.renameTable('sso_configurations_old', 'sso_configurations', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};