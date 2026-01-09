'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all existing organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      // Add columns to projects table in each tenant schema
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Check if schema exists before proceeding
        const [schemaExists] = await queryInterface.sequelize.query(
          `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${tenantHash}';`,
          { transaction }
        );

        if (schemaExists.length === 0) {
          console.log(`Schema ${tenantHash} does not exist, skipping...`);
          continue;
        }

        try {
          // Add pending_frameworks column (JSONB array to store framework IDs)
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".projects
             ADD COLUMN IF NOT EXISTS pending_frameworks JSONB DEFAULT NULL`,
            { transaction }
          );

          // Add enable_ai_data_insertion column
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".projects
             ADD COLUMN IF NOT EXISTS enable_ai_data_insertion BOOLEAN DEFAULT FALSE`,
            { transaction }
          );

          console.log(`Added pending_frameworks and enable_ai_data_insertion columns to ${tenantHash}.projects`);
        } catch (error) {
          console.error(`Error adding columns to ${tenantHash}.projects:`, error.message);
        }
      }

      await transaction.commit();
      console.log('✅ Added pending_frameworks and enable_ai_data_insertion columns to projects table in all tenant schemas');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all existing organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      // Remove columns from projects table in each tenant schema
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Check if schema exists before proceeding
        const [schemaExists] = await queryInterface.sequelize.query(
          `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${tenantHash}';`,
          { transaction }
        );

        if (schemaExists.length === 0) {
          continue;
        }

        try {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".projects
             DROP COLUMN IF EXISTS pending_frameworks`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".projects
             DROP COLUMN IF EXISTS enable_ai_data_insertion`,
            { transaction }
          );

          console.log(`Removed pending_frameworks and enable_ai_data_insertion columns from ${tenantHash}.projects`);
        } catch (error) {
          console.error(`Error removing columns from ${tenantHash}.projects:`, error.message);
        }
      }

      await transaction.commit();
      console.log('✅ Removed pending_frameworks and enable_ai_data_insertion columns from projects table in all tenant schemas');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
