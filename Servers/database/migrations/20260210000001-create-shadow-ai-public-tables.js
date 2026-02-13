'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Table 1: shadow_ai_tool_registry (public schema — ships with VerifyWise)
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS shadow_ai_tool_registry (
          id          SERIAL PRIMARY KEY,
          name        VARCHAR(255) NOT NULL,
          vendor      VARCHAR(255),
          domains     TEXT[] NOT NULL,
          category    VARCHAR(100),
          models      TEXT[],
          trains_on_data      BOOLEAN,
          soc2_certified      BOOLEAN,
          gdpr_compliant      BOOLEAN,
          created_at  TIMESTAMPTZ DEFAULT NOW(),
          updated_at  TIMESTAMPTZ DEFAULT NOW()
        );
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_shadow_ai_tool_registry_domains
        ON shadow_ai_tool_registry USING GIN (domains);
      `, { transaction });

      // Table 2: shadow_ai_model_patterns (public schema — URI path → model extraction)
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS shadow_ai_model_patterns (
          id              SERIAL PRIMARY KEY,
          name            VARCHAR(255) NOT NULL,
          domain_pattern  VARCHAR(512) NOT NULL,
          path_regex      TEXT NOT NULL,
          created_at      TIMESTAMPTZ DEFAULT NOW()
        );
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS shadow_ai_model_patterns;', { transaction });
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS shadow_ai_tool_registry;', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
