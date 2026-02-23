'use strict';

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

        // Add new columns to intake_forms
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".intake_forms
            ADD COLUMN IF NOT EXISTS public_id VARCHAR(8) UNIQUE,
            ADD COLUMN IF NOT EXISTS recipients JSONB DEFAULT '[]',
            ADD COLUMN IF NOT EXISTS risk_tier_system VARCHAR(20) DEFAULT 'generic',
            ADD COLUMN IF NOT EXISTS risk_assessment_config JSONB,
            ADD COLUMN IF NOT EXISTS llm_key_id INTEGER,
            ADD COLUMN IF NOT EXISTS suggested_questions_enabled BOOLEAN DEFAULT false;
        `, { transaction });

        // Backfill public_id for existing rows (using md5 + random to avoid pgcrypto dependency)
        await queryInterface.sequelize.query(`
          UPDATE "${tenantHash}".intake_forms
          SET public_id = substr(md5(random()::text || id::text), 1, 8)
          WHERE public_id IS NULL;
        `, { transaction });

        // Create index on public_id
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_intake_forms_public_id
          ON "${tenantHash}".intake_forms(public_id);
        `, { transaction });

        console.log(`Enhanced intake_forms for tenant ${tenantHash}`);
      }

      await transaction.commit();
      console.log('Migration enhance-intake-forms completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration enhance-intake-forms failed:', error);
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
          DROP INDEX IF EXISTS "${tenantHash}".idx_intake_forms_public_id;
        `, { transaction });

        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".intake_forms
            DROP COLUMN IF EXISTS public_id,
            DROP COLUMN IF EXISTS recipients,
            DROP COLUMN IF EXISTS risk_tier_system,
            DROP COLUMN IF EXISTS risk_assessment_config,
            DROP COLUMN IF EXISTS llm_key_id,
            DROP COLUMN IF EXISTS suggested_questions_enabled;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
