'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add "Subcategories group" to the enum_files_source enum for NIST AI RMF
    await queryInterface.sequelize.query(`
      ALTER TYPE public.enum_files_source ADD VALUE 'Subcategories group';
    `);

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
        }
      } catch (error) {
        console.error(`❌ Error updating tenant ${tenant}:`, error);
      }
    }
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
        // Check if the table and column exist
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
      } catch (error) {
        console.error(`❌ Error updating tenant ${tenant}:`, error);
      }
    }
  }
};