'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`ALTER TYPE "enum_files_source" ADD VALUE 'Models and risks report';`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_files_source" ADD VALUE 'Training registry report';`);
    await queryInterface.sequelize.query(`ALTER TYPE "enum_files_source" ADD VALUE 'Policy manager report';`);
  },

  async down (queryInterface, Sequelize) {
  }
};
