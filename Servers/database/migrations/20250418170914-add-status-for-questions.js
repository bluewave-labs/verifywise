'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const queries = [
      `CREATE TYPE enum_status_questions AS ENUM ('Not started', 'In progress', 'Done');`,
      `ALTER TABLE questions ADD COLUMN status enum_status_questions DEFAULT 'Not started';`,
    ]
    try {
      for (const query of queries) {
        await queryInterface.sequelize.query(query, { transaction });
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
        `ALTER TABLE questions DROP COLUMN status;`,
        `DROP TYPE enum_status_questions;`
      ]
      for (let query of queries) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
