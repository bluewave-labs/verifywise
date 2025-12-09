"use strict";

/**
 * Migration: Create plugin_states table for plugin system
 *
 * This table persists plugin installation and enable states across server restarts.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists
    const tableExists = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.plugin_states');`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tableExists[0].to_regclass) {
      console.log("Table plugin_states already exists, skipping creation");
      return;
    }

    // Create the plugin_states table
    await queryInterface.createTable("plugin_states", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenant: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: "default",
        comment: "Tenant identifier for multi-tenancy support",
      },
      plugin_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "Unique plugin identifier",
      },
      installed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether the plugin is installed",
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether the plugin is enabled",
      },
      config: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: "Plugin configuration as JSON",
      },
      installed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "When the plugin was installed",
      },
      enabled_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "When the plugin was last enabled",
      },
      installed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "User ID who installed the plugin",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    // Add unique constraint for tenant + plugin_id
    await queryInterface.addConstraint("plugin_states", {
      fields: ["tenant", "plugin_id"],
      type: "unique",
      name: "plugin_states_unique_plugin",
    });

    // Create indexes
    await queryInterface.addIndex("plugin_states", ["tenant", "enabled"], {
      name: "idx_plugin_states_enabled",
    });

    await queryInterface.addIndex("plugin_states", ["tenant", "installed"], {
      name: "idx_plugin_states_installed",
    });

    console.log("Created plugin_states table with indexes");
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex("plugin_states", "idx_plugin_states_enabled");
    await queryInterface.removeIndex("plugin_states", "idx_plugin_states_installed");

    // Drop the table
    await queryInterface.dropTable("plugin_states");

    console.log("Dropped plugin_states table");
  },
};
