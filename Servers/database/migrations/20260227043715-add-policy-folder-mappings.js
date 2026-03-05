'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Create policy_folder_mappings table in public schema
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS policy_folder_mappings (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          policy_id INTEGER NOT NULL,
          folder_id INTEGER NOT NULL REFERENCES virtual_folders(id) ON DELETE CASCADE,
          assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT unique_policy_folder UNIQUE (policy_id, folder_id, organization_id)
        );
      `, { transaction });

      // Create indexes
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_policy_folder_mappings_org_id ON policy_folder_mappings(organization_id);
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_policy_folder_mappings_policy_id ON policy_folder_mappings(policy_id);
      `, { transaction });

      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_policy_folder_mappings_folder_id ON policy_folder_mappings(folder_id);
      `, { transaction });

      await transaction.commit();
      console.log('Created policy_folder_mappings table in public schema');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS policy_folder_mappings;
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
