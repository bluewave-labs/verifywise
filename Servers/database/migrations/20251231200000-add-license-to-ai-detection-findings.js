'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration to add license columns to ai_detection_findings table
 *
 * New columns:
 * - license_id: SPDX license identifier (e.g., "MIT", "Apache-2.0")
 * - license_name: Human-readable license name
 * - license_risk: Risk level (high, medium, low, unknown)
 * - license_source: Where the license was detected from (package, huggingface, manual)
 *
 * @type {import('sequelize-cli').Migration}
 */

const logger = {
  info: (msg) => console.log(`[MIGRATION-INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg, error) => console.error(`[MIGRATION-ERROR] ${new Date().toISOString()} - ${msg}`, error ? error.stack || error : ''),
  success: (msg) => console.log(`[MIGRATION-SUCCESS] ${new Date().toISOString()} - ${msg}`),
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      logger.info('Starting migration to add license columns to ai_detection_findings');

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      if (organizations[0].length === 0) {
        logger.info('No organizations found. Skipping.');
        await transaction.commit();
        return;
      }

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        logger.info(`Adding license columns to tenant: ${tenantHash}`);

        // Check if column already exists
        const [columnExists] = await queryInterface.sequelize.query(`
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${tenantHash}'
            AND table_name = 'ai_detection_findings'
            AND column_name = 'license_id'
        `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

        if (columnExists) {
          logger.info(`License columns already exist for tenant ${tenantHash}, skipping`);
          continue;
        }

        // Add license columns
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".ai_detection_findings
          ADD COLUMN IF NOT EXISTS license_id VARCHAR(100),
          ADD COLUMN IF NOT EXISTS license_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS license_risk VARCHAR(20),
          ADD COLUMN IF NOT EXISTS license_source VARCHAR(50);
        `, { transaction });

        // Add index for license_risk queries
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_findings_license_risk_idx"
          ON "${tenantHash}".ai_detection_findings(license_risk);
        `, { transaction });
      }

      await transaction.commit();
      logger.success('Successfully added license columns to all tenant schemas');
    } catch (error) {
      await transaction.rollback();
      logger.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      logger.info('Rolling back license columns from ai_detection_findings');

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(`
          DROP INDEX IF EXISTS "${tenantHash}"."${tenantHash}_ai_findings_license_risk_idx";
        `, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".ai_detection_findings
          DROP COLUMN IF EXISTS license_id,
          DROP COLUMN IF EXISTS license_name,
          DROP COLUMN IF EXISTS license_risk,
          DROP COLUMN IF EXISTS license_source;
        `, { transaction });
      }

      await transaction.commit();
      logger.success('Successfully removed license columns');
    } catch (error) {
      await transaction.rollback();
      logger.error('Rollback failed:', error);
      throw error;
    }
  }
};
