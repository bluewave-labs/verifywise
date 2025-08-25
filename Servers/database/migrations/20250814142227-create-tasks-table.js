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
      creator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Add indexes for efficient querying based on filtering and sorting patterns
    
    // Single column indexes for primary filters
    await queryInterface.addIndex("tasks", ["status"]);
    await queryInterface.addIndex("tasks", ["due_date"]);
    await queryInterface.addIndex("tasks", ["created_at"]);
    await queryInterface.addIndex("tasks", ["creator_id"]);
    await queryInterface.addIndex("tasks", ["organization_id"]);
    
    // Composite indexes for common query patterns
    // Filter by status + sort by due date (most common: overdue tasks, tasks by due date)
    await queryInterface.addIndex("tasks", ["status", "due_date"], {
      name: "idx_tasks_status_due_date"
    });
    
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("tasks");
    
    // Clean up ENUM types to prevent schema pollution
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_priority";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_status";');
  },
};