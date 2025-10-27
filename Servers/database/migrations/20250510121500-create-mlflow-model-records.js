'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mlflow_model_records', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      model_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      version: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lifecycle_stage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      run_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      source: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tags: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      metrics: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      parameters: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      experiment_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      experiment_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      artifact_location: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      training_status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      training_started_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      training_ended_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      source_version: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      model_created_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      model_updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_synced_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('mlflow_model_records', {
      fields: ['organization_id', 'model_name', 'version'],
      type: 'unique',
      name: 'mlflow_model_records_org_model_version_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      'mlflow_model_records',
      'mlflow_model_records_org_model_version_unique',
    );
    await queryInterface.dropTable('mlflow_model_records');
  },
};
