"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add deleted_by column
    await queryInterface.addColumn("comment_files", "deleted_by", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Add deleted_at column
    await queryInterface.addColumn("comment_files", "deleted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    console.log("Added deletion tracking fields to comment_files table");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("comment_files", "deleted_by");
    await queryInterface.removeColumn("comment_files", "deleted_at");
  },
};
