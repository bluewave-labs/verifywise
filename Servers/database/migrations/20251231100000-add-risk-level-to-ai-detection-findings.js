'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration: Add risk_level column to ai_detection_findings table
 *
 * Adds a risk_level column to store the calculated risk level for each finding.
 * Risk levels are:
 * - high: Cloud AI services, secrets, API calls (data leakage risk)
 * - medium: Frameworks that can use cloud APIs
 * - low: Local-only processing libraries
 *
 * @type {import('sequelize-cli').Migration}
 */

const logger = {
  info: (msg) => console.log(`[MIGRATION-INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg, error) => console.error(`[MIGRATION-ERROR] ${new Date().toISOString()} - ${msg}`, error ? error.stack || error : ''),
  success: (msg) => console.log(`[MIGRATION-SUCCESS] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[MIGRATION-WARN] ${new Date().toISOString()} - ${msg}`)
};

// Provider classifications for risk level calculation
const HIGH_RISK_PROVIDERS = [
  'OpenAI', 'Anthropic', 'Google', 'Microsoft', 'AWS', 'Cohere',
  'Mistral AI', 'Replicate', 'Hugging Face', 'Together AI', 'Groq',
  'Perplexity', 'Anyscale'
];

const MEDIUM_RISK_PROVIDERS = ['LangChain', 'LlamaIndex', 'Haystack', 'CrewAI'];

const LOW_RISK_PROVIDERS = [
  'PyTorch', 'TensorFlow', 'Keras', 'scikit-learn', 'Ollama', 'NVIDIA',
  'Meta', 'JAX', 'MXNet', 'ONNX', 'NumPy', 'Pandas', 'Matplotlib',
  'SciPy', 'Dask', 'XGBoost', 'LightGBM', 'CatBoost', 'spaCy', 'NLTK',
  'Transformers', 'Accelerate', 'PEFT'
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      logger.info('Starting risk_level column migration');

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
              AND column_name = 'risk_level'
          `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

          if (columnExists) {
            logger.info(`risk_level column already exists for tenant ${tenantHash}, skipping`);
            successCount++;
            continue;
          }

          // Add risk_level column
          await queryInterface.sequelize.query(`
            ALTER TABLE "${tenantHash}".ai_detection_findings
            ADD COLUMN risk_level VARCHAR(20) DEFAULT 'medium';
          `, { transaction });

          // Add index for risk_level
          await queryInterface.sequelize.query(`
            CREATE INDEX "${tenantHash}_ai_findings_risk_level_idx"
            ON "${tenantHash}".ai_detection_findings(risk_level);
          `, { transaction });

          // Update existing findings with calculated risk levels
          // Secrets and API calls are always high risk
          await queryInterface.sequelize.query(`
            UPDATE "${tenantHash}".ai_detection_findings
            SET risk_level = 'high'
            WHERE finding_type IN ('secret', 'api_call');
          `, { transaction });

          // High risk providers
          await queryInterface.sequelize.query(`
            UPDATE "${tenantHash}".ai_detection_findings
            SET risk_level = 'high'
            WHERE finding_type IN ('library', 'dependency')
            AND provider IN (${HIGH_RISK_PROVIDERS.map(p => `'${p}'`).join(', ')});
          `, { transaction });

          // Medium risk providers (frameworks)
          await queryInterface.sequelize.query(`
            UPDATE "${tenantHash}".ai_detection_findings
            SET risk_level = 'medium'
            WHERE finding_type IN ('library', 'dependency')
            AND provider IN (${MEDIUM_RISK_PROVIDERS.map(p => `'${p}'`).join(', ')})
            AND risk_level != 'high';
          `, { transaction });

          // Low risk providers (local processing)
          await queryInterface.sequelize.query(`
            UPDATE "${tenantHash}".ai_detection_findings
            SET risk_level = 'low'
            WHERE finding_type IN ('library', 'dependency')
            AND provider IN (${LOW_RISK_PROVIDERS.map(p => `'${p}'`).join(', ')})
            AND risk_level != 'high';
          `, { transaction });

          successCount++;
          logger.success(`Added risk_level column for tenant: ${tenantHash}`);

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
      logger.info('Rolling back risk_level column migration');

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        logger.info(`Removing risk_level from tenant: ${tenantHash}`);

        // Drop index first
        await queryInterface.sequelize.query(`
          DROP INDEX IF EXISTS "${tenantHash}"."${tenantHash}_ai_findings_risk_level_idx";
        `, { transaction });

        // Remove column
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".ai_detection_findings
          DROP COLUMN IF EXISTS risk_level;
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
