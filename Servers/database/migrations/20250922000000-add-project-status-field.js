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

      // Add status column to each tenant's projects table
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        
        // First add the column as nullable
        await queryInterface.addColumn(
          {
            tableName: 'projects',
            schema: tenantHash
          },
          'status',
          {
            type: Sequelize.ENUM('not_started', 'in_progress', 'under_review', 'completed', 'closed', 'on_hold', 'rejected'),
            allowNull: true,
            defaultValue: 'not_started'
          },
          { transaction }
        );

        // Update all existing records to have the default status
        await queryInterface.sequelize.query(
          `UPDATE "${tenantHash}".projects SET status = 'not_started' WHERE status IS NULL;`,
          { transaction }
        );

        // Then change the column to not allow null
        await queryInterface.changeColumn(
          {
            tableName: 'projects',
            schema: tenantHash
          },
          'status',
          {
            type: Sequelize.ENUM('not_started', 'in_progress', 'under_review', 'completed', 'closed', 'on_hold', 'rejected'),
            allowNull: false,
            defaultValue: 'not_started'
          },
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