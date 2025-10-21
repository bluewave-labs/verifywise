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
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendors
          ALTER COLUMN reviewer DROP NOT NULL;
        `, { transaction });
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
        // Set a default value for NULL reviewers before making the column NOT NULL
        await queryInterface.sequelize.query(`
          UPDATE "${tenantHash}".vendors
          SET reviewer = assignee
          WHERE reviewer IS NULL;
        `, { transaction });
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendors
          ALTER COLUMN reviewer SET NOT NULL;
        `, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
