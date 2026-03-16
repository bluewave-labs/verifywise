"use strict";

/**
 * Migration: Create AI Gateway prompt management tables
 *
 * Creates:
 * - ai_gateway_prompts: Prompt container (metadata, slug, name)
 * - ai_gateway_prompt_versions: Immutable versions (append-only, JSONB content)
 * - Adds prompt_id FK to ai_gateway_endpoints
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `SET search_path TO verifywise, public;`
    );

    // 1. Prompt container table
    await queryInterface.createTable(
      { tableName: "ai_gateway_prompts", schema: "verifywise" },
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        organization_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: { tableName: "organizations", schema: "verifywise" }, key: "id" },
          onDelete: "CASCADE",
        },
        slug: {
          type: Sequelize.STRING(128),
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: { tableName: "users", schema: "verifywise" }, key: "id" },
          onDelete: "SET NULL",
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn("NOW"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn("NOW"),
        },
      }
    );

    // Unique constraint: one slug per organization
    await queryInterface.addConstraint(
      { tableName: "ai_gateway_prompts", schema: "verifywise" },
      {
        fields: ["organization_id", "slug"],
        type: "unique",
        name: "uq_ai_gateway_prompts_org_slug",
      }
    );

    // 2. Prompt versions table (append-only)
    await queryInterface.createTable(
      { tableName: "ai_gateway_prompt_versions", schema: "verifywise" },
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        prompt_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: { tableName: "ai_gateway_prompts", schema: "verifywise" }, key: "id" },
          onDelete: "CASCADE",
        },
        organization_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: { tableName: "organizations", schema: "verifywise" }, key: "id" },
          onDelete: "CASCADE",
        },
        version: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        content: {
          type: Sequelize.JSONB,
          allowNull: false,
          comment: "Array of { role, content } messages",
        },
        variables: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: "Auto-detected template variables: string[]",
        },
        model: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        config: {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: "Model parameters: { temperature, max_tokens, top_p, ... }",
        },
        status: {
          type: Sequelize.STRING(16),
          allowNull: false,
          defaultValue: "draft",
          comment: "draft | published",
        },
        published_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        published_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: { tableName: "users", schema: "verifywise" }, key: "id" },
          onDelete: "SET NULL",
        },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: { tableName: "users", schema: "verifywise" }, key: "id" },
          onDelete: "SET NULL",
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn("NOW"),
        },
      }
    );

    // Unique constraint: one version number per prompt
    await queryInterface.addConstraint(
      { tableName: "ai_gateway_prompt_versions", schema: "verifywise" },
      {
        fields: ["prompt_id", "version"],
        type: "unique",
        name: "uq_ai_gateway_prompt_versions_prompt_version",
      }
    );

    // Index for fast lookup of published version
    await queryInterface.addIndex(
      { tableName: "ai_gateway_prompt_versions", schema: "verifywise" },
      {
        fields: ["prompt_id", "status"],
        name: "idx_ai_gateway_prompt_versions_prompt_status",
      }
    );

    // Index for org-scoped queries
    await queryInterface.addIndex(
      { tableName: "ai_gateway_prompt_versions", schema: "verifywise" },
      {
        fields: ["organization_id"],
        name: "idx_ai_gateway_prompt_versions_org",
      }
    );

    // 3. Add prompt_id FK to endpoints table
    await queryInterface.addColumn(
      { tableName: "ai_gateway_endpoints", schema: "verifywise" },
      "prompt_id",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: { tableName: "ai_gateway_prompts", schema: "verifywise" }, key: "id" },
        onDelete: "SET NULL",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `SET search_path TO verifywise, public;`
    );

    await queryInterface.removeColumn(
      { tableName: "ai_gateway_endpoints", schema: "verifywise" },
      "prompt_id"
    );

    await queryInterface.dropTable({
      tableName: "ai_gateway_prompt_versions",
      schema: "verifywise",
    });

    await queryInterface.dropTable({
      tableName: "ai_gateway_prompts",
      schema: "verifywise",
    });
  },
};
