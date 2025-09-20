"use strict";

const { DataTypes } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("model_risks", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      riskName: {
        type: Sequelize.STRING,
        allowNull: false,
        field: "risk_name",
      },
      riskCategory: {
        type: Sequelize.ENUM("Performance", "Bias & Fairness", "Security", "Data Quality", "Compliance"),
        allowNull: false,
        field: "risk_category",
      },
      riskLevel: {
        type: Sequelize.ENUM("Low", "Medium", "High", "Critical"),
        allowNull: false,
        field: "risk_level",
      },
      status: {
        type: Sequelize.ENUM("Open", "In Progress", "Resolved", "Accepted"),
        allowNull: false,
        defaultValue: "Open",
      },
      owner: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      targetDate: {
        type: Sequelize.DATE,
        allowNull: false,
        field: "target_date",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      mitigationPlan: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: "mitigation_plan",
      },
      impact: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      likelihood: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      keyMetrics: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: "key_metrics",
      },
      currentValues: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: "current_values",
      },
      threshold: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      modelId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: "model_id",
      },
      modelName: {
        type: Sequelize.STRING,
        allowNull: true,
        field: "model_name",
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: "tenant_id",
        defaultValue: 1,
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
    await queryInterface.addIndex("model_risks", ["risk_category"]);
    await queryInterface.addIndex("model_risks", ["risk_level"]);
    await queryInterface.addIndex("model_risks", ["status"]);
    await queryInterface.addIndex("model_risks", ["owner"]);
    await queryInterface.addIndex("model_risks", ["tenant_id"]);
    await queryInterface.addIndex("model_risks", ["model_id"]);
    await queryInterface.addIndex("model_risks", ["created_at"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("model_risks");
  },
};