"use strict";

const { DataTypes } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add new provider and model columns to model_inventories table
      await queryInterface.addColumn("model_inventories", "provider", {
        type: Sequelize.STRING,
        allowNull: true, // Initially allow null for data migration
      }, { transaction });

      await queryInterface.addColumn("model_inventories", "model", {
        type: Sequelize.STRING,
        allowNull: true, // Initially allow null for data migration
      }, { transaction });

      // Migrate existing data from provider_model to provider and model columns
      // This will attempt to intelligently split the provider_model field
      await queryInterface.sequelize.query(`
      UPDATE model_inventories 
      SET 
        provider = CASE
          -- Handle common patterns like "OpenAI GPT-4", "Google Gemini", "Microsoft Azure OpenAI"
          WHEN provider_model LIKE '%OpenAI%' THEN 'OpenAI'
          WHEN provider_model LIKE '%Google%' THEN 'Google'
          WHEN provider_model LIKE '%Microsoft%' THEN 'Microsoft'
          WHEN provider_model LIKE '%Anthropic%' THEN 'Anthropic'
          WHEN provider_model LIKE '%Meta%' THEN 'Meta'
          WHEN provider_model LIKE '%AWS%' OR provider_model LIKE '%Amazon%' THEN 'Amazon Web Services'
          WHEN provider_model LIKE '%Azure%' THEN 'Microsoft'
          WHEN provider_model LIKE '%Hugging Face%' OR provider_model LIKE '%HuggingFace%' THEN 'Hugging Face'
          WHEN provider_model LIKE '%Cohere%' THEN 'Cohere'
          WHEN provider_model LIKE '%Stability%' THEN 'Stability AI'
          -- For cases with space, try to extract first part as provider
          WHEN position(' ' in provider_model) > 0 THEN 
            trim(substring(provider_model from 1 for position(' ' in provider_model) - 1))
          -- If no space, use the entire value as provider for now
          ELSE provider_model
        END,
        model = CASE
          -- Handle common patterns
          WHEN provider_model LIKE '%GPT-4%' THEN 'GPT-4'
          WHEN provider_model LIKE '%GPT-3%' THEN 'GPT-3'
          WHEN provider_model LIKE '%Gemini%' THEN 'Gemini'
          WHEN provider_model LIKE '%Claude%' THEN 'Claude'
          WHEN provider_model LIKE '%LLaMA%' OR provider_model LIKE '%Llama%' THEN 'LLaMA'
          WHEN provider_model LIKE '%DALL-E%' THEN 'DALL-E'
          WHEN provider_model LIKE '%Whisper%' THEN 'Whisper'
          WHEN provider_model LIKE '%Midjourney%' THEN 'Midjourney'
          WHEN provider_model LIKE '%Stable Diffusion%' THEN 'Stable Diffusion'
          -- For cases with space, try to extract everything after first word as model
          WHEN position(' ' in provider_model) > 0 THEN 
            trim(substring(provider_model from position(' ' in provider_model) + 1))
          -- If no space, leave model as empty string (we have provider set)
          ELSE ''
        END
      WHERE provider IS NULL AND model IS NULL;
    `, { transaction });

      // Add indexes for the new columns for better performance
      await queryInterface.addIndex("model_inventories", ["provider"], { transaction });
      await queryInterface.addIndex("model_inventories", ["model"], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove indexes first
      await queryInterface.removeIndex("model_inventories", ["provider"], { transaction });
      await queryInterface.removeIndex("model_inventories", ["model"], { transaction });

      // Remove the new columns
      await queryInterface.removeColumn("model_inventories", "provider", { transaction });
      await queryInterface.removeColumn("model_inventories", "model", { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};