'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'organizations'
        );`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      if (!tableExists[0].exists) {
        console.log('Organizations table does not exist yet. Skipping shadow AI settings.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await createSettingsForTenant(queryInterface, tenantHash, transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'organizations'
        );`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      if (!tableExists[0].exists) {
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await dropSettingsForTenant(queryInterface, tenantHash, transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

async function createSettingsForTenant(queryInterface, tenantHash, transaction) {
  const [schemaExists] = await queryInterface.sequelize.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = :schema);`,
    { transaction, type: queryInterface.sequelize.QueryTypes.SELECT, replacements: { schema: tenantHash } }
  );

  if (!schemaExists.exists) {
    console.log(`Schema ${tenantHash} does not exist. Skipping settings.`);
    return;
  }

  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_settings (
      id SERIAL PRIMARY KEY,
      -- Rate limiting (0 = no limit)
      rate_limit_max_events_per_hour INTEGER NOT NULL DEFAULT 0,
      -- Data retention (days, 0 = keep forever)
      retention_events_days INTEGER NOT NULL DEFAULT 30,
      retention_daily_rollups_days INTEGER NOT NULL DEFAULT 365,
      retention_alert_history_days INTEGER NOT NULL DEFAULT 90,
      -- Timestamps
      updated_at TIMESTAMP DEFAULT NOW(),
      updated_by INTEGER NULL REFERENCES public.users(id)
    );
  `, { transaction });

  // Insert default row
  await queryInterface.sequelize.query(`
    INSERT INTO "${tenantHash}".shadow_ai_settings (id)
    VALUES (1)
    ON CONFLICT (id) DO NOTHING;
  `, { transaction });

  console.log(`Created shadow_ai_settings for tenant: ${tenantHash}`);
}

async function dropSettingsForTenant(queryInterface, tenantHash, transaction) {
  await queryInterface.sequelize.query(
    `DROP TABLE IF EXISTS "${tenantHash}".shadow_ai_settings;`,
    { transaction }
  );
}
