"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("slack_webhooks", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      access_token: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      access_token_iv: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      scope: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      team_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      team_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      channel: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      channel_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      configuration_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      url_iv: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("slack_webhooks", ["team_id"]);
    await queryInterface.addIndex("slack_webhooks", ["channel_id"]);
    await queryInterface.addIndex("slack_webhooks", ["is_active"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("slack_webhooks");
  },
};
