'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create virtual keys table
    await queryInterface.sequelize.query(`
      CREATE TABLE ai_gateway_virtual_keys (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        key_hash VARCHAR(64) NOT NULL,
        key_prefix VARCHAR(16) NOT NULL,
        name VARCHAR(255) NOT NULL,
        allowed_endpoint_ids INTEGER[] DEFAULT '{}',
        max_budget_usd DECIMAL(12, 4),
        current_spend_usd DECIMAL(12, 8) NOT NULL DEFAULT 0,
        budget_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month'),
        rate_limit_rpm INTEGER,
        metadata JSONB DEFAULT '{}',
        expires_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        revoked_at TIMESTAMP WITH TIME ZONE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(key_hash)
      );
    `);

    // Create indexes
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_vkey_org ON ai_gateway_virtual_keys(organization_id);
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_vkey_hash ON ai_gateway_virtual_keys(key_hash);
    `);

    // Add virtual_key_id column to spend logs
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_gateway_spend_logs
        ADD COLUMN virtual_key_id INTEGER REFERENCES ai_gateway_virtual_keys(id) ON DELETE SET NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_gateway_spend_logs DROP COLUMN IF EXISTS virtual_key_id;
    `);
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS ai_gateway_virtual_keys;
    `);
  }
};
