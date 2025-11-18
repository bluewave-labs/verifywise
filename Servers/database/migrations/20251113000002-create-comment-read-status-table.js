"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if comment_read_status table already exists
    const tableExists = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.comment_read_status');`,
      { type: Sequelize.QueryTypes.SELECT },
    );

    if (!tableExists[0].to_regclass) {
      await queryInterface.createTable("comment_read_status", {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        table_id: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        row_id: {
          type: Sequelize.STRING,
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
        last_read_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
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

      // Create unique index to ensure one read status per user per table/row
      await queryInterface.addIndex(
        "comment_read_status",
        ["user_id", "table_id", "row_id", "organization_id"],
        {
          name: "comment_read_status_unique_idx",
          unique: true,
        }
      );

      // Create index for faster queries by table/row
      await queryInterface.addIndex(
        "comment_read_status",
        ["table_id", "row_id", "organization_id"],
        {
          name: "comment_read_status_table_row_org_idx",
        }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex(
      "comment_read_status",
      "comment_read_status_unique_idx"
    );
    await queryInterface.removeIndex(
      "comment_read_status",
      "comment_read_status_table_row_org_idx"
    );

    // Drop the table
    await queryInterface.dropTable("comment_read_status");
  },
};
