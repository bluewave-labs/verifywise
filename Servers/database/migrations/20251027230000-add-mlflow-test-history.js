"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("mlflow_integrations", "last_successful_test_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("mlflow_integrations", "last_failed_test_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("mlflow_integrations", "last_failed_test_message", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(
      "mlflow_integrations",
      "last_successful_test_at",
    );
    await queryInterface.removeColumn(
      "mlflow_integrations",
      "last_failed_test_at",
    );
    await queryInterface.removeColumn(
      "mlflow_integrations",
      "last_failed_test_message",
    );
  },
};
