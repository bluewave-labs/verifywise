"use strict";
const { getTenantHash } = require("../../dist/tools/getTenantHash");

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
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".mlflow_integrations 
           ADD COLUMN last_successful_test_at TIMESTAMP,
           ADD COLUMN last_failed_test_at TIMESTAMP,
           ADD COLUMN last_failed_test_message TEXT;`,
          { transaction }
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".mlflow_integrations 
           DROP COLUMN IF EXISTS last_successful_test_at,
           DROP COLUMN IF EXISTS last_failed_test_at,
           DROP COLUMN IF EXISTS last_failed_test_message;`,
          { transaction }
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
