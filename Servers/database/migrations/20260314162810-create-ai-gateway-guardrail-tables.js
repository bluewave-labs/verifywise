'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`SET search_path TO verifywise, public;`);

    // Guardrail rules
    await queryInterface.sequelize.query(`
      CREATE TABLE ai_gateway_guardrails (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        guardrail_type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        config JSONB NOT NULL DEFAULT '{}',
        scope VARCHAR(20) NOT NULL DEFAULT 'input',
        action VARCHAR(20) NOT NULL DEFAULT 'block',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX idx_gw_guardrail_org ON ai_gateway_guardrails(organization_id, guardrail_type);
    `);

    // Guardrail execution logs
    await queryInterface.sequelize.query(`
      CREATE TABLE ai_gateway_guardrail_logs (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        guardrail_id INTEGER REFERENCES ai_gateway_guardrails(id) ON DELETE SET NULL,
        endpoint_id INTEGER REFERENCES ai_gateway_endpoints(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id),
        guardrail_type VARCHAR(50) NOT NULL,
        action_taken VARCHAR(20) NOT NULL,
        matched_text TEXT,
        entity_type VARCHAR(100),
        execution_time_ms INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX idx_gw_guardrail_log_org ON ai_gateway_guardrail_logs(organization_id, created_at);
      CREATE INDEX idx_gw_guardrail_log_type ON ai_gateway_guardrail_logs(guardrail_type, created_at);
    `);

    // Guardrail org-level settings
    await queryInterface.sequelize.query(`
      CREATE TABLE ai_gateway_guardrail_settings (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        pii_on_error VARCHAR(20) NOT NULL DEFAULT 'block',
        content_filter_on_error VARCHAR(20) NOT NULL DEFAULT 'allow',
        pii_replacement_format VARCHAR(50) NOT NULL DEFAULT '<ENTITY_TYPE>',
        content_filter_replacement VARCHAR(50) NOT NULL DEFAULT '[REDACTED]',
        log_retention_days INTEGER NOT NULL DEFAULT 90,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id)
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`SET search_path TO verifywise, public;`);
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS ai_gateway_guardrail_settings CASCADE;
      DROP TABLE IF EXISTS ai_gateway_guardrail_logs CASCADE;
      DROP TABLE IF EXISTS ai_gateway_guardrails CASCADE;
    `);
  }
};
