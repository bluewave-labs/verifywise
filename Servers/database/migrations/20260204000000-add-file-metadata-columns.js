'use strict';

/**
 * Migration to add metadata columns to files table for enhanced file management.
 * Adds: tags, review_status, version, expiry_date, last_modified_by
 *
 * Uses VARCHAR with CHECK constraint instead of ENUM for multi-tenant compatibility.
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

        // Check if files table exists
        const [tableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'files'
          );`,
          { transaction }
        );

        if (!tableExists[0].exists) {
          console.log(`Skipping tenant ${tenantHash}: files table does not exist`);
          continue;
        }

        // Add tags column (JSONB for flexible tag storage)
        const [tagsExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'files'
            AND column_name = 'tags'
          );`,
          { transaction }
        );

        if (!tagsExists[0].exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;`,
            { transaction }
          );
          console.log(`Added tags column to ${tenantHash}.files`);
        }

        // Add review_status column (VARCHAR with CHECK constraint for multi-tenant compatibility)
        const [reviewStatusExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'files'
            AND column_name = 'review_status'
          );`,
          { transaction }
        );

        if (!reviewStatusExists[0].exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files ADD COLUMN review_status VARCHAR(20) DEFAULT 'draft';`,
            { transaction }
          );
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files ADD CONSTRAINT chk_review_status
             CHECK (review_status IN ('draft', 'pending_review', 'approved', 'rejected', 'expired'));`,
            { transaction }
          );
          console.log(`Added review_status column to ${tenantHash}.files`);
        }

        // Add version column (semver format)
        const [versionExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'files'
            AND column_name = 'version'
          );`,
          { transaction }
        );

        if (!versionExists[0].exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files ADD COLUMN version VARCHAR(20) DEFAULT '1.0';`,
            { transaction }
          );
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files ADD CONSTRAINT chk_version_format
             CHECK (version ~ '^[0-9]+\\.[0-9]+(\\.[0-9]+)?$');`,
            { transaction }
          );
          console.log(`Added version column to ${tenantHash}.files`);
        }

        // Add expiry_date column
        const [expiryDateExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'files'
            AND column_name = 'expiry_date'
          );`,
          { transaction }
        );

        if (!expiryDateExists[0].exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files ADD COLUMN expiry_date DATE;`,
            { transaction }
          );
          console.log(`Added expiry_date column to ${tenantHash}.files`);
        }

        // Add last_modified_by column (FK to users)
        const [lastModifiedByExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'files'
            AND column_name = 'last_modified_by'
          );`,
          { transaction }
        );

        if (!lastModifiedByExists[0].exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files ADD COLUMN last_modified_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL;`,
            { transaction }
          );
          console.log(`Added last_modified_by column to ${tenantHash}.files`);
        }

        // Add description column for file metadata
        const [descriptionExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'files'
            AND column_name = 'description'
          );`,
          { transaction }
        );

        if (!descriptionExists[0].exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files ADD COLUMN description TEXT;`,
            { transaction }
          );
          console.log(`Added description column to ${tenantHash}.files`);
        }

        // Create indexes for better query performance
        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS idx_files_review_status ON "${tenantHash}".files(review_status);`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS idx_files_expiry_date ON "${tenantHash}".files(expiry_date);`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS idx_files_tags ON "${tenantHash}".files USING GIN(tags);`,
          { transaction }
        );

        console.log(`Created indexes for ${tenantHash}.files`);
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

        // Drop indexes first
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}".idx_files_review_status;`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}".idx_files_expiry_date;`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}".idx_files_tags;`,
          { transaction }
        );

        // Drop constraints
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".files DROP CONSTRAINT IF EXISTS chk_review_status;`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".files DROP CONSTRAINT IF EXISTS chk_version_format;`,
          { transaction }
        );

        // Drop columns
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".files
           DROP COLUMN IF EXISTS tags,
           DROP COLUMN IF EXISTS review_status,
           DROP COLUMN IF EXISTS version,
           DROP COLUMN IF EXISTS expiry_date,
           DROP COLUMN IF EXISTS last_modified_by,
           DROP COLUMN IF EXISTS description;`,
          { transaction }
        );

        console.log(`Removed metadata columns from ${tenantHash}.files`);
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
