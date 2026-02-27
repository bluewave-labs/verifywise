'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Get all organizations
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      // 2. Import getTenantHash (MUST use dist path)
      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      // 3. Loop over all tenants
      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Create policy_folder_mappings table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".policy_folder_mappings (
            id SERIAL PRIMARY KEY,
            policy_id INTEGER NOT NULL,
            folder_id INTEGER NOT NULL REFERENCES "${tenantHash}".virtual_folders(id) ON DELETE CASCADE,
            assigned_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT unique_policy_folder UNIQUE (policy_id, folder_id)
          );
        `, { transaction });

        // Create indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_policy_folder_mappings_policy_id ON "${tenantHash}".policy_folder_mappings(policy_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_policy_folder_mappings_folder_id ON "${tenantHash}".policy_folder_mappings(folder_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_policy_folder_mappings_assigned_by ON "${tenantHash}".policy_folder_mappings(assigned_by);
        `, { transaction });

        console.log(`Created policy_folder_mappings for tenant ${tenantHash}`);
      }

      // 4. Commit
      await transaction.commit();
      console.log('Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".policy_folder_mappings;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
