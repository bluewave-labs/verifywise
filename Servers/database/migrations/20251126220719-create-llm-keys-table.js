'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Create ENUM type for LLM provider names
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_llm_keys_provider AS ENUM ('Anthropic', 'OpenAI', 'OpenRouter');
      `, { transaction });

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".llm_keys (
            id SERIAL PRIMARY KEY,
            key TEXT NOT NULL UNIQUE,
            name enum_llm_keys_provider NOT NULL,
            url TEXT,
            model TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".llm_keys;
        `, { transaction });
      }

      // Drop the ENUM type
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_llm_keys_provider;
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
