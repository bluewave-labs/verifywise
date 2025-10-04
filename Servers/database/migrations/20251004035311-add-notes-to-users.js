'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'User personal notes content (HTML format)'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'notes');
  }
};
