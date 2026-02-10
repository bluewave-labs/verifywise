'use strict';

/**
 * Migration to add review_status and review_comment columns to policy_manager table.
 * Supports the policy review workflow (request/approve/reject).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Check if policy_manager table exists
        const [tableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = :schema
            AND table_name = 'policy_manager'
          );`,
          {
            transaction,
            replacements: { schema: tenantHash }
          }
        );

        if (!tableExists[0].exists) {
          console.log(`Skipping tenant ${tenantHash}: policy_manager table does not exist`);
          continue;
        }

        // Check if column already exists
        const [columnExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = :schema
            AND table_name = 'policy_manager'
            AND column_name = 'review_status'
          );`,
          {
            transaction,
            replacements: { schema: tenantHash }
          }
        );

        if (columnExists[0].exists) {
          console.log(`Skipping tenant ${tenantHash}: review_status column already exists`);
          continue;
        }

        // Add review_status column
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".policy_manager
           ADD COLUMN review_status VARCHAR(50) DEFAULT NULL;`,
          { transaction }
        );

        // Add review_comment column
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".policy_manager
           ADD COLUMN review_comment TEXT DEFAULT NULL;`,
          { transaction }
        );

        // Add reviewed_by column
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".policy_manager
           ADD COLUMN reviewed_by INTEGER DEFAULT NULL REFERENCES public.users(id) ON DELETE SET NULL;`,
          { transaction }
        );

        // Add reviewed_at column
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".policy_manager
           ADD COLUMN reviewed_at TIMESTAMP DEFAULT NULL;`,
          { transaction }
        );

        console.log(`Added review columns to ${tenantHash}.policy_manager`);
      }

      await transaction.commit();
      console.log('Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".policy_manager
           DROP COLUMN IF EXISTS review_status,
           DROP COLUMN IF EXISTS review_comment,
           DROP COLUMN IF EXISTS reviewed_by,
           DROP COLUMN IF EXISTS reviewed_at;`,
          { transaction }
        );

        console.log(`Removed review columns from ${tenantHash}.policy_manager`);
      }

      await transaction.commit();
      console.log('Rollback completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
