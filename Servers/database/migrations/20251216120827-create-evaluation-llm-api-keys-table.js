"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create the evaluation_llm_api_keys table
    await queryInterface.createTable("evaluation_llm_api_keys", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "organizations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      provider: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: "LLM provider name (e.g., openai, anthropic, google, xai, mistral, huggingface)",
      },
      encrypted_api_key: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: "Encrypted API key for the LLM provider",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add unique constraint for organization_id + provider combination
    await queryInterface.addConstraint("evaluation_llm_api_keys", {
      fields: ["organization_id", "provider"],
      type: "unique",
      name: "evaluation_llm_api_keys_org_provider_unique",
    });

    // Add index for faster lookups by organization
    await queryInterface.addIndex("evaluation_llm_api_keys", ["organization_id"], {
      name: "idx_evaluation_llm_api_keys_org_id",
    });

    // Add index for faster lookups by provider
    await queryInterface.addIndex("evaluation_llm_api_keys", ["provider"], {
      name: "idx_evaluation_llm_api_keys_provider",
    });

    // Create trigger function to auto-update updated_at
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_evaluation_llm_api_keys_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger
    await queryInterface.sequelize.query(`
      CREATE TRIGGER trigger_update_evaluation_llm_api_keys_updated_at
      BEFORE UPDATE ON evaluation_llm_api_keys
      FOR EACH ROW
      EXECUTE FUNCTION update_evaluation_llm_api_keys_updated_at();
    `);
  },

  async down(queryInterface, Sequelize) {
    // Drop trigger first
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trigger_update_evaluation_llm_api_keys_updated_at ON evaluation_llm_api_keys;
    `);

    // Drop trigger function
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS update_evaluation_llm_api_keys_updated_at();
    `);

    // Drop the table (this will also drop indexes and constraints)
    await queryInterface.dropTable("evaluation_llm_api_keys");
  },
};
