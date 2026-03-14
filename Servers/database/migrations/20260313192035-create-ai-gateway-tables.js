'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure tables are created in verifywise schema
    await queryInterface.sequelize.query(`SET search_path TO verifywise, public;`);

    // AI Gateway API Keys (separate from evaluation_llm_api_keys)
    await queryInterface.sequelize.query(`
      CREATE TABLE ai_gateway_api_keys (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        key_name VARCHAR(255) NOT NULL,
        provider VARCHAR(100) NOT NULL,
        encrypted_key TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // AI Gateway Endpoints
    await queryInterface.sequelize.query(`
      CREATE TABLE ai_gateway_endpoints (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        display_name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        provider VARCHAR(100) NOT NULL,
        model VARCHAR(255) NOT NULL,
        api_key_id INTEGER REFERENCES ai_gateway_api_keys(id) ON DELETE SET NULL,
        max_tokens INTEGER,
        temperature DECIMAL(3, 2),
        system_prompt TEXT,
        rate_limit_rpm INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id, slug)
      );
    `);

    // AI Gateway Spend Logs
    await queryInterface.sequelize.query(`
      CREATE TABLE ai_gateway_spend_logs (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        endpoint_id INTEGER REFERENCES ai_gateway_endpoints(id),
        user_id INTEGER REFERENCES users(id),
        model VARCHAR(255) NOT NULL,
        provider VARCHAR(100) NOT NULL,
        prompt_tokens INTEGER NOT NULL DEFAULT 0,
        completion_tokens INTEGER NOT NULL DEFAULT 0,
        total_tokens INTEGER NOT NULL DEFAULT 0,
        cost_usd DECIMAL(12, 8) NOT NULL DEFAULT 0,
        latency_ms INTEGER,
        status_code INTEGER NOT NULL DEFAULT 200,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX idx_gw_spend_org_created ON ai_gateway_spend_logs(organization_id, created_at);
      CREATE INDEX idx_gw_spend_endpoint ON ai_gateway_spend_logs(endpoint_id, created_at);
      CREATE INDEX idx_gw_spend_user ON ai_gateway_spend_logs(user_id, created_at);
    `);

    // AI Gateway Budgets
    await queryInterface.sequelize.query(`
      CREATE TABLE ai_gateway_budgets (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        monthly_limit_usd DECIMAL(10, 2) NOT NULL DEFAULT 0,
        current_spend_usd DECIMAL(12, 8) NOT NULL DEFAULT 0,
        alert_threshold_pct INTEGER DEFAULT 80,
        is_hard_limit BOOLEAN NOT NULL DEFAULT false,
        period_start TIMESTAMP WITH TIME ZONE DEFAULT DATE_TRUNC('month', NOW()),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id)
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`SET search_path TO verifywise, public;`);
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS ai_gateway_budgets CASCADE;
      DROP TABLE IF EXISTS ai_gateway_spend_logs CASCADE;
      DROP TABLE IF EXISTS ai_gateway_endpoints CASCADE;
      DROP TABLE IF EXISTS ai_gateway_api_keys CASCADE;
    `);
  }
};
