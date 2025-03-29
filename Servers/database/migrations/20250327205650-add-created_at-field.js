'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const tables = [
      "assessments",
      "controls",
      "controlcategories",
      "projects",
      "projectrisks",
      "projectscopes",
      "questions",
      "roles",
      "subcontrols",
      "subtopics",
      "topics",
      "vendors",
      "vendorrisks"
    ];
    const alterTableQueries = [
      table => `ALTER TABLE ${table} ADD COLUMN created_at TIMESTAMP DEFAULT NOW();`,
      table => `UPDATE ${table} SET created_at = NOW() WHERE created_at IS NULL;`,
      table => `ALTER TABLE ${table} ALTER COLUMN created_at SET NOT NULL;`
    ];
    try {
      await Promise.all(
        tables.map(async (table) => {
          for (const query of alterTableQueries) {
            await queryInterface.sequelize.query(query(table), { transaction });
          }
        })
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        "assessments",
        "controls",
        "controlcategories",
        "projects",
        "projectrisks",
        "projectscopes",
        "questions",
        "roles",
        "subcontrols",
        "subtopics",
        "topics",
        "vendors",
        "vendorrisks"
      ].map(async (table) => {
        await queryInterface.sequelize.query(
          `ALTER TABLE ${table} DROP COLUMN created_at;`,
          { transaction }
        );
      }));
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
