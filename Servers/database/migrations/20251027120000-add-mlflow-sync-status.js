"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("mlflow_integrations", "last_synced_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn(
      "mlflow_integrations",
      "last_sync_status",
      {
        type: Sequelize.ENUM("success", "partial", "error"),
        allowNull: true,
      },
    );
    await queryInterface.addColumn(
      "mlflow_integrations",
      "last_sync_message",
      {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "mlflow_integrations",
      "last_sync_message",
    );
    await queryInterface.removeColumn("mlflow_integrations", "last_sync_status");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_mlflow_integrations_last_sync_status";',
    );
    await queryInterface.removeColumn("mlflow_integrations", "last_synced_at");
  },
};
