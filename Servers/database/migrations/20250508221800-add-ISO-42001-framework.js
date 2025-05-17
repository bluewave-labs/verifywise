"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `INSERT INTO frameworks (name, description) VALUES
      ('ISO 42001', 'ISO 42001 is an international standard that offers a framework for setting up and improving an information security management system (ISMS), helping organizations manage security risks and protect sensitive data.');`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `DELETE FROM frameworks WHERE name = 'ISO 42001';`
    );
  },
};
