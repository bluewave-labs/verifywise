"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add profile_photo_id column to users table
      // Note: users table is in public schema, files are in tenant schemas
      // so we can't add a direct FK constraint. Referential integrity
      // is handled at application level
      await queryInterface.addColumn(
        "users",
        "profile_photo_id",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: "References file ID in tenant-specific files table",
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn("users", "profile_photo_id", {
        transaction,
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
