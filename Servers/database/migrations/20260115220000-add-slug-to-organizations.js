'use strict';

/**
 * Migration: Add slug column to organizations table
 *
 * This column stores a URL-friendly identifier for organizations.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Check if column already exists
      const [columns] = await queryInterface.sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'organizations'
        AND column_name = 'slug';
      `, { transaction, type: Sequelize.QueryTypes.SELECT });

      if (columns) {
        console.log('slug column already exists in organizations table, skipping');
        await transaction.commit();
        return;
      }

      // Add slug column
      await queryInterface.sequelize.query(`
        ALTER TABLE public.organizations
        ADD COLUMN slug VARCHAR(50) UNIQUE;
      `, { transaction });

      await transaction.commit();
      console.log('Successfully added slug column to organizations table');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE public.organizations
        DROP COLUMN IF EXISTS slug;
      `, { transaction });

      await transaction.commit();
      console.log('Successfully removed slug column from organizations table');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
