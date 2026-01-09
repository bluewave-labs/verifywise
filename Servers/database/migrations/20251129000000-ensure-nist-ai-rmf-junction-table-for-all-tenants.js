'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration to ensure nist_ai_rmf_subcategories__risks junction table exists for all tenants
 * 
 * This migration fixes the issue where existing tenants are missing the junction table,
 * causing "relation does not exist" errors when trying to link risks to subcategories.
 * 
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔧 Ensuring nist_ai_rmf_subcategories__risks table exists for all tenants...');

      // Get all organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      if (organizations[0].length === 0) {
        console.log('⚠️  No organizations found. Skipping junction table creation.');
        await transaction.commit();
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const org of organizations[0]) {
        try {
          const tenantHash = getTenantHash(org.id);

          // Check if subcategories table exists (junction table depends on it)
          const subcategoriesTableExists = await queryInterface.sequelize.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = '${tenantHash}'
              AND table_name = 'nist_ai_rmf_subcategories'
            );`,
            { transaction, type: queryInterface.sequelize.QueryTypes.SELECT }
          );

          if (!subcategoriesTableExists[0].exists) {
            console.log(`⚠️  Skipping ${tenantHash}: nist_ai_rmf_subcategories table does not exist`);
            skippedCount++;
            continue;
          }

          // Check if junction table already exists
          const junctionTableExists = await queryInterface.sequelize.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = '${tenantHash}'
              AND table_name = 'nist_ai_rmf_subcategories__risks'
            );`,
            { transaction, type: queryInterface.sequelize.QueryTypes.SELECT }
          );

          if (junctionTableExists[0].exists) {
            console.log(`✓ Junction table already exists for tenant: ${tenantHash}`);
            skippedCount++;
            continue;
          }

          // Check if risks table exists (junction table depends on it)
          const risksTableExists = await queryInterface.sequelize.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = '${tenantHash}'
              AND table_name = 'risks'
            );`,
            { transaction, type: queryInterface.sequelize.QueryTypes.SELECT }
          );

          if (!risksTableExists[0].exists) {
            console.log(`⚠️  Skipping ${tenantHash}: risks table does not exist`);
            skippedCount++;
            continue;
          }

          // Create junction table
          await queryInterface.sequelize.query(
            `CREATE TABLE IF NOT EXISTS "${tenantHash}".nist_ai_rmf_subcategories__risks (
              nist_ai_rmf_subcategory_id INTEGER NOT NULL,
              projects_risks_id INTEGER NOT NULL,
              PRIMARY KEY (nist_ai_rmf_subcategory_id, projects_risks_id),
              FOREIGN KEY (nist_ai_rmf_subcategory_id)
                REFERENCES "${tenantHash}".nist_ai_rmf_subcategories(id)
                ON DELETE CASCADE ON UPDATE CASCADE,
              FOREIGN KEY (projects_risks_id)
                REFERENCES "${tenantHash}".risks(id)
                ON DELETE CASCADE ON UPDATE CASCADE
            );`,
            { transaction }
          );

          // Create indexes for better performance
          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS "${tenantHash}_nist_ai_rmf_subcategories__risks_subcategory_id_idx"
             ON "${tenantHash}".nist_ai_rmf_subcategories__risks (nist_ai_rmf_subcategory_id);`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS "${tenantHash}_nist_ai_rmf_subcategories__risks_projects_risks_id_idx"
             ON "${tenantHash}".nist_ai_rmf_subcategories__risks (projects_risks_id);`,
            { transaction }
          );

          console.log(`✅ Created nist_ai_rmf_subcategories__risks table for tenant: ${tenantHash}`);
          successCount++;

        } catch (tenantError) {
          errorCount++;
          console.error(`❌ Failed to create junction table for tenant (org_id: ${org.id}):`, tenantError.message);
          // Continue with other tenants instead of failing entire migration
        }
      }

      await transaction.commit();
      console.log(`✅ Migration completed. Success: ${successCount}, Errors: ${errorCount}, Skipped: ${skippedCount}`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed and was rolled back:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Note: We don't drop the junction table in down migration
    // because it might contain important data. If needed, use the
    // original migration's down method.
    console.log('ℹ️  Down migration skipped for safety. Use original migration to drop tables if needed.');
  }
};

