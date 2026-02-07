'use strict';

/**
 * Migration to add 'superseded' to the review_status CHECK constraint on files table.
 * Drops and recreates the chk_review_status constraint with the new value.
 */

function validateTenantHash(hash) {
  if (!hash || typeof hash !== 'string') {
    throw new Error('Invalid tenant hash: must be a non-empty string');
  }
  if (!/^_[a-f0-9]+$/i.test(hash)) {
    throw new Error(`Invalid tenant hash format: ${hash}`);
  }
  return hash;
}

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
        const tenantHash = validateTenantHash(getTenantHash(organization.id));

        // Check if files table exists
        const [tableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = :schema
            AND table_name = 'files'
          );`,
          {
            transaction,
            replacements: { schema: tenantHash }
          }
        );

        if (!tableExists[0].exists) {
          console.log(`Skipping tenant ${tenantHash}: files table does not exist`);
          continue;
        }

        // Drop existing constraint
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".files DROP CONSTRAINT IF EXISTS chk_review_status;`,
          { transaction }
        );

        // Recreate with 'superseded' added
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".files ADD CONSTRAINT chk_review_status
           CHECK (review_status IN ('draft', 'pending_review', 'approved', 'rejected', 'expired', 'superseded'));`,
          { transaction }
        );

        console.log(`Updated chk_review_status constraint for ${tenantHash}.files`);
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
        const tenantHash = validateTenantHash(getTenantHash(organization.id));

        // Drop constraint with 'superseded'
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".files DROP CONSTRAINT IF EXISTS chk_review_status;`,
          { transaction }
        );

        // Recreate without 'superseded'
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".files ADD CONSTRAINT chk_review_status
           CHECK (review_status IN ('draft', 'pending_review', 'approved', 'rejected', 'expired'));`,
          { transaction }
        );

        console.log(`Reverted chk_review_status constraint for ${tenantHash}.files`);
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
