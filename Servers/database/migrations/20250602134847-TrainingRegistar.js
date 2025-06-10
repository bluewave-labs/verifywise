"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("trainingregistar", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      training_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      duration: {
        type: Sequelize.STRING,
      },
      provider: {
        type: Sequelize.STRING,
      },
      department: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.ENUM("Planned", "In Progress", "Completed"),
      },
      people: {
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("trainingregistar");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_trainingregistar_status";'
    );
  },
};
