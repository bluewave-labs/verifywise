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

        // Get all model inventories with their used_in_projects data
        const modelInventories = await queryInterface.sequelize.query(
          `SELECT id, used_in_projects
            FROM "${tenantHash}".model_inventories
            WHERE used_in_projects IS NOT NULL AND used_in_projects != '';`,
          { transaction }
        );

        // Get all projects for this tenant
        const projects = await queryInterface.sequelize.query(
          `SELECT id, project_title FROM "${tenantHash}".projects WHERE is_organizational = true;`,
          { transaction }
        );

        // Get all frameworks
        const frameworks = await queryInterface.sequelize.query(
          `SELECT id, name FROM public.frameworks;`,
          { transaction }
        );

        // Create project title to ID map
        const projectMap = new Map();
        for (const project of projects[0]) {
          projectMap.set(project.project_title.trim(), project.id);
        }

        // Create framework name to ID map
        const frameworkMap = new Map();
        for (const framework of frameworks[0]) {
          frameworkMap.set(framework.name.trim(), framework.id);
        }

        // Migrate data for each model inventory
        for (const modelInventory of modelInventories[0]) {
          const modelId = modelInventory.id;
          const usedInProjects = modelInventory.used_in_projects || '';

          // Parse used_in_projects (comma-separated list)
          // Format: "Project Title - Framework Name" (e.g., "Information Security & AI Governance Framework - ISO 42001")
          const entries = usedInProjects
            .split(',')
            .map(p => p.trim())
            .filter(p => p.length > 0);

          for (const entry of entries) {
            // Split by " - " to get project and framework
            // Entry format is always "Project Title - Framework Name"
            const parts = entry.split(' - ');
            if (parts.length >= 2) {
              const projectTitle = parts[0].trim();
              const frameworkName = parts.slice(1).join(' - ').trim(); // In case framework name contains " - "

              const projectId = projectMap.get(projectTitle);
              const frameworkId = frameworkMap.get(frameworkName);

              if (projectId && frameworkId) {
                try {
                  await queryInterface.sequelize.query(
                    `INSERT INTO "${tenantHash}".model_inventories_projects_frameworks
                      (model_inventory_id, project_id, framework_id, created_at, updated_at)
                      VALUES (:model_inventory_id, :project_id, :framework_id, NOW(), NOW())
                      ON CONFLICT (model_inventory_id, project_id, framework_id) DO NOTHING;`,
                    {
                      transaction,
                      replacements: {
                        model_inventory_id: modelId,
                        project_id: projectId,
                        framework_id: frameworkId
                      }
                    }
                  );
                } catch (error) {
                  console.warn(`Warning: Could not migrate "${entry}" for model ${modelId}:`, error.message);
                }
              } else {
                console.warn(`Warning: Could not find project or framework for "${entry}" (projectId: ${projectId}, frameworkId: ${frameworkId})`);
              }
            } else {
              console.warn(`Warning: Invalid format for entry "${entry}" - expected "Project - Framework"`);
            }
          }
        }

        // Drop the old column
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".model_inventories
            DROP COLUMN IF EXISTS used_in_projects;`,
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

        // Re-add the column
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".model_inventories
            ADD COLUMN used_in_projects TEXT NOT NULL DEFAULT '';`,
          { transaction }
        );

        // Migrate data back from relation table
        const relations = await queryInterface.sequelize.query(
          `SELECT
            mipf.model_inventory_id,
            p.project_title,
            f.name as framework_name
          FROM "${tenantHash}".model_inventories_projects_frameworks mipf
          LEFT JOIN "${tenantHash}".projects p ON mipf.project_id = p.id
          LEFT JOIN public.frameworks f ON mipf.framework_id = f.id;`,
          { transaction }
        );

        // Group by model_inventory_id and reconstruct combined format
        const modelData = new Map();
        for (const relation of relations[0]) {
          if (!modelData.has(relation.model_inventory_id)) {
            modelData.set(relation.model_inventory_id, []);
          }
          const entries = modelData.get(relation.model_inventory_id);

          // Reconstruct the format:
          // - If both project and framework: "Project Title - Framework Name"
          // - If only project: "Project Title"
          // - If only framework: skip (frameworks alone weren't stored in old format)
          if (relation.project_title && relation.framework_name) {
            entries.push(`${relation.project_title} - ${relation.framework_name}`);
          } else if (relation.project_title) {
            entries.push(relation.project_title);
          }
        }

        // Update model_inventories table
        for (const [modelId, entries] of modelData.entries()) {
          await queryInterface.sequelize.query(
            `UPDATE "${tenantHash}".model_inventories
              SET used_in_projects = :projects
              WHERE id = :id;`,
            {
              transaction,
              replacements: {
                id: modelId,
                projects: entries.join(', ')
              }
            }
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
