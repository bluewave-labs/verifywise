'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('SET search_path TO verifywise, public;');
    // Drop the existing FK constraint and recreate with ON DELETE SET NULL
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_gateway_spend_logs
        DROP CONSTRAINT IF EXISTS ai_gateway_spend_logs_endpoint_id_fkey;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_gateway_spend_logs
        ADD CONSTRAINT ai_gateway_spend_logs_endpoint_id_fkey
        FOREIGN KEY (endpoint_id) REFERENCES ai_gateway_endpoints(id) ON DELETE SET NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('SET search_path TO verifywise, public;');
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_gateway_spend_logs
        DROP CONSTRAINT IF EXISTS ai_gateway_spend_logs_endpoint_id_fkey;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE ai_gateway_spend_logs
        ADD CONSTRAINT ai_gateway_spend_logs_endpoint_id_fkey
        FOREIGN KEY (endpoint_id) REFERENCES ai_gateway_endpoints(id);
    `);
  }
};
