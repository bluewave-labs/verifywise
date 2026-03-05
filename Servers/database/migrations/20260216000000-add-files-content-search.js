'use strict';

/**
 * Add content_text (plain text) and content_search (tsvector) columns
 * plus a GIN index on content_search to the tenant-specific files table.
 *
 * Follows the same multi-tenant pattern as other migrations:
 * - Iterate all organizations
 * - Derive tenant schema via getTenantHash
 * - Check that files table exists
 * - Add columns / index if missing
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require('../../dist/tools/getTenantHash');

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Ensure files table exists for this tenant
        const [tableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
             SELECT FROM information_schema.tables
             WHERE table_schema = :schema
             AND table_name = 'files'
           );`,
          {
            transaction,
            replacements: { schema: tenantHash },
          }
        );

        if (!tableExists[0].exists) {
          console.log(
            `Skipping tenant ${tenantHash}: files table does not exist`
          );
          continue;
        }

        // Add content_text column if missing
        const [contentTextExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
             SELECT FROM information_schema.columns
             WHERE table_schema = :schema
             AND table_name = 'files'
             AND column_name = 'content_text'
           );`,
          {
            transaction,
            replacements: { schema: tenantHash },
          }
        );

        if (!contentTextExists[0].exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files ADD COLUMN content_text TEXT;`,
            { transaction }
          );
          console.log(`Added content_text column to ${tenantHash}.files`);
        }

        // Add content_search column if missing
        const [contentSearchExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
             SELECT FROM information_schema.columns
             WHERE table_schema = :schema
             AND table_name = 'files'
             AND column_name = 'content_search'
           );`,
          {
            transaction,
            replacements: { schema: tenantHash },
          }
        );

        if (!contentSearchExists[0].exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files ADD COLUMN content_search tsvector;`,
            { transaction }
          );
          console.log(`Added content_search column to ${tenantHash}.files`);
        }

        // Create GIN index on content_search if missing
        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS idx_files_content_search
             ON "${tenantHash}".files
             USING GIN(content_search);`,
          { transaction }
        );
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
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require('../../dist/tools/getTenantHash');

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        const [tableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
             SELECT FROM information_schema.tables
             WHERE table_schema = :schema
             AND table_name = 'files'
           );`,
          {
            transaction,
            replacements: { schema: tenantHash },
          }
        );

        if (!tableExists[0].exists) {
          continue;
        }

        // Drop index (IF EXISTS to be safe)
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}".idx_files_content_search;`,
          { transaction }
        );

        // Drop columns (IF EXISTS is not supported for DROP COLUMN in all PG versions,
        // so check existence first like in up()).
        const [contentTextExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
             SELECT FROM information_schema.columns
             WHERE table_schema = :schema
             AND table_name = 'files'
             AND column_name = 'content_text'
           );`,
          {
            transaction,
            replacements: { schema: tenantHash },
          }
        );

        if (contentTextExists[0].exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files DROP COLUMN content_text;`,
            { transaction }
          );
        }

        const [contentSearchExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
             SELECT FROM information_schema.columns
             WHERE table_schema = :schema
             AND table_name = 'files'
             AND column_name = 'content_search'
           );`,
          {
            transaction,
            replacements: { schema: tenantHash },
          }
        );

        if (contentSearchExists[0].exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".files DROP COLUMN content_search;`,
            { transaction }
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};

