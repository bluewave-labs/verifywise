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
        console.log('Organizations table does not exist yet. Skipping shadow AI indexes.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await addIndexesForTenant(queryInterface, tenantHash, transaction);
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
        await dropIndexesForTenant(queryInterface, tenantHash, transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

async function addIndexesForTenant(queryInterface, tenantHash, transaction) {
  const [schemaExists] = await queryInterface.sequelize.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = :schema);`,
    { transaction, type: queryInterface.sequelize.QueryTypes.SELECT, replacements: { schema: tenantHash } }
  );

  if (!schemaExists.exists) {
    console.log(`Schema ${tenantHash} does not exist. Skipping indexes.`);
    return;
  }

  // Composite indexes on shadow_ai_events for common query patterns
  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_shadow_events_dept_ts
    ON "${tenantHash}".shadow_ai_events(department, event_timestamp DESC);
  `, { transaction });

  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_shadow_events_user_ts
    ON "${tenantHash}".shadow_ai_events(user_email, event_timestamp DESC);
  `, { transaction });

  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_shadow_events_tool_ts
    ON "${tenantHash}".shadow_ai_events(detected_tool_id, event_timestamp DESC);
  `, { transaction });

  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_shadow_events_action_ts
    ON "${tenantHash}".shadow_ai_events(action, event_timestamp DESC);
  `, { transaction });

  // Index on api_keys for fast validation lookups
  await queryInterface.sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_shadow_api_keys_hash_active
    ON "${tenantHash}".shadow_ai_api_keys(key_hash) WHERE is_active = true;
  `, { transaction });

  // Index on monthly_rollups for FK lookups
  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_shadow_monthly_rollups_tool
    ON "${tenantHash}".shadow_ai_monthly_rollups(tool_id);
  `, { transaction });

  // Index on alert_history for paginated queries
  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_shadow_alert_history_fired
    ON "${tenantHash}".shadow_ai_alert_history(fired_at DESC);
  `, { transaction });

  // Index on alert_history rule_id for FK lookups
  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_shadow_alert_history_rule
    ON "${tenantHash}".shadow_ai_alert_history(rule_id);
  `, { transaction });

  // Index on rules for active filter
  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_shadow_rules_active
    ON "${tenantHash}".shadow_ai_rules(is_active);
  `, { transaction });

  // Index on rule_notifications for FK lookups
  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_shadow_rule_notifications_rule
    ON "${tenantHash}".shadow_ai_rule_notifications(rule_id);
  `, { transaction });

  console.log(`Added composite indexes for tenant: ${tenantHash}`);
}

async function dropIndexesForTenant(queryInterface, tenantHash, transaction) {
  const indexes = [
    'idx_shadow_events_dept_ts',
    'idx_shadow_events_user_ts',
    'idx_shadow_events_tool_ts',
    'idx_shadow_events_action_ts',
    'idx_shadow_api_keys_hash_active',
    'idx_shadow_monthly_rollups_tool',
    'idx_shadow_alert_history_fired',
    'idx_shadow_alert_history_rule',
    'idx_shadow_rules_active',
    'idx_shadow_rule_notifications_rule',
  ];

  for (const idx of indexes) {
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "${tenantHash}".${idx};`,
      { transaction }
    );
  }
}
