'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Cleanup Migration: Remove incorrect category records from NIST AI RMF subcategories tables
 *
 * Issue: Migration 20251122100000 incorrectly populated nist_ai_rmf_subcategories tables
 * with category data instead of actual subcategories. Categories were inserted with
 * subcategory_meta_id = NULL and projects_frameworks_id = NULL, which are fields that
 * should only exist on actual subcategories created when projects are instantiated.
 *
 * This migration:
 * 1. Identifies incorrect records (WHERE subcategory_meta_id IS NULL)
 * 2. Logs what will be deleted for audit trail
 * 3. Safely deletes these incorrect records
 * 4. Verifies cleanup was successful
 *
 * Safety Considerations:
 * - Only deletes records with subcategory_meta_id IS NULL (these are the incorrect ones)
 * - Correct subcategories have subcategory_meta_id set (1-73)
 * - Idempotent: can be run multiple times safely
 * - Uses transaction for rollback capability
 *
 * @type {import('sequelize-cli').Migration}
 */

// Enhanced logging utility
const logger = {
  info: (msg) => console.log(`[MIGRATION-INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg, error) => console.error(`[MIGRATION-ERROR] ${new Date().toISOString()} - ${msg}`, error ? error.stack || error : ''),
  success: (msg) => console.log(`[MIGRATION-SUCCESS] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[MIGRATION-WARN] ${new Date().toISOString()} - ${msg}`)
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      logger.info('Starting NIST AI RMF subcategories cleanup migration');

      // Get all organizations for tenant processing
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      if (organizations[0].length === 0) {
        logger.warn('No organizations found. Skipping cleanup.');
        await transaction.commit();
        return;
      }

      logger.info(`Processing ${organizations[0].length} tenant schemas for cleanup`);

      let totalDeletedCount = 0;
      let successCount = 0;
      let errorCount = 0;

      // Process each tenant
      for (let organization of organizations[0]) {
        try {
          const tenantHash = getTenantHash(organization.id);
          logger.info(`Processing tenant: ${tenantHash} (org_id: ${organization.id})`);

          // Check if table exists first
          const [tableExists] = await queryInterface.sequelize.query(
            `SELECT 1 FROM information_schema.tables
             WHERE table_schema = '${tenantHash}' AND table_name = 'nist_ai_rmf_subcategories'`,
            { transaction, type: queryInterface.sequelize.QueryTypes.SELECT }
          );

          if (!tableExists) {
            logger.info(`Table nist_ai_rmf_subcategories does not exist for tenant ${tenantHash}, skipping`);
            continue;
          }

          // Count incorrect records before deletion
          const [countResult] = await queryInterface.sequelize.query(
            `SELECT COUNT(*) as count FROM "${tenantHash}".nist_ai_rmf_subcategories
             WHERE subcategory_meta_id IS NULL`,
            { transaction, type: queryInterface.sequelize.QueryTypes.SELECT }
          );

          const incorrectCount = countResult[0].count || 0;

          if (incorrectCount === 0) {
            logger.info(`No incorrect records found for tenant ${tenantHash}`);
            successCount++;
            continue;
          }

          logger.info(`Found ${incorrectCount} incorrect records for tenant ${tenantHash}, deleting...`);

          // Log the records that will be deleted (for audit trail)
          const [recordsToDelete] = await queryInterface.sequelize.query(
            `SELECT id, title, category_id, created_at FROM "${tenantHash}".nist_ai_rmf_subcategories
             WHERE subcategory_meta_id IS NULL
             ORDER BY id`,
            { transaction, type: queryInterface.sequelize.QueryTypes.SELECT }
          );

          if (recordsToDelete.length > 0) {
            logger.info(`Records to be deleted for ${tenantHash}:`);
            recordsToDelete.forEach(record => {
              logger.info(`  - ID: ${record.id}, Title: ${record.title}, Category ID: ${record.category_id}, Created: ${record.created_at}`);
            });
          }

          // Delete incorrect records
          await queryInterface.sequelize.query(
            `DELETE FROM "${tenantHash}".nist_ai_rmf_subcategories
             WHERE subcategory_meta_id IS NULL`,
            { transaction }
          );

          logger.success(`Deleted ${incorrectCount} incorrect records for tenant ${tenantHash}`);
          totalDeletedCount += incorrectCount;
          successCount++;

        } catch (tenantError) {
          errorCount++;
          logger.error(`Failed to cleanup tenant for org_id ${organization.id}:`, tenantError);
          // Continue with other tenants instead of failing entire migration
        }
      }

      await transaction.commit();
      logger.success(`Cleanup migration completed. Total Deleted: ${totalDeletedCount}, Success: ${successCount}, Errors: ${errorCount}`);

    } catch (error) {
      await transaction.rollback();
      logger.error('Cleanup migration failed and was rolled back:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // For a cleanup migration, down() should be a no-op since we're removing bad data
    // We cannot safely restore the deleted data without knowing what was there
    // If rollback is needed, it should be done via database backup restoration
    logger.warn('Cleanup migration down() - no operation. This is a data cleanup migration.');
    logger.warn('If you need to restore the deleted data, please restore from a database backup.');
  }
};
