'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add "Compliance requirements group" to the enum_files_source enum for Law 25
    await queryInterface.sequelize.query(`
      ALTER TYPE public.enum_files_source ADD VALUE IF NOT EXISTS 'Compliance requirements group';
    `);

    console.log('Added "Compliance requirements group" to enum_files_source for Quebec Law 25');
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This is handled by the fact that enum values are rarely removed
    // and the presence of the value won't break existing functionality
    console.log('Note: enum values cannot be easily removed in PostgreSQL');
  }
};
