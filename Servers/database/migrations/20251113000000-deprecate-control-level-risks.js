'use strict';

/**
 * Migration: Deprecate control-level risks in controls_eu__risks table
 *
 * Context: As of November 2025, control-level risk associations have been removed
 * from the EU AI Act controls modal. Risk associations are now managed exclusively
 * at the subcontrol level. This migration adds a table comment to document this
 * deprecation for future reference.
 *
 * Impact:
 * - Existing data in controls_eu__risks remains in database but is not used
 * - No code reads from or writes to this table anymore
 * - Consider cleanup in future migration if/when subcontrol risks are implemented
 *
 * Note: The controls_eu__risks table is created in tenant-specific schemas
 * (e.g., "a4ayc80OGd".controls_eu__risks), not in the public schema.
 * This migration checks all schemas and adds deprecation comments where the table exists.
 *
 * Related: Commit 8d492d50d - "Simplify EU AI Act controls modal"
 */

const { getTenantHash } = require("../../dist/tools/getTenantHash");

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Get all organizations to check their tenant schemas
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`
      );

      if (organizations.length === 0) {
        console.log('⊘ No organizations found, skipping deprecation comment');
        return;
      }

      let tablesFound = 0;

      // Check each organization's tenant schema
      for (const org of organizations) {
        const tenantHash = getTenantHash(org.id);

        // Check if table exists in this tenant schema
        const [results] = await queryInterface.sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'controls_eu__risks'
          );
        `);

        if (results[0].exists) {
          // Add deprecation comment to the table
          await queryInterface.sequelize.query(`
            COMMENT ON TABLE "${tenantHash}".controls_eu__risks IS
            'DEPRECATED as of Nov 2025: Control-level risks removed. This table is no longer used.
             Risk associations are now managed at subcontrol level only.
             Existing data preserved for potential future migration or historical reference.';
          `);

          console.log(`✓ Added deprecation comment to "${tenantHash}".controls_eu__risks`);
          tablesFound++;
        }
      }

      if (tablesFound === 0) {
        console.log('⊘ Table controls_eu__risks does not exist in any tenant schema, skipping deprecation comment');
      }
    } catch (error) {
      // If getTenantHash is not available or other errors, skip gracefully
      console.log('⊘ Unable to add deprecation comment (tenant schema functionality may not be available)');
      console.log('   This is expected for fresh databases or development environments');
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Get all organizations to check their tenant schemas
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`
      );

      if (organizations.length === 0) {
        console.log('⊘ No organizations found, skipping comment removal');
        return;
      }

      let tablesFound = 0;

      // Check each organization's tenant schema
      for (const org of organizations) {
        const tenantHash = getTenantHash(org.id);

        // Check if table exists in this tenant schema
        const [results] = await queryInterface.sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'controls_eu__risks'
          );
        `);

        if (results[0].exists) {
          // Remove deprecation comment
          await queryInterface.sequelize.query(`
            COMMENT ON TABLE "${tenantHash}".controls_eu__risks IS NULL;
          `);

          console.log(`✓ Removed deprecation comment from "${tenantHash}".controls_eu__risks`);
          tablesFound++;
        }
      }

      if (tablesFound === 0) {
        console.log('⊘ Table controls_eu__risks does not exist in any tenant schema, skipping comment removal');
      }
    } catch (error) {
      console.log('⊘ Unable to remove deprecation comment');
    }
  }
};
