'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add "Subcategories group" to the enum_files_source enum for NIST AI RMF
    await queryInterface.sequelize.query(`
      ALTER TYPE public.enum_files_source ADD VALUE 'Subcategories group';
    `);

    console.log('🔧 Starting NIST AI RMF schema enhancements and status standardization...');

    // Get all tenant schemas
    const tenantSchemas = await queryInterface.sequelize.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
      AND schema_name NOT LIKE 'pg_temp_%'
      AND schema_name NOT LIKE 'pg_toast_temp_%'
      ORDER BY schema_name;
    `);

    const tenants = tenantSchemas[0].map(row => row.schema_name);

    // Add implementation_description column to each tenant's nist_ai_rmf_subcategories table
    for (const tenant of tenants) {
      try {
        // Check if the table exists in the tenant schema
        const tableExists = await queryInterface.sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenant}'
            AND table_name = 'nist_ai_rmf_subcategories'
          );
        `);

        if (tableExists[0][0].exists) {
          // Check if the column already exists
          const columnExists = await queryInterface.sequelize.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns
              WHERE table_schema = '${tenant}'
              AND table_name = 'nist_ai_rmf_subcategories'
              AND column_name = 'implementation_description'
            );
          `);

          if (!columnExists[0][0].exists) {
            await queryInterface.sequelize.query(`
              ALTER TABLE "${tenant}".nist_ai_rmf_subcategories
              ADD COLUMN implementation_description TEXT;
            `);
            console.log(`✅ Added implementation_description column to ${tenant}.nist_ai_rmf_subcategories`);
          } else {
            console.log(`⚠️  implementation_description column already exists in ${tenant}.nist_ai_rmf_subcategories`);
          }

          // Clean up inconsistent status values to match the standardized status options
          const statusUpdates = [
            { old: 'Audited', new: 'Implemented' },
            { old: 'Requires attention', new: 'Needs rework' },
            { old: 'Not Applicable', new: 'Not started' }
          ];

          for (const { old, new: newStatus } of statusUpdates) {
            const result = await queryInterface.sequelize.query(`
              UPDATE "${tenant}".nist_ai_rmf_subcategories
              SET status = :newStatus
              WHERE status = :oldStatus
              RETURNING id, status;
            `, {
              replacements: { oldStatus: old, newStatus: newStatus }
            });

            const updatedCount = result[0].length;
            if (updatedCount > 0) {
              console.log(`✅ Updated ${updatedCount} records in ${tenant}.nist_ai_rmf_subcategories: '${old}' → '${newStatus}'`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error updating tenant ${tenant}:`, error);
      }
    }

    console.log('✅ NIST AI RMF schema enhancements and status standardization completed successfully!');
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This is handled by the fact that enum values are rarely removed
    // and the presence of the value won't break existing functionality

    // Get all tenant schemas
    const tenantSchemas = await queryInterface.sequelize.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
      AND schema_name NOT LIKE 'pg_temp_%'
      AND schema_name NOT LIKE 'pg_toast_temp_%'
      ORDER BY schema_name;
    `);

    const tenants = tenantSchemas[0].map(row => row.schema_name);

    // Remove implementation_description column from each tenant's nist_ai_rmf_subcategories table
    for (const tenant of tenants) {
      try {
        // Check if the table exists
        const tableExists = await queryInterface.sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenant}'
            AND table_name = 'nist_ai_rmf_subcategories'
          );
        `);

        if (tableExists[0][0].exists) {
          // Check if the column exists
          const columnExists = await queryInterface.sequelize.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns
              WHERE table_schema = '${tenant}'
              AND table_name = 'nist_ai_rmf_subcategories'
              AND column_name = 'implementation_description'
            );
          `);

          if (columnExists[0][0].exists) {
            await queryInterface.sequelize.query(`
              ALTER TABLE "${tenant}".nist_ai_rmf_subcategories
              DROP COLUMN implementation_description;
            `);
            console.log(`✅ Removed implementation_description column from ${tenant}.nist_ai_rmf_subcategories`);
          }

          // Note: We don't revert status changes in the down migration
          // because:
          // 1. Status standardization should be permanent
          // 2. Reverting could break existing functionality
          // 3. The old status values are no longer supported by the frontend
          console.log(`ℹ️  Status standardization retained for ${tenant}.nist_ai_rmf_subcategories`);
        }
      } catch (error) {
        console.error(`❌ Error updating tenant ${tenant}:`, error);
      }
    }
  }
};