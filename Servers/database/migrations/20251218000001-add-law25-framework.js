"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `INSERT INTO frameworks (name, description, is_organizational) VALUES
      ('Quebec Law 25', 'Quebec Law 25 (Bill 64) is a privacy protection framework that modernizes the protection of personal information in Quebec, Canada. It establishes requirements for consent, transparency, privacy impact assessments, and data governance for organizations processing personal information of Quebec residents.', true);`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `DELETE FROM frameworks WHERE name = 'Quebec Law 25';`
    );
  },
};
