"use strict";

const { DataTypes } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ai_incident_management", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      incident_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      // Basic Information
      ai_project: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      severity: {
        type: Sequelize.ENUM("Minor", "Serious", "Very serious"),
        allowNull: false,
      },
      occurred_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      date_detected: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      reporter: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("Open", "Investigating", "Mitigated", "Closed"),
        allowNull: false,
        defaultValue: "Open",
      },

      // Impact Assessment
      categories_of_harm: {
        type: Sequelize.JSON, // array: ["Health", "Safety", ...]
        allowNull: false,
      },
      affected_persons_groups: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // Incident Details
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      relationship_causality: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      immediate_mitigations: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      planned_corrective_actions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // Technical Information
      model_system_version: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      interim_report: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      // Approval Section
      approval_status: {
        type: Sequelize.ENUM("Pending", "Approved", "Rejected", "Not required"),
        allowNull: false,
        defaultValue: "Pending",
      },
      approved_by: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      approval_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      approval_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // Audit Fields
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

    // Helpful indexes for filtering
    await queryInterface.addIndex("ai_incident_managements", ["severity"]);
    await queryInterface.addIndex("ai_incident_managements", ["status"]);
    await queryInterface.addIndex("ai_incident_managements", ["approval_status"]);
    await queryInterface.addIndex("ai_incident_managements", ["created_at"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ai_incident_managements");
  },
};
