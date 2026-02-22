'use strict';

/**
 * Migration: Add risk score columns to ai_detection_scans
 * and create ai_detection_risk_scoring_config table.
 *
 * Affects all tenant schemas.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Add risk score columns to ai_detection_scans
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".ai_detection_scans
            ADD COLUMN IF NOT EXISTS risk_score NUMERIC(5,2),
            ADD COLUMN IF NOT EXISTS risk_score_grade VARCHAR(1),
            ADD COLUMN IF NOT EXISTS risk_score_details JSONB,
            ADD COLUMN IF NOT EXISTS risk_score_calculated_at TIMESTAMP WITH TIME ZONE;
        `, { transaction });

        // Create ai_detection_risk_scoring_config table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".ai_detection_risk_scoring_config (
            id SERIAL PRIMARY KEY,
            llm_enabled BOOLEAN DEFAULT FALSE,
            llm_key_id INTEGER,
            dimension_weights JSONB DEFAULT '${JSON.stringify({
              data_sovereignty: 0.20,
              transparency: 0.15,
              security: 0.15,
              autonomy: 0.15,
              supply_chain: 0.15,
              license: 0.10,
              accuracy: 0.10
            })}',
            updated_by INTEGER,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `, { transaction });

        console.log(`Updated schema for tenant ${tenantHash}`);
      }

      await transaction.commit();
      console.log('Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".ai_detection_risk_scoring_config;
        `, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".ai_detection_scans
            DROP COLUMN IF EXISTS risk_score,
            DROP COLUMN IF EXISTS risk_score_grade,
            DROP COLUMN IF EXISTS risk_score_details,
            DROP COLUMN IF EXISTS risk_score_calculated_at;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
