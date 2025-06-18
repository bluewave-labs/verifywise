'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`ALTER TABLE "trainingregistar"
    ADD COLUMN "description" VARCHAR(255);`);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`ALTER TABLE "trainingregistar"
    DROP COLUMN "description";`);
  }
};
