'use strict';

/**
 * Migration: Create evaluation_llm_api_keys table
 *
 * This table stores encrypted LLM provider API keys for running evaluations
 * across the organization. Each organization can have one key per provider.
 *
 * Security:
 * - API keys are stored encrypted
 * - Unique constraint ensures one key per provider per organization
 * - Keys should be decrypted only when making LLM API calls
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('evaluation_llm_api_keys', {
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
          model: 'organizations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      provider: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'LLM provider identifier (e.g., openai, anthropic, google, xai, mistral, huggingface)',
      },
      encrypted_api_key: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Encrypted API key for the provider',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create unique constraint: one key per provider per organization
    await queryInterface.addConstraint('evaluation_llm_api_keys', {
      fields: ['organization_id', 'provider'],
      type: 'unique',
      name: 'unique_org_provider',
    });

    // Add index for faster lookups
    await queryInterface.addIndex('evaluation_llm_api_keys', ['organization_id'], {
      name: 'idx_evaluation_llm_api_keys_organization_id',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('evaluation_llm_api_keys');
  },
};
