"use strict";

const { DataTypes } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("task_assignees", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      task_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "tasks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
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
    await queryInterface.addIndex("task_assignees", ["task_id"]);
    await queryInterface.addIndex("task_assignees", ["user_id"]);
    
    // Add unique constraint to prevent duplicate assignments
    await queryInterface.addIndex("task_assignees", ["task_id", "user_id"], {
      unique: true,
      name: "unique_task_user_assignment"
    });
    
    // Composite index for filtering tasks by assignee (user_id first for user-centric queries)
    await queryInterface.addIndex("task_assignees", ["user_id", "task_id"], {
      name: "idx_task_assignees_user_task"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("task_assignees");
  },
};