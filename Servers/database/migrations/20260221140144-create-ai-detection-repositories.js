'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Create ai_detection_repositories table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".ai_detection_repositories (
            id SERIAL PRIMARY KEY,
            repository_url VARCHAR(500) NOT NULL,
            repository_owner VARCHAR(255) NOT NULL,
            repository_name VARCHAR(255) NOT NULL,
            display_name VARCHAR(255),
            default_branch VARCHAR(100) DEFAULT 'main',
            github_token_id INTEGER,

            schedule_enabled BOOLEAN DEFAULT FALSE,
            schedule_frequency VARCHAR(20),
            schedule_day_of_week INTEGER,
            schedule_day_of_month INTEGER,
            schedule_hour INTEGER DEFAULT 2,
            schedule_minute INTEGER DEFAULT 0,

            last_scan_id INTEGER,
            last_scan_status VARCHAR(50),
            last_scan_at TIMESTAMP WITH TIME ZONE,
            next_scan_at TIMESTAMP WITH TIME ZONE,

            is_enabled BOOLEAN DEFAULT TRUE,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(repository_owner, repository_name)
          );
        `, { transaction });

        // Create indexes for ai_detection_repositories
        await Promise.all([
          `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_repos_enabled_idx" ON "${tenantHash}".ai_detection_repositories(is_enabled);`,
          `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_repos_schedule_idx" ON "${tenantHash}".ai_detection_repositories(schedule_enabled, next_scan_at);`,
          `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_repos_created_at_idx" ON "${tenantHash}".ai_detection_repositories(created_at DESC);`,
        ].map((query) => queryInterface.sequelize.query(query, { transaction })));

        // Add repository_id and triggered_by_type columns to ai_detection_scans
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".ai_detection_scans
          ADD COLUMN IF NOT EXISTS repository_id INTEGER,
          ADD COLUMN IF NOT EXISTS triggered_by_type VARCHAR(20) DEFAULT 'manual';
        `, { transaction });

        // Create index on repository_id for scan lookups
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_scans_repo_id_idx"
          ON "${tenantHash}".ai_detection_scans(repository_id);
        `, { transaction });

        console.log(`Created ai_detection_repositories table for tenant ${tenantHash}`);
      }

      await transaction.commit();
      console.log('Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Remove columns from ai_detection_scans
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".ai_detection_scans
          DROP COLUMN IF EXISTS repository_id,
          DROP COLUMN IF EXISTS triggered_by_type;
        `, { transaction });

        // Drop ai_detection_repositories table
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".ai_detection_repositories CASCADE;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
