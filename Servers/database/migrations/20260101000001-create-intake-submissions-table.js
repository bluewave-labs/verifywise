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

        // Create intake_submissions table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".intake_submissions (
            id SERIAL PRIMARY KEY,

            -- Form reference
            form_id INTEGER NOT NULL REFERENCES "${tenantHash}".intake_forms(id) ON DELETE CASCADE,

            -- Submitter info (unauthenticated)
            submitter_email VARCHAR(255) NOT NULL,
            submitter_name VARCHAR(255) NOT NULL,

            -- Submission data
            data JSONB NOT NULL DEFAULT '{}',

            -- Created entity reference
            entity_type VARCHAR(50) NOT NULL,
            entity_id INTEGER,

            -- Workflow state
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            rejection_reason TEXT,
            reviewed_by INTEGER,
            reviewed_at TIMESTAMPTZ,

            -- Resubmission support
            original_submission_id INTEGER REFERENCES "${tenantHash}".intake_submissions(id) ON DELETE SET NULL,
            resubmission_count INTEGER NOT NULL DEFAULT 0,

            -- Audit
            ip_address VARCHAR(45),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `, { transaction });

        // Create indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_intake_submissions_form_id
          ON "${tenantHash}".intake_submissions (form_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_intake_submissions_status
          ON "${tenantHash}".intake_submissions (status);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_intake_submissions_submitter_email
          ON "${tenantHash}".intake_submissions (submitter_email);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_intake_submissions_entity
          ON "${tenantHash}".intake_submissions (entity_type, entity_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_intake_submissions_created_at
          ON "${tenantHash}".intake_submissions (created_at DESC);
        `, { transaction });
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
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".intake_submissions CASCADE;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
