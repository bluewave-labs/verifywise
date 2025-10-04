'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Get all organizations to update their tenant schemas
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`, { transaction }
      );

      await queryInterface.sequelize.query(
        `CREATE TYPE projects_status_enum AS ENUM (
          'Not started',
          'In progress',
          'Under review',
          'Completed',
          'Closed',
          'On hold',
          'Rejected'
        );`, { transaction });

      // Add status column to each tenant's projects table
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Add the column as nullable first
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".projects
            ADD COLUMN "status" projects_status_enum
            DEFAULT 'Not started';`, { transaction });

        // Update all existing records to have the default status
        await queryInterface.sequelize.query(
          `UPDATE "${tenantHash}".projects SET status = 'Not started' WHERE status IS NULL;`,
          { transaction }
        );

        // Then change the column to not allow null
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".projects
            ALTER COLUMN "status" SET NOT NULL;`, { transaction });
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
      // Get all organizations to update their tenant schemas
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`, { transaction }
      );

      // Remove status column from each tenant's projects table
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.removeColumn(
          {
            tableName: 'projects',
            schema: tenantHash
          },
          'status',
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