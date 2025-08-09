"use strict";

const { DataTypes } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("model_inventories", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      provider_model: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      version: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      approver: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      capabilities: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      security_assessment: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status: {
        type: Sequelize.ENUM(
          "Approved",
          "Restricted",
          "Pending",
          "Rejected",
          "Under Review"
        ),
        allowNull: false,
        defaultValue: "Pending",
      },
      status_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      is_demo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for better performance
    await queryInterface.addIndex("model_inventories", ["provider_model"]);
    await queryInterface.addIndex("model_inventories", ["status"]);
    await queryInterface.addIndex("model_inventories", ["created_at"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("model_inventories");
  },
};
