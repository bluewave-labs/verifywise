'use strict';

/**
 * Migration to add file_group_id UUID column to files table for version grouping.
 * Backfills existing rows with unique UUIDs.
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

        // Check if column already exists
        const [columnExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = :schema
            AND table_name = 'files'
            AND column_name = 'file_group_id'
          );`,
          {
            transaction,
            replacements: { schema: tenantHash }
          }
        );

        if (!columnExists[0].exists) {
          // Add file_group_id column
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files ADD COLUMN file_group_id UUID;`,
            { transaction }
          );

          // Backfill existing rows with unique UUIDs
          await queryInterface.sequelize.query(
            `UPDATE "${tenantHash}".files SET file_group_id = gen_random_uuid() WHERE file_group_id IS NULL;`,
            { transaction }
          );

          // Create index for efficient lookups
          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_files_file_group_id ON "${tenantHash}".files(file_group_id);`,
            { transaction }
          );

          console.log(`Added file_group_id column to ${tenantHash}.files`);
        }
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

        // Drop index
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}".idx_files_file_group_id;`,
          { transaction }
        );

        // Drop column
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".files DROP COLUMN IF EXISTS file_group_id;`,
          { transaction }
        );

        console.log(`Removed file_group_id column from ${tenantHash}.files`);
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
