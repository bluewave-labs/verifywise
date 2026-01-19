'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'File Manager' to enum_files_source if it doesn't exist
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_files_source')
          AND enumlabel = 'File Manager'
        ) THEN
          ALTER TYPE enum_files_source ADD VALUE 'File Manager';
        END IF;
      END $$;
    `);

    // Add 'policy_editor' to enum_files_source if it doesn't exist
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_files_source')
          AND enumlabel = 'policy_editor'
        ) THEN
          ALTER TYPE enum_files_source ADD VALUE 'policy_editor';
        END IF;
      END $$;
    `);
  },

  async down(queryInterface, Sequelize) {
    // ENUM values cannot be easily removed in PostgreSQL
    // Would require recreating the type and migrating data
  }
};
