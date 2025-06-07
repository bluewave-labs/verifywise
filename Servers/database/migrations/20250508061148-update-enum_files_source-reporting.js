'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const enumValues = [
        'Project risks report',
        'Compliance tracker report',
        'Assessment tracker report',
        'Vendors and risks report',
        'All reports',
      ];

      for (const value of enumValues) {
        // Check if the value already exists before adding it
        const checkQuery = `
          DO $$
          BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_files_source') AND enumlabel = '${value}') THEN
                  ALTER TYPE enum_files_source ADD VALUE '${value}';
              END IF;
          END
          $$;
        `;
        await queryInterface.sequelize.query(checkQuery, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // In the down migration, you would typically reverse the changes.
    // Removing enum values can be tricky if there's data using them.
    // You might need to cast columns to a new type or handle data migration before removal.
    // For simplicity, this down migration is left empty, but for production,
    // consider how to safely remove these enum values if needed.
  }
};