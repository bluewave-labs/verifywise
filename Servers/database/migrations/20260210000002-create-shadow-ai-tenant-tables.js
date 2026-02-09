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
        console.log('Organizations table does not exist yet. Skipping shadow AI tenant tables.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await createShadowAiTablesForTenant(queryInterface, tenantHash, transaction);
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
        await dropShadowAiTablesForTenant(queryInterface, tenantHash, transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

async function createShadowAiTablesForTenant(queryInterface, tenantHash, transaction) {
  // Check schema exists
  const [schemaExists] = await queryInterface.sequelize.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = :schema);`,
    { transaction, type: queryInterface.sequelize.QueryTypes.SELECT, replacements: { schema: tenantHash } }
  );

  if (!schemaExists.exists) {
    console.log(`Schema ${tenantHash} does not exist. Skipping.`);
    return;
  }

  // 1. shadow_ai_tools (must come before events due to FK)
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_tools (
      id                  SERIAL PRIMARY KEY,
      name                VARCHAR(255) NOT NULL,
      vendor              VARCHAR(255),
      domains             TEXT[] NOT NULL,
      status              VARCHAR(50) DEFAULT 'detected',
      risk_score          INTEGER,
      first_detected_at   TIMESTAMPTZ DEFAULT NOW(),
      last_seen_at        TIMESTAMPTZ,
      total_users         INTEGER DEFAULT 0,
      total_events        INTEGER DEFAULT 0,
      trains_on_data      BOOLEAN,
      soc2_certified      BOOLEAN,
      gdpr_compliant      BOOLEAN,
      data_residency      VARCHAR(100),
      sso_support         BOOLEAN,
      encryption_at_rest  BOOLEAN,
      model_inventory_id  INTEGER,
      governance_owner_id INTEGER,
      risk_entry_id       INTEGER,
      created_at          TIMESTAMPTZ DEFAULT NOW(),
      updated_at          TIMESTAMPTZ DEFAULT NOW()
    );
  `, { transaction });

  // 2. shadow_ai_events (raw events, 30-day retention)
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_events (
      id              BIGSERIAL PRIMARY KEY,
      user_email      VARCHAR(255) NOT NULL,
      destination     VARCHAR(512) NOT NULL,
      uri_path        TEXT,
      http_method     VARCHAR(10),
      action          VARCHAR(20) DEFAULT 'allowed',
      detected_tool_id INTEGER REFERENCES "${tenantHash}".shadow_ai_tools(id),
      detected_model  VARCHAR(255),
      event_timestamp TIMESTAMPTZ NOT NULL,
      ingested_at     TIMESTAMPTZ DEFAULT NOW(),
      department      VARCHAR(255),
      job_title       VARCHAR(255),
      manager_email   VARCHAR(255)
    );
  `, { transaction });

  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_shadow_events_timestamp ON "${tenantHash}".shadow_ai_events(event_timestamp);
  `, { transaction });
  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_shadow_events_user ON "${tenantHash}".shadow_ai_events(user_email);
  `, { transaction });
  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_shadow_events_tool ON "${tenantHash}".shadow_ai_events(detected_tool_id);
  `, { transaction });

  // 3. shadow_ai_daily_rollups (1-year retention)
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_daily_rollups (
      id              SERIAL PRIMARY KEY,
      rollup_date     DATE NOT NULL,
      user_email      VARCHAR(255) NOT NULL,
      tool_id         INTEGER REFERENCES "${tenantHash}".shadow_ai_tools(id),
      department      VARCHAR(255),
      total_events    INTEGER DEFAULT 0,
      post_events     INTEGER DEFAULT 0,
      blocked_events  INTEGER DEFAULT 0,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(rollup_date, user_email, tool_id)
    );
  `, { transaction });

  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_shadow_rollups_date ON "${tenantHash}".shadow_ai_daily_rollups(rollup_date);
  `, { transaction });
  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_shadow_rollups_tool ON "${tenantHash}".shadow_ai_daily_rollups(tool_id);
  `, { transaction });

  // 4. shadow_ai_monthly_rollups (forever)
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_monthly_rollups (
      id              SERIAL PRIMARY KEY,
      rollup_month    DATE NOT NULL,
      tool_id         INTEGER REFERENCES "${tenantHash}".shadow_ai_tools(id),
      department      VARCHAR(255),
      unique_users    INTEGER DEFAULT 0,
      total_events    INTEGER DEFAULT 0,
      post_events     INTEGER DEFAULT 0,
      blocked_events  INTEGER DEFAULT 0,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(rollup_month, tool_id, department)
    );
  `, { transaction });

  // 5. shadow_ai_rules
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_rules (
      id              SERIAL PRIMARY KEY,
      name            VARCHAR(255) NOT NULL,
      description     TEXT,
      is_active       BOOLEAN DEFAULT true,
      trigger_type    VARCHAR(100) NOT NULL,
      trigger_config  JSONB DEFAULT '{}',
      actions         JSONB NOT NULL,
      created_by      INTEGER NOT NULL,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    );
  `, { transaction });

  // 6. shadow_ai_rule_notifications
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_rule_notifications (
      id          SERIAL PRIMARY KEY,
      rule_id     INTEGER REFERENCES "${tenantHash}".shadow_ai_rules(id) ON DELETE CASCADE,
      user_id     INTEGER NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(rule_id, user_id)
    );
  `, { transaction });

  // 7. shadow_ai_api_keys
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_api_keys (
      id              SERIAL PRIMARY KEY,
      key_hash        VARCHAR(255) NOT NULL,
      key_prefix      VARCHAR(20) NOT NULL,
      label           VARCHAR(255),
      created_by      INTEGER NOT NULL,
      last_used_at    TIMESTAMPTZ,
      is_active       BOOLEAN DEFAULT true,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );
  `, { transaction });

  // 8. shadow_ai_syslog_config
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_syslog_config (
      id                  SERIAL PRIMARY KEY,
      source_identifier   VARCHAR(255) NOT NULL,
      parser_type         VARCHAR(50) NOT NULL,
      is_active           BOOLEAN DEFAULT true,
      created_at          TIMESTAMPTZ DEFAULT NOW()
    );
  `, { transaction });

  // 9. shadow_ai_alert_history
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_alert_history (
      id              SERIAL PRIMARY KEY,
      rule_id         INTEGER REFERENCES "${tenantHash}".shadow_ai_rules(id),
      rule_name       VARCHAR(255),
      trigger_type    VARCHAR(100),
      trigger_data    JSONB,
      actions_taken   JSONB,
      fired_at        TIMESTAMPTZ DEFAULT NOW()
    );
  `, { transaction });

  console.log(`Created shadow AI tables for tenant: ${tenantHash}`);
}

async function dropShadowAiTablesForTenant(queryInterface, tenantHash, transaction) {
  const tables = [
    'shadow_ai_alert_history',
    'shadow_ai_syslog_config',
    'shadow_ai_api_keys',
    'shadow_ai_rule_notifications',
    'shadow_ai_rules',
    'shadow_ai_monthly_rollups',
    'shadow_ai_daily_rollups',
    'shadow_ai_events',
    'shadow_ai_tools',
  ];

  for (const table of tables) {
    await queryInterface.sequelize.query(
      `DROP TABLE IF EXISTS "${tenantHash}".${table} CASCADE;`,
      { transaction }
    );
  }
}
