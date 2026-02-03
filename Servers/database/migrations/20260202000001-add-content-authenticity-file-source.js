'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`ALTER TYPE "enum_files_source" ADD VALUE IF NOT EXISTS 'Content Authenticity';`);
  },

  async down (queryInterface, Sequelize) {
    // Cannot remove enum values in PostgreSQL
  }
};
