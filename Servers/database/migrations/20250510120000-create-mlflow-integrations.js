'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mlflow_integrations', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'organizations',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      tracking_server_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      auth_method: {
        type: Sequelize.ENUM('none', 'basic', 'token'),
        allowNull: false,
        defaultValue: 'none',
      },
      username: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      username_iv: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      password_iv: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      api_token: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      api_token_iv: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      verify_ssl: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      timeout: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30,
      },
      last_tested_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_test_status: {
        type: Sequelize.ENUM('success', 'error'),
        allowNull: true,
      },
      last_test_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('mlflow_integrations');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_mlflow_integrations_auth_method";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_mlflow_integrations_last_test_status";',
    );
  },
};
