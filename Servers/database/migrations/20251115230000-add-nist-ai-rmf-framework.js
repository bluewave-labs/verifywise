'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `INSERT INTO frameworks (id, name, description, is_organizational) VALUES
      (4, 'NIST AI RMF', 'The NIST AI Risk Management Framework (AI RMF) provides a voluntary framework for improving the ability to incorporate trustworthiness considerations into the design, development, use, and evaluation of AI products, services, and systems. It helps organizations manage AI risks and promote responsible AI development and deployment while supporting innovation.', TRUE);`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `DELETE FROM frameworks WHERE name = 'NIST AI RMF';`
    );
  },
};