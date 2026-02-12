"use strict";

const { DataTypes } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // 1. shadow_ai_connectors
    await queryInterface.createTable("shadow_ai_connectors", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      type: {
        type: DataTypes.ENUM("splunk", "sentinel", "qradar", "zscaler", "netskope", "syslog", "webhook"),
        allowNull: false,
      },
      config: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      status: {
        type: DataTypes.ENUM("active", "paused", "error", "configuring"),
        allowNull: false,
        defaultValue: "configuring",
      },
      last_sync_at: { type: DataTypes.DATE, allowNull: true },
      last_error: { type: DataTypes.TEXT, allowNull: true },
      events_ingested: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    });

    // 2. shadow_ai_events
    await queryInterface.createTable("shadow_ai_events", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      connector_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "shadow_ai_connectors", key: "id" },
        onDelete: "CASCADE",
      },
      raw_event_id: { type: DataTypes.STRING, allowNull: true },
      timestamp: { type: DataTypes.DATE, allowNull: false },
      user_identifier: { type: DataTypes.STRING, allowNull: true },
      department: { type: DataTypes.STRING, allowNull: true },
      ai_tool_name: { type: DataTypes.STRING, allowNull: false },
      ai_tool_category: { type: DataTypes.STRING, allowNull: true },
      action_type: {
        type: DataTypes.ENUM("access", "upload", "download", "prompt", "api_call", "login", "data_share", "other"),
        allowNull: false,
        defaultValue: "access",
      },
      data_classification: {
        type: DataTypes.ENUM("public", "internal", "confidential", "restricted", "pii", "phi", "financial", "unknown"),
        allowNull: true,
        defaultValue: "unknown",
      },
      source_ip: { type: DataTypes.STRING, allowNull: true },
      destination_url: { type: DataTypes.TEXT, allowNull: true },
      metadata: { type: DataTypes.JSONB, allowNull: true },
      risk_score: { type: DataTypes.INTEGER, allowNull: true },
      risk_level: {
        type: DataTypes.ENUM("critical", "high", "medium", "low", "info"),
        allowNull: true,
      },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    });

    // Indexes for events
    await queryInterface.addIndex("shadow_ai_events", ["timestamp"]);
    await queryInterface.addIndex("shadow_ai_events", ["ai_tool_name"]);
    await queryInterface.addIndex("shadow_ai_events", ["user_identifier"]);
    await queryInterface.addIndex("shadow_ai_events", ["risk_level"]);
    await queryInterface.addIndex("shadow_ai_events", ["connector_id"]);

    // 3. shadow_ai_inventory
    await queryInterface.createTable("shadow_ai_inventory", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      tool_name: { type: DataTypes.STRING, allowNull: false },
      tool_domain: { type: DataTypes.STRING, allowNull: false },
      category: {
        type: DataTypes.ENUM(
          "generative_ai", "code_assistant", "image_generation", "video_generation",
          "voice_ai", "translation", "data_analysis", "search_ai",
          "writing_assistant", "chatbot", "automation", "ml_platform", "other"
        ),
        allowNull: false,
        defaultValue: "other",
      },
      first_seen: { type: DataTypes.DATE, allowNull: false },
      last_seen: { type: DataTypes.DATE, allowNull: false },
      total_events: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      unique_users: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      departments: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
      risk_classification: {
        type: DataTypes.ENUM("critical", "high", "medium", "low", "unclassified"),
        allowNull: false,
        defaultValue: "unclassified",
      },
      approval_status: {
        type: DataTypes.ENUM("discovered", "under_review", "approved", "blocked"),
        allowNull: false,
        defaultValue: "discovered",
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    });

    await queryInterface.addIndex("shadow_ai_inventory", ["tool_name"], { unique: true });

    // 4. shadow_ai_policies
    await queryInterface.createTable("shadow_ai_policies", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      department_scope: { type: DataTypes.JSONB, allowNull: true },
      rules: { type: DataTypes.JSONB, allowNull: false },
      severity: {
        type: DataTypes.ENUM("critical", "high", "medium", "low"),
        allowNull: false,
        defaultValue: "medium",
      },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    });

    // 5. shadow_ai_violations
    await queryInterface.createTable("shadow_ai_violations", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "shadow_ai_events", key: "id" },
        onDelete: "CASCADE",
      },
      policy_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "shadow_ai_policies", key: "id" },
        onDelete: "CASCADE",
      },
      user_identifier: { type: DataTypes.STRING, allowNull: true },
      department: { type: DataTypes.STRING, allowNull: true },
      severity: {
        type: DataTypes.ENUM("critical", "high", "medium", "low"),
        allowNull: false,
      },
      description: { type: DataTypes.TEXT, allowNull: false },
      status: {
        type: DataTypes.ENUM("open", "acknowledged", "resolved", "excepted"),
        allowNull: false,
        defaultValue: "open",
      },
      resolved_by: { type: DataTypes.INTEGER, allowNull: true },
      resolved_at: { type: DataTypes.DATE, allowNull: true },
      exception_id: { type: DataTypes.INTEGER, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    });

    await queryInterface.addIndex("shadow_ai_violations", ["status"]);
    await queryInterface.addIndex("shadow_ai_violations", ["severity"]);
    await queryInterface.addIndex("shadow_ai_violations", ["policy_id"]);

    // 6. shadow_ai_exceptions
    await queryInterface.createTable("shadow_ai_exceptions", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      policy_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "shadow_ai_policies", key: "id" },
        onDelete: "CASCADE",
      },
      department: { type: DataTypes.STRING, allowNull: true },
      user_identifier: { type: DataTypes.STRING, allowNull: true },
      reason: { type: DataTypes.TEXT, allowNull: false },
      compensating_controls: { type: DataTypes.TEXT, allowNull: true },
      approved_by: { type: DataTypes.INTEGER, allowNull: true },
      approved_at: { type: DataTypes.DATE, allowNull: true },
      expires_at: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.ENUM("pending", "approved", "expired", "revoked"),
        allowNull: false,
        defaultValue: "pending",
      },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    });

    // 7. shadow_ai_reviews
    await queryInterface.createTable("shadow_ai_reviews", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      review_type: {
        type: DataTypes.ENUM("tool_approval", "violation_review", "exception_request", "periodic_audit"),
        allowNull: false,
      },
      subject_id: { type: DataTypes.INTEGER, allowNull: false },
      subject_type: { type: DataTypes.STRING, allowNull: false },
      assigned_to: { type: DataTypes.INTEGER, allowNull: true },
      status: {
        type: DataTypes.ENUM("pending", "in_progress", "completed", "escalated"),
        allowNull: false,
        defaultValue: "pending",
      },
      decision: { type: DataTypes.TEXT, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      completed_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    });

    await queryInterface.addIndex("shadow_ai_reviews", ["status"]);
    await queryInterface.addIndex("shadow_ai_reviews", ["review_type"]);

    // 8. shadow_ai_evidence_exports
    await queryInterface.createTable("shadow_ai_evidence_exports", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      date_range_start: { type: DataTypes.DATE, allowNull: false },
      date_range_end: { type: DataTypes.DATE, allowNull: false },
      filters: { type: DataTypes.JSONB, allowNull: true },
      export_format: {
        type: DataTypes.ENUM("pdf", "csv", "json"),
        allowNull: false,
        defaultValue: "csv",
      },
      file_path: { type: DataTypes.STRING, allowNull: true },
      generated_by: { type: DataTypes.INTEGER, allowNull: true },
      generated_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("shadow_ai_evidence_exports");
    await queryInterface.dropTable("shadow_ai_reviews");
    await queryInterface.dropTable("shadow_ai_exceptions");
    await queryInterface.dropTable("shadow_ai_violations");
    await queryInterface.dropTable("shadow_ai_policies");
    await queryInterface.dropTable("shadow_ai_inventory");
    await queryInterface.dropTable("shadow_ai_events");
    await queryInterface.dropTable("shadow_ai_connectors");
  },
};
