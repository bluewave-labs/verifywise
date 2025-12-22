'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Create ENUM type in public schema (shared across tenants)
      await queryInterface.sequelize.query(
        `DO $$ BEGIN
            CREATE TYPE public.enum_file_manager_source AS ENUM ('file_manager', 'policy_editor');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;`,
        { transaction }
      );

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".file_manager
            ADD COLUMN IF NOT EXISTS source public.enum_file_manager_source DEFAULT 'file_manager' NOT NULL;`,
          { transaction }
        );
      }

      await transaction.commit();
    } catch {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Drop ENUM type
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS public.enum_file_manager_source;`,
        { transaction }
      );

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".file_manager
            DROP COLUMN IF EXISTS source;`,
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
