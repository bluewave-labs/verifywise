'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('vendorrisks', 'impact');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('vendorrisks', 'impact', {
      allowNull: true,
    });
  }
};
