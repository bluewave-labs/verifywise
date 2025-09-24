"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "slack_webhooks",
        "routing_type",
        {
          type: Sequelize.DataTypes.ARRAY(
            Sequelize.DataTypes.ENUM(
              "Membership and roles",
              "Policy reminders and status",
              "Evidence and task alerts",
              "Control or policy changes",
            ),
          ),
        },
        { transaction },
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn("slack_webhooks", "routing_type", {
        transaction,
      });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
