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
        await Promise.all([
          `CREATE TABLE "${tenantHash}".controls_eu__risks (
            control_id INTEGER NOT NULL,
            projects_risks_id INTEGER NOT NULL,
            PRIMARY KEY (control_id, projects_risks_id),
            FOREIGN KEY (control_id) REFERENCES "${tenantHash}".controls_eu(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".projectrisks(id) ON DELETE CASCADE ON UPDATE CASCADE
          );`,
          `CREATE TABLE "${tenantHash}".answers_eu__risks (
            answer_id INTEGER NOT NULL,
            projects_risks_id INTEGER NOT NULL,
            PRIMARY KEY (answer_id, projects_risks_id),
            FOREIGN KEY (answer_id) REFERENCES "${tenantHash}".answers_eu(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".projectrisks(id) ON DELETE CASCADE ON UPDATE CASCADE
          );`
        ].map(async (query) => {
          await queryInterface.sequelize.query(query, { transaction });
        }));
        await transaction.commit();
      }
    } catch (error) {
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
        await Promise.all([
          `DROP TABLE "${tenantHash}".controls_eu__risks;`,
          `DROP TABLE "${tenantHash}".answers_eu__risks;`
        ].map(async (query) => {
          await queryInterface.sequelize.query(query, { transaction });
        }));
      }
      await transaction.commit();
    } catch (error) {
      console.error('Error in migration:', error);
      await transaction.rollback();
      throw error;
    }
  }
};
