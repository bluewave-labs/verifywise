'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        // Create file_manager table for organization-wide file storage
        (tenantHash) => `CREATE TABLE "${tenantHash}".file_manager (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          size BIGINT NOT NULL,
          mimetype VARCHAR(255) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          uploaded_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          org_id INTEGER NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
          is_demo BOOLEAN NOT NULL DEFAULT FALSE
        );`,

        // Create file_access_logs table for audit trail
        (tenantHash) => `CREATE TABLE "${tenantHash}".file_access_logs (
          id SERIAL PRIMARY KEY,
          file_id INTEGER NOT NULL REFERENCES "${tenantHash}".file_manager(id) ON DELETE CASCADE,
          accessed_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          access_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          action VARCHAR(20) NOT NULL CHECK (action IN ('download', 'view')),
          org_id INTEGER NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE
        );`,

        // Create indexes for better query performance
        (tenantHash) => `CREATE INDEX idx_file_manager_org_id ON "${tenantHash}".file_manager(org_id);`,
        (tenantHash) => `CREATE INDEX idx_file_manager_uploaded_by ON "${tenantHash}".file_manager(uploaded_by);`,
        (tenantHash) => `CREATE INDEX idx_file_manager_upload_date ON "${tenantHash}".file_manager(upload_date DESC);`,
        (tenantHash) => `CREATE INDEX idx_file_access_logs_file_id ON "${tenantHash}".file_access_logs(file_id);`,
        (tenantHash) => `CREATE INDEX idx_file_access_logs_accessed_by ON "${tenantHash}".file_access_logs(accessed_by);`,
        (tenantHash) => `CREATE INDEX idx_file_access_logs_access_date ON "${tenantHash}".file_access_logs(access_date DESC);`,
      ];

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        const queriesWithTenant = queries.map(query => query(tenantHash));
        for (const query of queriesWithTenant) {
          await queryInterface.sequelize.query(query, { transaction });
        }
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
        (tenantHash) => `DROP TABLE IF EXISTS "${tenantHash}".file_access_logs;`,
        (tenantHash) => `DROP TABLE IF EXISTS "${tenantHash}".file_manager;`,
      ];

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        const queriesWithTenant = queries.map(query => query(tenantHash));
        for (const query of queriesWithTenant) {
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
