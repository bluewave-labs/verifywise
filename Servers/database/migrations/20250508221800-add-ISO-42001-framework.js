'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `INSERT INTO frameworks (name, description) VALUES
      ('ISO 42001', 'ISO 42001 is an international standard that provides a framework for establishing, implementing, maintaining, and continually improving an information security management system (ISMS). It is designed to help organizations manage their information security risks and protect sensitive data.');`
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `DELETE FROM frameworks WHERE name = 'ISO 42001';`
    )
  }
};
