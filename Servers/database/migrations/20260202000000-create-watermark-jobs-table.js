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

      for (let org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        // Create watermark_jobs table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".watermark_jobs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES public.users(id),
            type VARCHAR(20) NOT NULL CHECK (type IN ('embed', 'detect')),
            status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

            -- Input file info
            input_file_id INTEGER NULL,
            input_file_name VARCHAR(255) NOT NULL,
            input_file_type VARCHAR(50) NOT NULL,
            input_file_size BIGINT NULL,

            -- Output file (for embed operations)
            output_file_id INTEGER NULL,

            -- Enterprise links
            model_id INTEGER NULL,
            project_id INTEGER NULL,
            evidence_id INTEGER NULL,

            -- Settings and results
            settings JSONB DEFAULT '{}',
            result JSONB NULL,
            error_message TEXT NULL,
            processing_time_ms INTEGER NULL,

            -- Timestamps
            created_at TIMESTAMP DEFAULT NOW(),
            completed_at TIMESTAMP NULL,
            is_demo BOOLEAN DEFAULT FALSE
          );
        `, { transaction });

        // Create indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_watermark_jobs_user_id
          ON "${tenantHash}".watermark_jobs(user_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_watermark_jobs_status
          ON "${tenantHash}".watermark_jobs(status);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_watermark_jobs_type
          ON "${tenantHash}".watermark_jobs(type);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_watermark_jobs_model_id
          ON "${tenantHash}".watermark_jobs(model_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_watermark_jobs_created_at
          ON "${tenantHash}".watermark_jobs(created_at DESC);
        `, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".watermark_jobs;
        `, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
