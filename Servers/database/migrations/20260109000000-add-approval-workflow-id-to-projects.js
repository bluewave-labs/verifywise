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

      // Add approval_workflow_id column to projects table in each tenant schema
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
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".projects
             ADD COLUMN IF NOT EXISTS approval_workflow_id INTEGER REFERENCES "${tenantHash}".approval_workflows(id) ON DELETE SET NULL`,
            { transaction }
          );
          console.log(`Added approval_workflow_id column to ${tenantHash}.projects`);
        } catch (error) {
          console.error(`Error adding approval_workflow_id to ${tenantHash}.projects:`, error.message);
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
      // Get all existing organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      // Remove approval_workflow_id column from projects table in each tenant schema
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
             DROP COLUMN IF EXISTS approval_workflow_id`,
            { transaction }
          );
          console.log(`Removed approval_workflow_id column from ${tenantHash}.projects`);
        } catch (error) {
          console.error(`Error removing approval_workflow_id from ${tenantHash}.projects:`, error.message);
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
