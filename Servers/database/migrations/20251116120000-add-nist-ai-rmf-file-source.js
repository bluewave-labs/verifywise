'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add "Subcategories group" to the enum_files_source enum for NIST AI RMF
    await queryInterface.sequelize.query(`
      ALTER TYPE public.enum_files_source ADD VALUE 'Subcategories group';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This is handled by the fact that enum values are rarely removed
    // and the presence of the value won't break existing functionality
  }
};