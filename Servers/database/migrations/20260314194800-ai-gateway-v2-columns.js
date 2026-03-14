'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`SET search_path TO verifywise, public;`);

    // Feature 4: Tag-based cost attribution
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_gateway_spend_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
      CREATE INDEX IF NOT EXISTS idx_gw_spend_metadata ON ai_gateway_spend_logs USING GIN (metadata);
    `);

    // Feature 6: Request/response logging (opt-in)
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_gateway_spend_logs ADD COLUMN IF NOT EXISTS request_messages JSONB;
      ALTER TABLE ai_gateway_spend_logs ADD COLUMN IF NOT EXISTS response_text TEXT;
      ALTER TABLE ai_gateway_spend_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
    `);

    // Feature 7: Fallback chains
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_gateway_endpoints ADD COLUMN IF NOT EXISTS fallback_endpoint_id INTEGER REFERENCES ai_gateway_endpoints(id) ON DELETE SET NULL;
    `);

    // Feature 8: Model access controls
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_gateway_endpoints ADD COLUMN IF NOT EXISTS allowed_role_ids INTEGER[] DEFAULT '{1,2,3,4}';
    `);

    // Feature 3: Spend alert toggles on budget
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_gateway_budgets ADD COLUMN IF NOT EXISTS alert_email_enabled BOOLEAN DEFAULT true;
      ALTER TABLE ai_gateway_budgets ADD COLUMN IF NOT EXISTS alert_slack_enabled BOOLEAN DEFAULT false;
    `);

    // Feature 6: Org-level logging preferences
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_gateway_guardrail_settings ADD COLUMN IF NOT EXISTS log_request_body BOOLEAN DEFAULT false;
      ALTER TABLE ai_gateway_guardrail_settings ADD COLUMN IF NOT EXISTS log_response_body BOOLEAN DEFAULT false;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`SET search_path TO verifywise, public;`);
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_gateway_spend_logs DROP COLUMN IF EXISTS metadata;
      ALTER TABLE ai_gateway_spend_logs DROP COLUMN IF EXISTS request_messages;
      ALTER TABLE ai_gateway_spend_logs DROP COLUMN IF EXISTS response_text;
      ALTER TABLE ai_gateway_spend_logs DROP COLUMN IF EXISTS error_message;
      ALTER TABLE ai_gateway_endpoints DROP COLUMN IF EXISTS fallback_endpoint_id;
      ALTER TABLE ai_gateway_endpoints DROP COLUMN IF EXISTS allowed_role_ids;
      ALTER TABLE ai_gateway_budgets DROP COLUMN IF EXISTS alert_email_enabled;
      ALTER TABLE ai_gateway_budgets DROP COLUMN IF EXISTS alert_slack_enabled;
      ALTER TABLE ai_gateway_guardrail_settings DROP COLUMN IF EXISTS log_request_body;
      ALTER TABLE ai_gateway_guardrail_settings DROP COLUMN IF EXISTS log_response_body;
    `);
  }
};
