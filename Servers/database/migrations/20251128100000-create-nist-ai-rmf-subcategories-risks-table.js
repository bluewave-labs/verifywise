'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Get all organizations to create tables in tenant schemas
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      if (organizations[0].length !== 0) {
        for (const org of organizations[0]) {
          const tenantHash = getTenantHash(org.id);

          // Create junction table for NIST AI RMF subcategories and risks
          await queryInterface.sequelize.query(
            `CREATE TABLE IF NOT EXISTS "${tenantHash}".nist_ai_rmf_subcategories__risks (
              nist_ai_rmf_subcategory_id INTEGER NOT NULL,
              projects_risks_id INTEGER NOT NULL,
              PRIMARY KEY (nist_ai_rmf_subcategory_id, projects_risks_id),
              FOREIGN KEY (nist_ai_rmf_subcategory_id) REFERENCES "${tenantHash}".nist_ai_rmf_subcategories(id) ON DELETE CASCADE ON UPDATE CASCADE,
              FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".risks(id) ON DELETE CASCADE ON UPDATE CASCADE
            );`,
            { transaction }
          );

          console.log(`Created nist_ai_rmf_subcategories__risks table for tenant: ${tenantHash}`);
        }
      }

      await transaction.commit();
    } catch (error) {
      console.error('Error in migration:', error);
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

      if (organizations[0].length !== 0) {
        for (const org of organizations[0]) {
          const tenantHash = getTenantHash(org.id);

          await queryInterface.sequelize.query(
            `DROP TABLE IF EXISTS "${tenantHash}".nist_ai_rmf_subcategories__risks;`,
            { transaction }
          );

          console.log(`Dropped nist_ai_rmf_subcategories__risks table for tenant: ${tenantHash}`);
        }
      }

      await transaction.commit();
    } catch (error) {
      console.error('Error in migration rollback:', error);
      await transaction.rollback();
      throw error;
    }
  }
};
