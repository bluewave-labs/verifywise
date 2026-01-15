'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration to add model security columns to ai_detection_findings table
 *
 * These columns support Phase 2 - Model Security Scanning feature:
 * - severity: Risk level (critical, high, medium, low)
 * - cwe_id: Common Weakness Enumeration identifier
 * - cwe_name: CWE description
 * - owasp_ml_id: OWASP ML Top 10 identifier
 * - owasp_ml_name: OWASP ML category name
 * - threat_type: Type of security threat
 * - operator_name: Name of dangerous operator/function
 * - module_name: Python module containing the threat
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
      logger.info('Starting migration to add model security columns to ai_detection_findings');

      // Get all organizations for tenant processing
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      if (organizations[0].length === 0) {
        logger.warn('No organizations found. Skipping column addition.');
        await transaction.commit();
        return;
      }

      logger.info(`Processing ${organizations[0].length} tenant schemas`);

      let successCount = 0;
      let errorCount = 0;

      for (let organization of organizations[0]) {
        try {
          const tenantHash = getTenantHash(organization.id);
          logger.info(`Processing tenant: ${tenantHash} (org_id: ${organization.id})`);

          // Check if columns already exist
          const [columns] = await queryInterface.sequelize.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'ai_detection_findings'
            AND column_name = 'severity'
          `, { transaction });

          if (columns.length > 0) {
            logger.info(`Model security columns already exist for tenant ${tenantHash}, skipping`);
            successCount++;
            continue;
          }

          // Add the new columns
          const alterQueries = [
            `ALTER TABLE "${tenantHash}".ai_detection_findings ADD COLUMN IF NOT EXISTS severity VARCHAR(20);`,
            `ALTER TABLE "${tenantHash}".ai_detection_findings ADD COLUMN IF NOT EXISTS cwe_id VARCHAR(20);`,
            `ALTER TABLE "${tenantHash}".ai_detection_findings ADD COLUMN IF NOT EXISTS cwe_name VARCHAR(200);`,
            `ALTER TABLE "${tenantHash}".ai_detection_findings ADD COLUMN IF NOT EXISTS owasp_ml_id VARCHAR(20);`,
            `ALTER TABLE "${tenantHash}".ai_detection_findings ADD COLUMN IF NOT EXISTS owasp_ml_name VARCHAR(200);`,
            `ALTER TABLE "${tenantHash}".ai_detection_findings ADD COLUMN IF NOT EXISTS threat_type VARCHAR(50);`,
            `ALTER TABLE "${tenantHash}".ai_detection_findings ADD COLUMN IF NOT EXISTS operator_name VARCHAR(100);`,
            `ALTER TABLE "${tenantHash}".ai_detection_findings ADD COLUMN IF NOT EXISTS module_name VARCHAR(100);`,
            // Add index for severity queries
            `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_findings_severity_idx" ON "${tenantHash}".ai_detection_findings(severity);`,
          ];

          for (const query of alterQueries) {
            await queryInterface.sequelize.query(query, { transaction });
          }

          logger.success(`Added model security columns to tenant: ${tenantHash}`);
          successCount++;

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
      logger.info('Starting rollback of model security columns from ai_detection_findings');

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        logger.info(`Removing model security columns from tenant: ${tenantHash}`);

        // Drop index first
        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}"."${tenantHash}_ai_findings_severity_idx";`,
          { transaction }
        );

        // Drop columns
        const dropQueries = [
          `ALTER TABLE "${tenantHash}".ai_detection_findings DROP COLUMN IF EXISTS severity;`,
          `ALTER TABLE "${tenantHash}".ai_detection_findings DROP COLUMN IF EXISTS cwe_id;`,
          `ALTER TABLE "${tenantHash}".ai_detection_findings DROP COLUMN IF EXISTS cwe_name;`,
          `ALTER TABLE "${tenantHash}".ai_detection_findings DROP COLUMN IF EXISTS owasp_ml_id;`,
          `ALTER TABLE "${tenantHash}".ai_detection_findings DROP COLUMN IF EXISTS owasp_ml_name;`,
          `ALTER TABLE "${tenantHash}".ai_detection_findings DROP COLUMN IF EXISTS threat_type;`,
          `ALTER TABLE "${tenantHash}".ai_detection_findings DROP COLUMN IF EXISTS operator_name;`,
          `ALTER TABLE "${tenantHash}".ai_detection_findings DROP COLUMN IF EXISTS module_name;`,
        ];

        for (const query of dropQueries) {
          await queryInterface.sequelize.query(query, { transaction });
        }
      }

      await transaction.commit();
      logger.success('Successfully rolled back model security columns');
    } catch (error) {
      await transaction.rollback();
      logger.error('Rollback failed:', error);
      throw error;
    }
  }
};
