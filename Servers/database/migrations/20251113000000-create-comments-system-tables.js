"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if comments table already exists
    const commentsTableExists = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.comments');`,
      { type: Sequelize.QueryTypes.SELECT },
    );

    if (!commentsTableExists[0].to_regclass) {
      await queryInterface.createTable("comments", {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        table_id: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        row_id: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        message: {
          type: Sequelize.TEXT,
          allowNull: false,
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

      // Create index for faster queries
      await queryInterface.addIndex("comments", ["table_id", "row_id", "organization_id"], {
        name: "comments_table_row_org_idx",
      });
    }

    // Check if comment_files table already exists
    const commentFilesTableExists = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.comment_files');`,
      { type: Sequelize.QueryTypes.SELECT },
    );

    if (!commentFilesTableExists[0].to_regclass) {
      await queryInterface.createTable("comment_files", {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        table_id: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        row_id: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        comment_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "comments",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        file_name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        file_path: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        file_size: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        mime_type: {
          type: Sequelize.STRING,
          allowNull: false,
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
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      });

      // Create index for faster queries
      await queryInterface.addIndex("comment_files", ["table_id", "row_id", "organization_id"], {
        name: "comment_files_table_row_org_idx",
      });
    }

    // Check if comment_reactions table already exists
    const commentReactionsTableExists = await queryInterface.sequelize.query(
      `SELECT to_regclass('public.comment_reactions');`,
      { type: Sequelize.QueryTypes.SELECT },
    );

    if (!commentReactionsTableExists[0].to_regclass) {
      await queryInterface.createTable("comment_reactions", {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        comment_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "comments",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        emoji: {
          type: Sequelize.STRING(10),
          allowNull: false,
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
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      });

      // Create unique index to prevent duplicate reactions
      await queryInterface.addIndex("comment_reactions", ["comment_id", "emoji", "user_id"], {
        name: "comment_reactions_unique_idx",
        unique: true,
      });
    }

    console.log("Comments system tables created successfully");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("comment_reactions");
    await queryInterface.dropTable("comment_files");
    await queryInterface.dropTable("comments");
  },
};
