'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration to add governance_status column to ai_detection_findings table
 *
 * This allows users to mark findings as:
 * - null (default, not reviewed)
 * - 'reviewed' (finding has been reviewed)
 * - 'approved' (finding is approved/accepted)
 * - 'flagged' (finding is flagged for action)
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
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      logger.info('Starting governance_status column migration');

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

          // Check if column already exists
          const [columnExists] = await queryInterface.sequelize.query(`
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = '${tenantHash}'
              AND table_name = 'ai_detection_findings'
              AND column_name = 'governance_status'
          `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

          if (columnExists) {
            logger.info(`governance_status column already exists for tenant ${tenantHash}, skipping`);
            successCount++;
            continue;
          }

          // Add governance_status column
          await queryInterface.sequelize.query(`
            ALTER TABLE "${tenantHash}".ai_detection_findings
            ADD COLUMN governance_status VARCHAR(20) DEFAULT NULL,
            ADD COLUMN governance_updated_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN governance_updated_by INTEGER;
          `, { transaction });

          // Add index for governance_status
          await queryInterface.sequelize.query(`
            CREATE INDEX "${tenantHash}_ai_findings_governance_idx"
            ON "${tenantHash}".ai_detection_findings(governance_status);
          `, { transaction });

          successCount++;
          logger.success(`Added governance_status column for tenant: ${tenantHash}`);

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

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      logger.info('Rolling back governance_status column migration');

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        logger.info(`Removing governance_status from tenant: ${tenantHash}`);

        // Drop index first
        await queryInterface.sequelize.query(`
          DROP INDEX IF EXISTS "${tenantHash}"."${tenantHash}_ai_findings_governance_idx";
        `, { transaction });

        // Remove columns
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".ai_detection_findings
          DROP COLUMN IF EXISTS governance_status,
          DROP COLUMN IF EXISTS governance_updated_at,
          DROP COLUMN IF EXISTS governance_updated_by;
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
