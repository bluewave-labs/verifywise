'use strict';

/**
 * Migration to fix NIST AI RMF status ENUM with missing status values
 *
 * The original NIST AI RMF migration only had 5 status values, but the system
 * tries to use "Awaiting approval" which doesn't exist in the ENUM. This causes
 * errors when inserting mock data or updating subcategories.
 *
 * This migration:
 * 1. Drops the old ENUM (with CASCADE to handle dependencies)
 * 2. Recreates the ENUM with all required status values matching ISO 42001 pattern
 * 3. Ensures compatibility with the STATUSES type definition
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('[NIST AI RMF] Fixing status ENUM with missing values...');

      // Step 1: Drop the old ENUM (CASCADE will drop dependent columns)
      console.log('[NIST AI RMF] Dropping old status ENUM...');
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_nist_ai_rmf_subcategories_status CASCADE;
      `, { transaction });

      // Step 2: Recreate the ENUM with all required status values
      console.log('[NIST AI RMF] Creating complete status ENUM...');
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_nist_ai_rmf_subcategories_status AS ENUM (
          'Not started',
          'Draft',
          'In progress',
          'Awaiting review',
          'Awaiting approval',
          'Implemented',
          'Needs rework',
          'Audited'
        );
      `, { transaction });

      await transaction.commit();
      console.log('✅ [NIST AI RMF] Status ENUM fixed successfully with 8 values');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ [NIST AI RMF] Failed to fix status ENUM:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('[NIST AI RMF] Reverting status ENUM to original state...');

      // Drop the complete ENUM
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_nist_ai_rmf_subcategories_status CASCADE;
      `, { transaction });

      // Recreate the original limited ENUM
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_nist_ai_rmf_subcategories_status AS ENUM (
          'Not started',
          'In progress',
          'Implemented',
          'Needs rework',
          'Audited'
        );
      `, { transaction });

      await transaction.commit();
      console.log('✅ [NIST AI RMF] Status ENUM reverted to original state');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ [NIST AI RMF] Failed to revert status ENUM:', error);
      throw error;
    }
  }
};