"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE enum_files_source ADD VALUE IF NOT EXISTS 'dataset_bulk_upload';`
    );
  },

  async down() {
    // PostgreSQL does not support removing enum values
  },
};
