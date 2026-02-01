'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        (tenantHash) => `ALTER TABLE "${tenantHash}".automations ALTER COLUMN created_by DROP NOT NULL;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".ce_markings ALTER COLUMN created_by DROP NOT NULL, ALTER COLUMN updated_by DROP NOT NULL;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".ce_marking_audit_trail ALTER COLUMN changed_by DROP NOT NULL;`,
      ]

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await Promise.all(
          queries.map((query) =>
            queryInterface.sequelize.query(
              query(tenantHash),
              { transaction }
            )
          )
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
      const queries = [
        (tenantHash) => `ALTER TABLE "${tenantHash}".automations ALTER COLUMN created_by SET NOT NULL;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".ce_markings ALTER COLUMN created_by SET NOT NULL, ALTER COLUMN updated_by SET NOT NULL;`,
        (tenantHash) => `ALTER TABLE "${tenantHash}".ce_marking_audit_trail ALTER COLUMN changed_by SET NOT NULL;`,
      ]

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await Promise.all(
          queries.map((query) =>
            queryInterface.sequelize.query(
              query(tenantHash),
              { transaction }
            )
          )
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
