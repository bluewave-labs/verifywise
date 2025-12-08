"use strict";

/**
 * Migration: Create entity_metadata table for plugin system
 *
 * This table provides schemaless key-value storage for plugins,
 * allowing them to store custom data without requiring database migrations.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists
    const tableExists = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.entity_metadata');`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tableExists[0].to_regclass) {
      console.log("Table entity_metadata already exists, skipping creation");
      return;
    }

    // Create the entity_metadata table
    await queryInterface.createTable("entity_metadata", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenant: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "Tenant identifier for multi-tenancy support",
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: "Type of entity (e.g., risk, project, user, vendor)",
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "ID of the entity this metadata belongs to",
      },
      plugin_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "ID of the plugin that owns this metadata",
      },
      meta_key: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: "Key name for the metadata",
      },
      meta_value: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: "JSON value for the metadata",
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

    // Add unique constraint for tenant + entity + plugin + key combination
    await queryInterface.addConstraint("entity_metadata", {
      fields: ["tenant", "entity_type", "entity_id", "plugin_id", "meta_key"],
      type: "unique",
      name: "entity_metadata_unique_key",
    });

    // Create indexes for common query patterns
    await queryInterface.addIndex("entity_metadata", ["tenant", "entity_type", "entity_id"], {
      name: "idx_entity_metadata_entity",
    });

    await queryInterface.addIndex("entity_metadata", ["tenant", "plugin_id"], {
      name: "idx_entity_metadata_plugin",
    });

    await queryInterface.addIndex("entity_metadata", ["tenant", "entity_type", "meta_key"], {
      name: "idx_entity_metadata_key_lookup",
    });

    // Index for getAllByPlugin() which orders by created_at DESC
    await queryInterface.addIndex("entity_metadata", ["tenant", "plugin_id", "created_at"], {
      name: "idx_entity_metadata_plugin_created",
    });

    console.log("Created entity_metadata table with indexes");
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex("entity_metadata", "idx_entity_metadata_entity");
    await queryInterface.removeIndex("entity_metadata", "idx_entity_metadata_plugin");
    await queryInterface.removeIndex("entity_metadata", "idx_entity_metadata_key_lookup");
    await queryInterface.removeIndex("entity_metadata", "idx_entity_metadata_plugin_created");

    // Drop the table
    await queryInterface.dropTable("entity_metadata");

    console.log("Dropped entity_metadata table");
  },
};
