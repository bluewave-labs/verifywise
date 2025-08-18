'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction })
      if (organizations[0].length !== 0) {
        const tenantHash = getTenantHash(organizations[0][0].id);
        await queryInterface.sequelize.query(
          `CREATE TABLE "${tenantHash}".subclauses_iso__risks (
            subclause_id INTEGER NOT NULL,
            projects_risks_id INTEGER NOT NULL,
            PRIMARY KEY (subclause_id, projects_risks_id),
            FOREIGN KEY (subclause_id) REFERENCES "${tenantHash}".subclauses_iso(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".projectrisks(id) ON DELETE CASCADE ON UPDATE CASCADE
          );`, { transaction }
        )
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
      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction })
      if (organizations[0].length !== 0) {
        const tenantHash = getTenantHash(organizations[0][0].id);
        await queryInterface.sequelize.query(
          `DROP TABLE "${tenantHash}".subclauses_iso__risks;`, { transaction }
        )
      }
      await transaction.commit();
    } catch (error) {
      console.error('Error in migration:', error);
      await transaction.rollback();
      throw error;
    }
  }
};
