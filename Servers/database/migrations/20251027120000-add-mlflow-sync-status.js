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
           ADD COLUMN last_synced_at TIMESTAMP,
           ADD COLUMN last_sync_status VARCHAR(10) CHECK (last_sync_status IN ('success', 'partial', 'error')),
           ADD COLUMN last_sync_message TEXT;`,
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
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".mlflow_integrations 
           DROP COLUMN IF EXISTS last_synced_at,
           DROP COLUMN IF EXISTS last_sync_status,
           DROP COLUMN IF EXISTS last_sync_message;`,
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
