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

        // Check if table already exists
        const [tables] = await queryInterface.sequelize.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = '${tenantHash}'
          AND table_name = 'deepeval_arena_comparisons';
        `, { transaction });

        if (tables.length > 0) {
          console.log(`deepeval_arena_comparisons table already exists for tenant ${tenantHash}, skipping`);
          continue;
        }

        // Create deepeval_arena_comparisons table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".deepeval_arena_comparisons (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            org_id VARCHAR(255) REFERENCES "${tenantHash}".deepeval_organizations(id) ON DELETE CASCADE,
            contestants JSONB NOT NULL DEFAULT '[]',
            contestant_names JSONB NOT NULL DEFAULT '[]',
            metric_config JSONB NOT NULL DEFAULT '{}',
            judge_model VARCHAR(255) DEFAULT 'gpt-4o',
            status VARCHAR(50) DEFAULT 'pending',
            progress TEXT,
            winner VARCHAR(255),
            win_counts JSONB DEFAULT '{}',
            detailed_results JSONB DEFAULT '[]',
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_by VARCHAR(255)
          );
        `, { transaction });

        // Create indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_deepeval_arena_comparisons_org_id
          ON "${tenantHash}".deepeval_arena_comparisons(org_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_deepeval_arena_comparisons_status
          ON "${tenantHash}".deepeval_arena_comparisons(status);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_deepeval_arena_comparisons_created_at
          ON "${tenantHash}".deepeval_arena_comparisons(created_at DESC);
        `, { transaction });

        console.log(`Created deepeval_arena_comparisons table for tenant ${tenantHash}`);
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
      )
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".deepeval_arena_comparisons CASCADE;`,
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
