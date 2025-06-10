'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.sequelize.query(
        `ALTER TYPE enum_files_source ADD VALUE 'Clauses and annexes report';`);
    } catch (error) {
      throw error;
    }
  },

  async down(queryInterface, Sequelize) { }
};
