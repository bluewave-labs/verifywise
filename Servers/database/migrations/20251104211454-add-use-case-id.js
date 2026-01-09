'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Get all organizations to update their tenant schemas
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`, { transaction }
      );

      // Add uc_id column to each tenant's projects table
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Create a sequence for UC IDs in this tenant schema
        // Sequences ensure IDs are never reused, even after deletion
        await queryInterface.sequelize.query(`
          CREATE SEQUENCE IF NOT EXISTS "${tenantHash}".project_uc_id_seq;`,
          { transaction }
        );

        // Add the uc_id column as nullable first
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".projects
            ADD COLUMN IF NOT EXISTS uc_id VARCHAR(255) UNIQUE;`, { transaction });

        // Get existing projects ordered by id to maintain sequential order
        const existingProjects = await queryInterface.sequelize.query(
          `SELECT id FROM "${tenantHash}".projects ORDER BY id ASC;`,
          { transaction }
        );

        // Populate uc_id for existing projects with sequential IDs
        for (let i = 0; i < existingProjects[0].length; i++) {
          const ucId = `UC-${i + 1}`;
          await queryInterface.sequelize.query(
            `UPDATE "${tenantHash}".projects
             SET uc_id = :ucId
             WHERE id = :projectId;`,
            {
              replacements: { ucId, projectId: existingProjects[0][i].id },
              transaction
            }
          );
        }

        // Disallow NULLs now that every existing row has a UC ID
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".projects
             ALTER COLUMN uc_id SET NOT NULL;`,
          { transaction }
        );

        // Set the sequence to start after the last assigned UC ID
        // This ensures new projects get the next sequential number
        if (existingProjects[0].length > 0) {
          await queryInterface.sequelize.query(
            `SELECT setval('"${tenantHash}".project_uc_id_seq', :lastNumber);`,
            {
              replacements: { lastNumber: existingProjects[0].length },
              transaction
            }
          );
        }
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Get all organizations to update their tenant schemas
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`, { transaction }
      );

      // Remove uc_id column and sequence from each tenant's projects table
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.removeColumn(
          {
            tableName: 'projects',
            schema: tenantHash
          },
          'uc_id',
          { transaction }
        );

        // Drop the sequence
        await queryInterface.sequelize.query(
          `DROP SEQUENCE IF EXISTS "${tenantHash}".project_uc_id_seq;`,
          { transaction }
        );
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
