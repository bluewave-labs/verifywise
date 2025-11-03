'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Create the junction table in tenant schema
        await queryInterface.sequelize.query(
          `CREATE TABLE "${tenantHash}".model_inventories_projects_frameworks (
            id SERIAL PRIMARY KEY,
            model_inventory_id INTEGER NOT NULL,
            project_id INTEGER,
            framework_id INTEGER,
            CONSTRAINT unique_model_project_framework
              UNIQUE (model_inventory_id, project_id, framework_id),
            CONSTRAINT fk_model_inventory
              FOREIGN KEY (model_inventory_id)
              REFERENCES "${tenantHash}".model_inventories(id)
              ON DELETE CASCADE,
            CONSTRAINT fk_project
              FOREIGN KEY (project_id)
              REFERENCES "${tenantHash}".projects(id)
              ON DELETE CASCADE,
            CONSTRAINT fk_framework
              FOREIGN KEY (framework_id)
              REFERENCES public.frameworks(id)
              ON DELETE CASCADE,
            CONSTRAINT check_project_or_framework
              CHECK (
                (project_id IS NOT NULL AND framework_id IS NULL) OR
                (project_id IS NULL AND framework_id IS NOT NULL) OR
                (project_id IS NOT NULL AND framework_id IS NOT NULL)
              )
          );`,
          { transaction }
        );

        // Create index for better query performance
        await queryInterface.sequelize.query(
          `CREATE INDEX idx_model_inventories_projects_frameworks_model_id
            ON "${tenantHash}".model_inventories_projects_frameworks(model_inventory_id);`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `CREATE INDEX idx_model_inventories_projects_frameworks_project_id
            ON "${tenantHash}".model_inventories_projects_frameworks(project_id);`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `CREATE INDEX idx_model_inventories_projects_frameworks_framework_id
            ON "${tenantHash}".model_inventories_projects_frameworks(framework_id);`,
          { transaction }
        );
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
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".model_inventories_projects_frameworks CASCADE;`,
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
