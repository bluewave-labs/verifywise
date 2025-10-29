'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all existing organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Check if schema exists before proceeding
        const [schemaExists] = await queryInterface.sequelize.query(
          `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${tenantHash}';`,
          { transaction }
        );

        if (schemaExists.length === 0) {
          console.log(`Schema ${tenantHash} does not exist, skipping...`);
          continue;
        }

        // Add use_case_id column to projects table
        try {
          // Check if column already exists
          const [columnExists] = await queryInterface.sequelize.query(
            `SELECT column_name FROM information_schema.columns
             WHERE table_schema = '${tenantHash}'
             AND table_name = 'projects'
             AND column_name = 'use_case_id';`,
            { transaction }
          );

          if (columnExists.length === 0) {
            await queryInterface.addColumn(
              { tableName: 'projects', schema: tenantHash },
              'use_case_id',
              {
                type: Sequelize.STRING,
                allowNull: true,
                unique: true
              },
              { transaction }
            );

            console.log(`Added use_case_id column to ${tenantHash}.projects`);

            // Get existing projects and assign UC IDs
            const [existingProjects] = await queryInterface.sequelize.query(
              `SELECT id FROM "${tenantHash}"."projects" WHERE is_demo = false ORDER BY id ASC;`,
              { transaction }
            );

            // Assign sequential UC IDs to existing non-demo projects
            for (let i = 0; i < existingProjects.length; i++) {
              const ucId = `UC-${i + 1}`;
              await queryInterface.sequelize.query(
                `UPDATE "${tenantHash}"."projects" SET use_case_id = :ucId WHERE id = :id;`,
                {
                  replacements: { ucId, id: existingProjects[i].id },
                  transaction
                }
              );
            }

            console.log(`Assigned UC IDs to ${existingProjects.length} existing projects in ${tenantHash}`);
          } else {
            console.log(`Column use_case_id already exists in ${tenantHash}.projects`);
          }
        } catch (error) {
          console.log(`Error updating projects table for ${tenantHash}: ${error.message}`);
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all existing organizations
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Check if schema exists before proceeding
        const [schemaExists] = await queryInterface.sequelize.query(
          `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${tenantHash}';`,
          { transaction }
        );

        if (schemaExists.length === 0) {
          continue;
        }

        // Remove use_case_id column from projects table
        try {
          await queryInterface.removeColumn(
            { tableName: 'projects', schema: tenantHash },
            'use_case_id',
            { transaction }
          );

          console.log(`Removed use_case_id column from ${tenantHash}.projects`);
        } catch (error) {
          console.log(`Error removing use_case_id column from projects table for ${tenantHash}: ${error.message}`);
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
