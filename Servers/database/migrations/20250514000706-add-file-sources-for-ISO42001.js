'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (let query of [
        `ALTER TYPE enum_files_source ADD VALUE 'Management system clauses group';`,
        `ALTER TYPE enum_files_source ADD VALUE 'Reference controls group';`,
      ]) {
        await queryInterface.sequelize.query(query, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) { }
};
