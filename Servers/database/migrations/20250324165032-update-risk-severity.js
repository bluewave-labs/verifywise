'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('projectrisks', 'severity', {
      type: Sequelize.ENUM("Negligible", "Minor", "Moderate", "Major", "Catastrophic"),
      allowNull: false
    })

    await queryInterface.changeColumn('vendorrisks', 'risk_severity', {
      type: Sequelize.ENUM("Negligible", "Minor", "Moderate", "Major", "Catastrophic"),
      allowNull: false
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('projectrisks', 'severity', {
      type: Sequelize.ENUM("Negligible", "Minor", "Moderate", "Major", "Critical"),
      allowNull: false
    })

    await queryInterface.changeColumn('vendorrisks', 'risk_severity', {
      type: Sequelize.ENUM("No risk", "Low risk", "Medium risk", "High risk", "Very high risk"),
      allowNull: false
    })
  }
};
