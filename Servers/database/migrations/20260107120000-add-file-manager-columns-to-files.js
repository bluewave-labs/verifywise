'use strict';

/**
 * Migration to add file_manager columns to files table.
 * This must run before 20260107130000-migrate-file-manager-data-to-files.js
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Fetch all organizations
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

        // Add size column if it doesn't exist
        const [sizeExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'files'
            AND column_name = 'size'
          );`,
          { transaction }
        );

        if (!sizeExists[0].exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files ADD COLUMN size BIGINT;`,
            { transaction }
          );
          console.log(`Added size column to ${tenantHash}.files`);
        }

        // Add file_path column if it doesn't exist
        const [filePathExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'files'
            AND column_name = 'file_path'
          );`,
          { transaction }
        );

        if (!filePathExists[0].exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files ADD COLUMN file_path VARCHAR(500);`,
            { transaction }
          );
          console.log(`Added file_path column to ${tenantHash}.files`);
        }

        // Add org_id column if it doesn't exist
        const [orgIdExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'files'
            AND column_name = 'org_id'
          );`,
          { transaction }
        );

        if (!orgIdExists[0].exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files ADD COLUMN org_id INTEGER;`,
            { transaction }
          );
          console.log(`Added org_id column to ${tenantHash}.files`);
        }

        // Add model_id column if it doesn't exist
        const [modelIdExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'files'
            AND column_name = 'model_id'
          );`,
          { transaction }
        );

        if (!modelIdExists[0].exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files ADD COLUMN model_id INTEGER;`,
            { transaction }
          );
          console.log(`Added model_id column to ${tenantHash}.files`);
        }

        // Make content column nullable (file_manager stores files on disk, not in DB)
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".files ALTER COLUMN content DROP NOT NULL;`,
          { transaction }
        );
        console.log(`Made content column nullable in ${tenantHash}.files`);
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
          `ALTER TABLE "${tenantHash}".files
           DROP COLUMN IF EXISTS size,
           DROP COLUMN IF EXISTS file_path,
           DROP COLUMN IF EXISTS org_id,
           DROP COLUMN IF EXISTS model_id;`,
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
