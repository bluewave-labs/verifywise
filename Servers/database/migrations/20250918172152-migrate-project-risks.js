'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      )
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".projectrisks RENAME TO risks;`, { transaction }
        );
        await queryInterface.sequelize.query(
          `CREATE TABLE "${tenantHash}".projects_risks (
            risk_id INTEGER NOT NULL,
            project_id INTEGER NOT NULL,
            CONSTRAINT projects_risks_pkey PRIMARY KEY (risk_id, project_id),
            CONSTRAINT projects_risks_risk_id_fkey FOREIGN KEY (risk_id) REFERENCES "${tenantHash}".risks(id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT projects_risks_project_id_fkey FOREIGN KEY (project_id) REFERENCES "${tenantHash}".projects(id) ON DELETE CASCADE ON UPDATE CASCADE
          );`, { transaction }
        );
        const risks = await queryInterface.sequelize.query(
          `SELECT id, project_id FROM "${tenantHash}".risks;`, { transaction }
        );
        for (let risk of risks[0]) {
          await queryInterface.sequelize.query(
            `INSERT INTO "${tenantHash}".projects_risks (risk_id, project_id) VALUES (${risk.id}, ${risk.project_id});`, { transaction }
          );
        }
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".risks DROP COLUMN project_id;`, { transaction }
        );

        await queryInterface.sequelize.query(
          `CREATE TABLE "${tenantHash}".frameworks_risks (
            risk_id INTEGER NOT NULL,
            framework_id INTEGER NOT NULL,
            CONSTRAINT frameworks_risks_pkey PRIMARY KEY (risk_id, framework_id),
            CONSTRAINT frameworks_risks_risk_id_fkey FOREIGN KEY (risk_id) REFERENCES "${tenantHash}".risks(id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT frameworks_risks_framework_id_fkey FOREIGN KEY (framework_id) REFERENCES public.frameworks(id) ON DELETE CASCADE ON UPDATE CASCADE
          );`, { transaction }
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
        `SELECT id FROM organizations;`, { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Add project_id column back to risks table
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".risks ADD COLUMN project_id INTEGER;`, { transaction }
        );

        // Migrate data back from projects_risks junction table to risks.project_id
        const projectRisks = await queryInterface.sequelize.query(
          `SELECT DISTINCT ON (risk_id) risk_id, project_id FROM "${tenantHash}".projects_risks;`, { transaction }
        );

        for (let projectRisk of projectRisks[0]) {
          await queryInterface.sequelize.query(
            `UPDATE "${tenantHash}".risks SET project_id = ${projectRisk.project_id} WHERE id = ${projectRisk.risk_id};`, { transaction }
          );
        }

        // Drop the junction tables
        await queryInterface.sequelize.query(
          `DROP TABLE "${tenantHash}".projects_risks;`, { transaction }
        );

        await queryInterface.sequelize.query(
          `DROP TABLE "${tenantHash}".frameworks_risks;`, { transaction }
        );

        // Rename risks table back to projectrisks
        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".risks RENAME TO projectrisks;`, { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
