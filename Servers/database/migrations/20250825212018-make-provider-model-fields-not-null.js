"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Update any remaining NULL values with placeholder data
    await queryInterface.sequelize.query(`
      UPDATE model_inventories 
      SET 
        provider = COALESCE(provider, 'Unknown Provider'),
        model = COALESCE(model, 'Unknown Model')
      WHERE provider IS NULL OR model IS NULL;
    `);

    // Now make the columns NOT NULL
    await queryInterface.changeColumn("model_inventories", "provider", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn("model_inventories", "model", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Make the columns nullable again
    await queryInterface.changeColumn("model_inventories", "provider", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn("model_inventories", "model", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};