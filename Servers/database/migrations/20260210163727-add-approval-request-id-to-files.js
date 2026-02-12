'use strict';

/**
 * Migration to add approval_request_id column to files table.
 *
 * This allows tracking which approval request is associated with a file
 * so that when the file is deleted, we can automatically reject the approval request.
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
            AND column_name = 'approval_request_id'
          );`,
          {
            transaction,
            replacements: { schema: tenantHash }
          }
        );

        if (!columnExists[0].exists) {
          // Add approval_request_id column
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files
             ADD COLUMN approval_request_id INTEGER
             REFERENCES "${tenantHash}".approval_requests(id) ON DELETE SET NULL;`,
            { transaction }
          );
          console.log(`Added approval_request_id column to ${tenantHash}.files`);

          // Create index for better query performance
          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_files_approval_request_id
             ON "${tenantHash}".files(approval_request_id);`,
            { transaction }
          );
          console.log(`Created index for approval_request_id on ${tenantHash}.files`);
        } else {
          console.log(`Column approval_request_id already exists in ${tenantHash}.files`);
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

        // Drop index first
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}".idx_files_approval_request_id;`,
          { transaction }
        );

        // Drop column
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".files
           DROP COLUMN IF EXISTS approval_request_id;`,
          { transaction }
        );

        console.log(`Removed approval_request_id column from ${tenantHash}.files`);
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
