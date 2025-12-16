'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Fetch all organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Add content column (BYTEA for storing file binary data)
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".file_manager
           ADD COLUMN IF NOT EXISTS content BYTEA;`,
          { transaction }
        );

        // Add source column (VARCHAR for tracking file origin)
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".file_manager
           ADD COLUMN IF NOT EXISTS source VARCHAR(50);`,
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
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Remove the content column
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".file_manager
           DROP COLUMN IF EXISTS content;`,
          { transaction }
        );

        // Remove the source column
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".file_manager
           DROP COLUMN IF EXISTS source;`,
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
