'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if SSO provider ENUM exists
      const [providerEnumExists] = await queryInterface.sequelize.query(`
        SELECT 1 FROM pg_type WHERE typname = 'enum_sso_configuration_providers'
      `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

      if (!providerEnumExists) {
        await queryInterface.sequelize.query(`
          CREATE TYPE enum_sso_configuration_providers AS ENUM ('AzureAD');
        `, { transaction });
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      if (organizations[0].length === 0) {
        await transaction.commit();
        return;
      }

      for (let organization of organizations[0]) {
        try {
          const tenantHash = getTenantHash(organization.id);

          // Check if table already exists
          const [tableExists] = await queryInterface.sequelize.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = '${tenantHash}' AND table_name = 'sso_configurations'
          `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

          if (tableExists) {
            continue;
          }

          // Create SSO configurations table
          await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS "${tenantHash}".sso_configurations (
              id SERIAL PRIMARY KEY,
              organization_id INTEGER NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
              provider enum_sso_configuration_providers NOT NULL,
              is_enabled BOOLEAN DEFAULT FALSE,
              config_data JSONB NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(organization_id, provider)
            );
          `, { transaction });

          // Create indexes
          await queryInterface.sequelize.query(`
            CREATE INDEX IF NOT EXISTS "${tenantHash}_sso_configurations_organization_id_idx"
            ON "${tenantHash}".sso_configurations (organization_id);
          `, { transaction });

          await queryInterface.sequelize.query(`
            CREATE INDEX IF NOT EXISTS "${tenantHash}_sso_configurations_provider_idx"
            ON "${tenantHash}".sso_configurations (provider);
          `, { transaction });

          await queryInterface.sequelize.query(`
            CREATE INDEX IF NOT EXISTS "${tenantHash}_sso_configurations_is_enabled_idx"
            ON "${tenantHash}".sso_configurations (is_enabled);
          `, { transaction });

        } catch (tenantError) {
          console.error(`Failed to process tenant for org_id ${organization.id}:`, tenantError);
        }
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
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".sso_configurations CASCADE;`,
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
