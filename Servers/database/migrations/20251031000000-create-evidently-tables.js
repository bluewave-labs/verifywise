"use strict";

const { DataTypes } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Create evidently_configs table
      await queryInterface.createTable("evidently_configs", {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
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
        organization_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "organizations",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        evidently_url: {
          type: Sequelize.STRING(255),
          allowNull: false,
          defaultValue: "https://app.evidently.cloud",
        },
        api_token_encrypted: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        api_token_iv: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        is_configured: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        last_test_date: {
          type: Sequelize.DATE,
          allowNull: true,
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
      }, { transaction });

      // Add unique constraint - one config per organization
      await queryInterface.addIndex("evidently_configs", ["organization_id"], {
        unique: true,
        name: "evidently_configs_organization_id_unique",
        transaction,
      });

      // Add index on user_id for queries
      await queryInterface.addIndex("evidently_configs", ["user_id"], {
        name: "evidently_configs_user_id_idx",
        transaction,
      });

      // 2. Create evidently_models table
      await queryInterface.createTable("evidently_models", {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        organization_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "organizations",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        project_id: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        project_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        model_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        last_sync_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        drift_status: {
          type: Sequelize.ENUM("healthy", "warning", "critical", "unknown"),
          allowNull: false,
          defaultValue: "unknown",
        },
        performance_status: {
          type: Sequelize.ENUM("healthy", "warning", "critical", "unknown"),
          allowNull: false,
          defaultValue: "unknown",
        },
        fairness_status: {
          type: Sequelize.ENUM("healthy", "warning", "critical", "unknown"),
          allowNull: false,
          defaultValue: "unknown",
        },
        metrics_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
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
      }, { transaction });

      // Add indexes for better query performance
      await queryInterface.addIndex("evidently_models", ["organization_id"], {
        name: "evidently_models_organization_id_idx",
        transaction,
      });

      await queryInterface.addIndex("evidently_models", ["project_id"], {
        name: "evidently_models_project_id_idx",
        transaction,
      });

      await queryInterface.addIndex("evidently_models", ["drift_status"], {
        name: "evidently_models_drift_status_idx",
        transaction,
      });

      await queryInterface.addIndex("evidently_models", ["last_sync_at"], {
        name: "evidently_models_last_sync_at_idx",
        transaction,
      });

      // Add unique constraint - one record per organization + project_id
      await queryInterface.addIndex("evidently_models", ["organization_id", "project_id"], {
        unique: true,
        name: "evidently_models_organization_project_unique",
        transaction,
      });

      // 3. Create evidently_metrics table (for caching metrics)
      await queryInterface.createTable("evidently_metrics", {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        model_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "evidently_models",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        metric_type: {
          type: Sequelize.ENUM("drift", "performance", "fairness"),
          allowNull: false,
        },
        metric_data: {
          type: Sequelize.JSONB,
          allowNull: false,
        },
        captured_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      }, { transaction });

      // Add indexes for metrics table
      await queryInterface.addIndex("evidently_metrics", ["model_id"], {
        name: "evidently_metrics_model_id_idx",
        transaction,
      });

      await queryInterface.addIndex("evidently_metrics", ["metric_type"], {
        name: "evidently_metrics_metric_type_idx",
        transaction,
      });

      await queryInterface.addIndex("evidently_metrics", ["captured_at"], {
        name: "evidently_metrics_captured_at_idx",
        transaction,
      });

      // Add composite index for common query pattern
      await queryInterface.addIndex("evidently_metrics", ["model_id", "metric_type", "captured_at"], {
        name: "evidently_metrics_model_type_date_idx",
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Drop tables in reverse order (respecting foreign keys)
      await queryInterface.dropTable("evidently_metrics", { transaction });
      await queryInterface.dropTable("evidently_models", { transaction });
      await queryInterface.dropTable("evidently_configs", { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
