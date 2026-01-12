'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration to add governance columns to ai_detection_findings table
 *
 * New columns:
 * - governance_status: Status of governance review (reviewed, approved, flagged)
 * - governance_updated_at: Timestamp of last governance status update
 * - governance_updated_by: User ID who last updated the governance status
 *
 * This migration ensures existing tenants have the same schema as new tenants
 * created via createNewTenant.ts
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
      logger.info('Starting migration to add governance columns to ai_detection_findings');

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

          // Check if ai_detection_findings table exists
          const [tableExists] = await queryInterface.sequelize.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
              AND table_name = 'ai_detection_findings'
          `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

          if (!tableExists) {
            logger.info(`ai_detection_findings table does not exist for tenant ${tenantHash}, skipping`);
            continue;
          }

          // Check if governance_status column already exists
          const [columnExists] = await queryInterface.sequelize.query(`
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = '${tenantHash}'
              AND table_name = 'ai_detection_findings'
              AND column_name = 'governance_status'
          `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

          if (columnExists) {
            logger.info(`Governance columns already exist for tenant ${tenantHash}, skipping`);
            successCount++;
            continue;
          }

          // Add governance columns
          await queryInterface.sequelize.query(`
            ALTER TABLE "${tenantHash}".ai_detection_findings
            ADD COLUMN IF NOT EXISTS governance_status VARCHAR(20) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS governance_updated_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS governance_updated_by INTEGER;
          `, { transaction });

          // Add index for governance_status
          await queryInterface.sequelize.query(`
            CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_findings_governance_idx"
            ON "${tenantHash}".ai_detection_findings(governance_status);
          `, { transaction });

          successCount++;
          logger.success(`Added governance columns for tenant: ${tenantHash}`);

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
      logger.info('Rolling back governance columns from ai_detection_findings');

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        logger.info(`Removing governance columns from tenant: ${tenantHash}`);

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
