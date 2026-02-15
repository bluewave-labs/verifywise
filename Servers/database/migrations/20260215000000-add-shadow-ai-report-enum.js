'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.sequelize.query(
        `ALTER TYPE enum_files_source ADD VALUE 'Shadow AI report';`);
    } catch (error) {
      // Value may already exist if migration was partially applied
      if (error.message && error.message.includes('already exists')) {
        console.log('enum value "Shadow AI report" already exists, skipping');
        return;
      }
      throw error;
    }
  },

  async down(queryInterface, Sequelize) { }
};
