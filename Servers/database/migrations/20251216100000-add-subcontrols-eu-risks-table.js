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

      for (const organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Create subcontrols_eu__risks table if it doesn't exist
        await queryInterface.sequelize.query(
          `CREATE TABLE IF NOT EXISTS "${tenantHash}".subcontrols_eu__risks (
            subcontrol_id INTEGER NOT NULL,
            projects_risks_id INTEGER NOT NULL,
            PRIMARY KEY (subcontrol_id, projects_risks_id),
            FOREIGN KEY (subcontrol_id) REFERENCES "${tenantHash}".subcontrols_eu(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".risks(id) ON DELETE CASCADE ON UPDATE CASCADE
          );`,
          { transaction }
        );

        // Add indexes for query optimization
        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS idx_subcontrols_eu_risks_risk_id ON "${tenantHash}".subcontrols_eu__risks(projects_risks_id);`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS idx_subcontrols_eu_subcontrol_id ON "${tenantHash}".subcontrols_eu__risks(subcontrol_id);`,
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

      for (const organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".subcontrols_eu__risks;`,
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
