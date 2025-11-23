'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Create share_links table in tenant schema
        await queryInterface.sequelize.query(
          `CREATE TABLE IF NOT EXISTS "${tenantHash}".share_links (
            id SERIAL PRIMARY KEY,
            share_token VARCHAR(64) UNIQUE NOT NULL,
            resource_type VARCHAR(50) NOT NULL,
            resource_id INTEGER NOT NULL,
            created_by INTEGER NOT NULL REFERENCES "${tenantHash}".users(id) ON DELETE CASCADE,
            settings JSONB DEFAULT '{"shareAllFields": false, "allowDataExport": true, "allowViewersToOpenRecords": false, "displayToolbar": true}'::jsonb,
            is_enabled BOOLEAN DEFAULT true,
            expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );`,
          { transaction }
        );

        // Create index on share_token for fast lookup
        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS share_links_token_idx ON "${tenantHash}".share_links(share_token);`,
          { transaction }
        );

        // Create index on resource for fast lookup
        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS share_links_resource_idx ON "${tenantHash}".share_links(resource_type, resource_id);`,
          { transaction }
        );

        // Create index on created_by for user-specific queries
        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS share_links_created_by_idx ON "${tenantHash}".share_links(created_by);`,
          { transaction }
        );
      }

      await transaction.commit();
      console.log('✅ Successfully created share_links table for all tenants');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error creating share_links table:', error);
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

        // Drop indexes first
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}".share_links_token_idx;`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}".share_links_resource_idx;`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}".share_links_created_by_idx;`,
          { transaction }
        );

        // Drop table
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".share_links;`,
          { transaction }
        );
      }

      await transaction.commit();
      console.log('✅ Successfully dropped share_links table for all tenants');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error dropping share_links table:', error);
      throw error;
    }
  }
};
