"use strict";

const { DataTypes } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tasks", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      assignee_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      priority: {
        type: Sequelize.ENUM("Low", "Medium", "High"),
        allowNull: false,
        defaultValue: "Medium",
      },
      status: {
        type: Sequelize.ENUM("Open", "In Progress", "Completed", "Overdue", "Deleted"),
        allowNull: false,
        defaultValue: "Open",
      },
      categories: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
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

    // Add indexes for efficient querying
    await queryInterface.addIndex("tasks", ["assignee_id"]);
    await queryInterface.addIndex("tasks", ["due_date"]);
    await queryInterface.addIndex("tasks", ["status"]);
    await queryInterface.addIndex("tasks", ["priority"]);
    await queryInterface.addIndex("tasks", ["created_at"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("tasks");
  },
};