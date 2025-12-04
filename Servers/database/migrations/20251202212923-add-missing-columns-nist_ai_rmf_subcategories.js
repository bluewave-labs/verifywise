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

      for (const org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);
        await queryInterface.sequelize.query(
          `
            ALTER TABLE "${tenantHash}".nist_ai_rmf_subcategories
            ADD COLUMN IF NOT EXISTS subcategory_meta_id INTEGER,
            ADD COLUMN IF NOT EXISTS projects_frameworks_id INTEGER NOT NULL;
          `,
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

      for (const org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);
        await queryInterface.sequelize.query(
          `
          ALTER TABLE "${tenantHash}".nist_ai_rmf_subcategories
          DROP COLUMN IF EXISTS subcategory_meta_id,
          DROP COLUMN IF EXISTS projects_frameworks_id;
          `,
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
