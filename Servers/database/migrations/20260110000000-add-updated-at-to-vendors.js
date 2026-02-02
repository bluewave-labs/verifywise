'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if column already exists
      const columnExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'vendors'
          AND column_name = 'updated_at'
        )`,
        {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      if (!columnExists[0].exists) {
        await queryInterface.addColumn('vendors', 'updated_at', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        }, { transaction });

        // Set updated_at to created_at for existing records (overwrite default NOW() value)
        await queryInterface.sequelize.query(
          `UPDATE vendors SET updated_at = COALESCE(created_at, NOW());`,
          { transaction }
        );
      } else {
        console.log('Column updated_at already exists in vendors table, skipping');
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if column exists before removing
      const columnExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'vendors'
          AND column_name = 'updated_at'
        )`,
        {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      if (columnExists[0].exists) {
        await queryInterface.removeColumn('vendors', 'updated_at', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
