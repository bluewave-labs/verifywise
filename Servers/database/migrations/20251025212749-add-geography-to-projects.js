'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add geography column to public.projects table
      await queryInterface.addColumn('projects', 'geography', {
        type: Sequelize.INTEGER,
        allowNull: true, // Allow null initially for existing records
        defaultValue: 1, // Default value for new records
      }, { transaction });

      // Update existing records to have a default geography value
      await queryInterface.sequelize.query(
        `UPDATE public.projects SET geography = 1 WHERE geography IS NULL;`,
        { transaction }
      );

      // Make the column NOT NULL after updating existing records
      await queryInterface.changeColumn('projects', 'geography', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove geography column from public.projects table
      await queryInterface.removeColumn('projects', 'geography', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};