'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS public.evaluation_llm_api_keys;
        
        -- Drop the trigger
        DROP TRIGGER IF EXISTS trigger_update_evaluation_llm_api_keys_updated_at
        ON evaluation_llm_api_keys;

        -- Drop the function
        DROP FUNCTION IF EXISTS update_evaluation_llm_api_keys_updated_at();
      `, { transaction });

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      // Create trigger function to auto-update updated_at
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_evaluation_llm_api_keys_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `, { transaction });

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".evaluation_llm_api_keys (
            id SERIAL PRIMARY KEY,
            provider VARCHAR(50) NOT NULL UNIQUE,
            encrypted_api_key TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `, { transaction });

        // Create trigger on evaluation_llm_api_keys table
        await queryInterface.sequelize.query(`
          CREATE TRIGGER trg_${tenantHash}_update_evaluation_llm_api_keys_updated_at
          BEFORE UPDATE ON "${tenantHash}".evaluation_llm_api_keys
          FOR EACH ROW EXECUTE PROCEDURE update_evaluation_llm_api_keys_updated_at();
        `, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
