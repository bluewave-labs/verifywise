'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = ["annexcontrols_iso27001", "annexcategories_iso", "subclauses_iso27001", "subclauses_iso"]
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      )
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await Promise.all(tables.map(
          async (table) => {
            await queryInterface.sequelize.query(
              `UPDATE "${tenantHash}"."${table}" SET status = 'Implemented' WHERE status = 'Audited';`, { transaction }
            );
          }
        ))
      }
      await transaction.commit()
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) { }
};
