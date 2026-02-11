'use strict';

/**
 * Migration to create file_entity_links table for flexible file-to-entity linking.
 *
 * This replaces the hardcoded columns (question_id, controlCategory_id, parent_id, etc.)
 * with a generic linking system that works with any framework:
 * - EU AI Act (controls, assessments)
 * - NIST AI
 * - ISO 27001 (clauses, annexes)
 * - ISO 42001 (clauses, annexes)
 * - Plugin frameworks (plugin:{plugin_id})
 */

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

        // Check if files table exists
        const [tableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = :schema
            AND table_name = 'files'
          );`,
          {
            transaction,
            replacements: { schema: tenantHash }
          }
        );

        if (!tableExists[0].exists) {
          console.log(`Skipping tenant ${tenantHash}: files table does not exist`);
          continue;
        }

        // Create file_entity_links table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".file_entity_links (
            id SERIAL PRIMARY KEY,
            file_id INTEGER NOT NULL REFERENCES "${tenantHash}".files(id) ON DELETE CASCADE,
            framework_type VARCHAR(50) NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            entity_id INTEGER NOT NULL,
            project_id INTEGER,
            link_type VARCHAR(20) DEFAULT 'evidence',
            created_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(file_id, framework_type, entity_type, entity_id)
          );
        `, { transaction });

        console.log(`Created file_entity_links table for ${tenantHash}`);

        // Create indexes for common queries
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_file_entity_links_file_id
          ON "${tenantHash}".file_entity_links(file_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_file_entity_links_entity
          ON "${tenantHash}".file_entity_links(framework_type, entity_type, entity_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_file_entity_links_project
          ON "${tenantHash}".file_entity_links(project_id);
        `, { transaction });

        console.log(`Created indexes for ${tenantHash}.file_entity_links`);
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

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".file_entity_links;
        `, { transaction });

        console.log(`Dropped file_entity_links table for ${tenantHash}`);
      }

      await transaction.commit();
      console.log('Rollback completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
