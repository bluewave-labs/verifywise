'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration: Add finding_type index to ai_detection_findings table
 *
 * Adds an index on the finding_type column to improve query performance
 * when filtering findings by type (library, dependency, api_call, secret, etc.)
 *
 * @type {import('sequelize-cli').Migration}
 */

const logger = {
  info: (msg) => console.log(`[MIGRATION-INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg, error) => console.error(`[MIGRATION-ERROR] ${new Date().toISOString()} - ${msg}`, error ? error.stack || error : ''),
  success: (msg) => console.log(`[MIGRATION-SUCCESS] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[MIGRATION-WARN] ${new Date().toISOString()} - ${msg}`)
};

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      logger.info('Starting finding_type index migration');

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      if (organizations[0].length === 0) {
        logger.warn('No organizations found. Skipping.');
        await transaction.commit();
        return;
      }

      logger.info(`Processing ${organizations[0].length} tenant schemas`);

      let successCount = 0;
      let errorCount = 0;

      for (let organization of organizations[0]) {
        try {
          const tenantHash = getTenantHash(organization.id);
          logger.info(`Processing tenant: ${tenantHash}`);

          // Check if table exists
          const [tableExists] = await queryInterface.sequelize.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
              AND table_name = 'ai_detection_findings'
          `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

          if (!tableExists) {
            logger.info(`ai_detection_findings table does not exist for tenant ${tenantHash}, skipping`);
            successCount++;
            continue;
          }

          // Check if index already exists
          const [indexExists] = await queryInterface.sequelize.query(`
            SELECT 1 FROM pg_indexes
            WHERE schemaname = '${tenantHash}'
              AND tablename = 'ai_detection_findings'
              AND indexname = '${tenantHash}_ai_findings_finding_type_idx'
          `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

          if (indexExists) {
            logger.info(`finding_type index already exists for tenant ${tenantHash}, skipping`);
            successCount++;
            continue;
          }

          // Create index on finding_type
          await queryInterface.sequelize.query(`
            CREATE INDEX "${tenantHash}_ai_findings_finding_type_idx"
            ON "${tenantHash}".ai_detection_findings(finding_type);
          `, { transaction });

          successCount++;
          logger.success(`Added finding_type index for tenant: ${tenantHash}`);

        } catch (tenantError) {
          errorCount++;
          logger.error(`Failed to process tenant for org_id ${organization.id}:`, tenantError);
        }
      }

      await transaction.commit();
      logger.success(`Migration completed. Success: ${successCount}, Errors: ${errorCount}`);

    } catch (error) {
      await transaction.rollback();
      logger.error('Migration failed and was rolled back:', error);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      logger.info('Rolling back finding_type index migration');

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        logger.info(`Removing finding_type index from tenant: ${tenantHash}`);

        await queryInterface.sequelize.query(`
          DROP INDEX IF EXISTS "${tenantHash}"."${tenantHash}_ai_findings_finding_type_idx";
        `, { transaction });
      }

      await transaction.commit();
      logger.success('Rollback completed');
    } catch (error) {
      await transaction.rollback();
      logger.error('Rollback failed:', error);
      throw error;
    }
  }
};
