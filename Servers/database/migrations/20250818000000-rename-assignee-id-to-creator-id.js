"use strict";

const { DataTypes } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename assignee_id column to creator_id since we now use task_assignees table for assignments
    await queryInterface.renameColumn("tasks", "assignee_id", "creator_id");
    
    // Update the foreign key constraint to be NOT NULL since creator is required
    await queryInterface.changeColumn("tasks", "creator_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert the column constraint
    await queryInterface.changeColumn("tasks", "creator_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    
    // Rename back to assignee_id
    await queryInterface.renameColumn("tasks", "creator_id", "assignee_id");
  },
};