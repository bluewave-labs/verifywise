'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
  await queryInterface.sequelize.query('ALTER TABLE users RENAME COLUMN role TO role_id;');
   
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TABLE users RENAME COLUMN role_id TO role;'
    );   
  }
};
