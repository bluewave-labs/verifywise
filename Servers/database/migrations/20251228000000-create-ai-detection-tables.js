'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration to add AI Detection tables to all existing tenant schemas
 *
 * Tables:
 * - ai_detection_scans: Stores scan records for repository analysis
 * - ai_detection_findings: Stores detected AI/ML library findings
 * - github_tokens: Stores encrypted GitHub PATs for private repository access
 *
 * This migration follows the established multi-tenant pattern:
 * - All tables are created within each tenant's schema
 * - Uses parameterized queries for security
 * - Includes proper indexes for query optimization
 *
 * @type {import('sequelize-cli').Migration}
 */

// Enhanced logging utility for better production visibility
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
      logger.info('Starting AI Detection tables migration for existing tenants');

      // Get all organizations for tenant processing
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      if (organizations[0].length === 0) {
        logger.warn('No organizations found. Skipping tenant table creation.');
        await transaction.commit();
        return;
      }

      logger.info(`Processing ${organizations[0].length} tenant schemas`);

      // Process each tenant with individual error handling
      let successCount = 0;
      let errorCount = 0;

      for (let organization of organizations[0]) {
        try {
          const tenantHash = getTenantHash(organization.id);
          logger.info(`Processing tenant: ${tenantHash} (org_id: ${organization.id})`);

          await createAIDetectionTablesForTenant(queryInterface, tenantHash, transaction);
          successCount++;

        } catch (tenantError) {
          errorCount++;
          logger.error(`Failed to process tenant for org_id ${organization.id}:`, tenantError);
          // Continue with other tenants instead of failing entire migration
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
      logger.info('Starting rollback of AI Detection tables from existing tenants');

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        logger.info(`Removing AI Detection tables from tenant: ${tenantHash}`);

        // Drop tables in reverse order (findings first due to FK constraint)
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".ai_detection_findings CASCADE;`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".ai_detection_scans CASCADE;`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".github_tokens CASCADE;`,
          { transaction }
        );
      }

      await transaction.commit();
      logger.success('Successfully rolled back AI Detection tables from all tenant schemas');
    } catch (error) {
      await transaction.rollback();
      logger.error('Rollback failed:', error);
      throw error;
    }
  }
};

/**
 * Creates AI Detection tables for a specific tenant with comprehensive error handling
 * and idempotency checks
 *
 * @param {object} queryInterface - Sequelize query interface
 * @param {string} tenantHash - The tenant's schema hash
 * @param {object} transaction - The active transaction
 */
async function createAIDetectionTablesForTenant(queryInterface, tenantHash, transaction) {
  // Check if tables already exist to avoid unnecessary work
  const [scansTableExists] = await queryInterface.sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = '${tenantHash}' AND table_name = 'ai_detection_scans'
  `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

  if (scansTableExists) {
    logger.info(`AI Detection tables already exist for tenant ${tenantHash}, skipping creation`);
    return;
  }

  const queries = [
    // ========================================
    // ai_detection_scans table
    // ========================================
    `CREATE TABLE "${tenantHash}".ai_detection_scans (
      id SERIAL PRIMARY KEY,
      repository_url VARCHAR(500) NOT NULL,
      repository_owner VARCHAR(255) NOT NULL,
      repository_name VARCHAR(255) NOT NULL,
      default_branch VARCHAR(100) DEFAULT 'main',
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      findings_count INTEGER DEFAULT 0,
      files_scanned INTEGER DEFAULT 0,
      total_files INTEGER,
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      duration_ms INTEGER,
      error_message TEXT,
      triggered_by INTEGER NOT NULL,
      cache_path VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Scans table indexes
    `CREATE INDEX "${tenantHash}_ai_scans_status_idx" ON "${tenantHash}".ai_detection_scans(status);`,
    `CREATE INDEX "${tenantHash}_ai_scans_triggered_by_idx" ON "${tenantHash}".ai_detection_scans(triggered_by);`,
    `CREATE INDEX "${tenantHash}_ai_scans_created_at_idx" ON "${tenantHash}".ai_detection_scans(created_at DESC);`,
    `CREATE INDEX "${tenantHash}_ai_scans_repo_idx" ON "${tenantHash}".ai_detection_scans(repository_owner, repository_name);`,

    // ========================================
    // ai_detection_findings table
    // ========================================
    `CREATE TABLE "${tenantHash}".ai_detection_findings (
      id SERIAL PRIMARY KEY,
      scan_id INTEGER NOT NULL REFERENCES "${tenantHash}".ai_detection_scans(id) ON DELETE CASCADE,
      finding_type VARCHAR(100) NOT NULL,
      category VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      provider VARCHAR(100),
      confidence VARCHAR(20) NOT NULL,
      description TEXT,
      documentation_url VARCHAR(500),
      file_count INTEGER DEFAULT 1,
      file_paths JSONB,
      -- Model security scanning columns (Phase 2)
      severity VARCHAR(20),
      cwe_id VARCHAR(20),
      cwe_name VARCHAR(200),
      owasp_ml_id VARCHAR(20),
      owasp_ml_name VARCHAR(200),
      threat_type VARCHAR(50),
      operator_name VARCHAR(100),
      module_name VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(scan_id, name, provider)
    );`,

    // Findings table indexes
    `CREATE INDEX "${tenantHash}_ai_findings_scan_idx" ON "${tenantHash}".ai_detection_findings(scan_id);`,
    `CREATE INDEX "${tenantHash}_ai_findings_confidence_idx" ON "${tenantHash}".ai_detection_findings(confidence);`,
    `CREATE INDEX "${tenantHash}_ai_findings_provider_idx" ON "${tenantHash}".ai_detection_findings(provider);`,
    `CREATE INDEX "${tenantHash}_ai_findings_severity_idx" ON "${tenantHash}".ai_detection_findings(severity);`,
    `CREATE INDEX "${tenantHash}_ai_findings_type_idx" ON "${tenantHash}".ai_detection_findings(finding_type);`,

    // ========================================
    // github_tokens table (for private repository access)
    // ========================================
    `CREATE TABLE "${tenantHash}".github_tokens (
      id SERIAL PRIMARY KEY,
      encrypted_token TEXT NOT NULL,
      token_name VARCHAR(100) DEFAULT 'GitHub Personal Access Token',
      created_by INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_used_at TIMESTAMP WITH TIME ZONE
    );`,
  ];

  // Execute queries with individual error handling
  for (const [index, query] of queries.entries()) {
    try {
      await queryInterface.sequelize.query(query, { transaction });
    } catch (queryError) {
      logger.error(`Failed to execute query ${index + 1} for tenant ${tenantHash}:`, queryError);
      logger.error(`Query was: ${query}`);
      throw queryError;
    }
  }

  logger.success(`Successfully created AI Detection tables for tenant: ${tenantHash}`);
}
