'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Create virtual_folders table for hierarchical folder structure
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".virtual_folders (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT NULL,
            parent_id INTEGER NULL REFERENCES "${tenantHash}".virtual_folders(id) ON DELETE CASCADE,
            color VARCHAR(7) NULL,
            icon VARCHAR(50) NULL,
            is_system BOOLEAN DEFAULT FALSE,
            created_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT unique_folder_name_per_parent UNIQUE (parent_id, name),
            CONSTRAINT no_circular_reference CHECK (id != parent_id)
          );
        `, { transaction });

        // Create file_folder_mappings junction table
        // Note: file_id references the files table, not file_manager
        // The foreign key is intentionally omitted to allow flexibility since
        // files can come from multiple sources (files table, evidence hub, etc.)
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".file_folder_mappings (
            id SERIAL PRIMARY KEY,
            file_id INTEGER NOT NULL,
            folder_id INTEGER NOT NULL REFERENCES "${tenantHash}".virtual_folders(id) ON DELETE CASCADE,
            assigned_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT unique_file_folder UNIQUE (file_id, folder_id)
          );
        `, { transaction });

        // Create indexes for better query performance
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_virtual_folders_parent_id ON "${tenantHash}".virtual_folders(parent_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_virtual_folders_created_by ON "${tenantHash}".virtual_folders(created_by);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_virtual_folders_name ON "${tenantHash}".virtual_folders(name);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_file_folder_mappings_file_id ON "${tenantHash}".file_folder_mappings(file_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_file_folder_mappings_folder_id ON "${tenantHash}".file_folder_mappings(folder_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_file_folder_mappings_assigned_by ON "${tenantHash}".file_folder_mappings(assigned_by);
        `, { transaction });

        console.log(`Created virtual folder tables for tenant ${tenantHash}`);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        (tenantHash) => `DROP TABLE IF EXISTS "${tenantHash}".file_folder_mappings;`,
        (tenantHash) => `DROP TABLE IF EXISTS "${tenantHash}".virtual_folders;`,
      ];

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        for (const queryFn of queries) {
          const query = queryFn(tenantHash);
          await queryInterface.sequelize.query(query, { transaction });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
