'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`, { transaction }
      )
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        const iso42001_projects_frameworks = await queryInterface.sequelize.query(
          `SELECT * FROM "${tenantHash}".projects_frameworks WHERE framework_id = 2 ORDER BY is_demo;`, { transaction }
        )
        if (iso42001_projects_frameworks[0].length === 0) {
          continue;
        }
        const iso42001_projects_framework = iso42001_projects_frameworks[0][0];
        const iso42001_projects_framework_to_delete = iso42001_projects_frameworks[0].slice(1).map(pf => pf.id);

        let project = await queryInterface.sequelize.query(
          `SELECT id FROM "${tenantHash}".projects WHERE is_organizational = true;`, { transaction }
        );
        project = project[0][0];
        if (!project) {
          const project_insert = await queryInterface.sequelize.query(
            `SELECT * FROM "${tenantHash}".projects WHERE id = ${iso42001_projects_framework.project_id};`, { transaction });

          const createdOrgProject = await queryInterface.sequelize.query(
            `INSERT INTO "${tenantHash}".projects(
              project_title, owner, start_date, ai_risk_classification, type_of_high_risk_role, goal, last_updated, last_updated_by, is_demo, created_at, is_organizational
            ) VALUES (
              :project_title, :owner, :start_date, :ai_risk_classification, :type_of_high_risk_role, :goal, :last_updated, :last_updated_by, :is_demo, :created_at, :is_organizational
            ) RETURNING id;`, {
            replacements: {
              ...project_insert[0][0],
              is_organizational: true
            },
            transaction
          });
          project = createdOrgProject[0][0];
        };

        await queryInterface.sequelize.query(
          `UPDATE "${tenantHash}".projects_frameworks SET project_id = ${project.id} WHERE id = ${iso42001_projects_framework.id};`, { transaction }
        );

        if (iso42001_projects_framework_to_delete.length > 0) {
          await queryInterface.sequelize.query(
            `DELETE FROM "${tenantHash}".projects_frameworks WHERE id IN (${iso42001_projects_framework_to_delete.join(', ')});`, { transaction }
          );
        }

        await queryInterface.sequelize.query(
          `DELETE FROM "${tenantHash}".projects WHERE id IN (
            SELECT p.id FROM "${tenantHash}".projects AS p LEFT JOIN "${tenantHash}".projects_frameworks AS pf ON p.id = pf.project_id WHERE pf.id IS NULL
          );`, { transaction }
        )
      }

      await queryInterface.sequelize.query(
        `UPDATE public.frameworks SET is_organizational = true WHERE id = 2;`, { transaction }
      );
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM public.organizations;`, { transaction }
      )
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        const iso42001_projects_frameworks = await queryInterface.sequelize.query(
          `SELECT * FROM "${tenantHash}".projects_frameworks WHERE framework_id = 2;`, { transaction }
        )
        if (iso42001_projects_frameworks[0].length === 0) {
          continue;
        }
        const iso42001_projects_framework = iso42001_projects_frameworks[0][0];

        const count = await queryInterface.sequelize.query(
          `SELECT COUNT(*) FROM "${tenantHash}".projects_frameworks WHERE project_id = :projectId;`, { transaction, replacements: { projectId: iso42001_projects_framework.project_id } }
        );
        if (count[0][0].count === 1) {
          await queryInterface.sequelize.query(
            `UPDATE "${tenantHash}".projects SET is_organizational = false WHERE id = :projectId;`, { transaction, replacements: { projectId: iso42001_projects_framework.project_id } }
          )
        } else {
          const project_insert = await queryInterface.sequelize.query(
            `SELECT * FROM "${tenantHash}".projects WHERE id = ${iso42001_projects_framework.project_id};`, { transaction });

          const createdOrgProject = await queryInterface.sequelize.query(
            `INSERT INTO "${tenantHash}".projects(
              project_title, owner, start_date, ai_risk_classification, type_of_high_risk_role, goal, last_updated, last_updated_by, is_demo, created_at, is_organizational
            ) VALUES (
              :project_title, :owner, :start_date, :ai_risk_classification, :type_of_high_risk_role, :goal, :last_updated, :last_updated_by, :is_demo, :created_at, :is_organizational
            ) RETURNING id;`, {
            replacements: {
              ...project_insert[0][0],
              is_organizational: false
            },
            transaction
          });
          await queryInterface.sequelize.query(
            `UPDATE "${tenantHash}".projects_frameworks SET project_id = :newProjectId WHERE id = :pfId;`, {
            transaction,
            replacements: {
              newProjectId: createdOrgProject[0][0].id,
              pfId: iso42001_projects_framework.id
            }
          });
        }
      }
      await queryInterface.sequelize.query(
        `UPDATE public.frameworks SET is_organizational = false WHERE id = 2;`, { transaction }
      );
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
