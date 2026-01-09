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
          ALTER COLUMN review_result DROP NOT NULL,
          ALTER COLUMN review_status DROP NOT NULL,
          ALTER COLUMN review_date DROP NOT NULL;
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
        await queryInterface.sequelize.query(`
          UPDATE "${tenantHash}".vendors
          SET review_result = 'Review not started', review_status = 'Not started', review_date = NOW()
          WHERE review_result IS NULL OR review_status IS NULL OR review_date IS NULL;
        `, { transaction });
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".vendors
          ALTER COLUMN review_result SET NOT NULL,
          ALTER COLUMN review_status SET NOT NULL,
          ALTER COLUMN review_date SET NOT NULL;
        `, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
