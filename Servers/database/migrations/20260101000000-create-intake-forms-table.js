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

        // Create intake_forms table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".intake_forms (
            id SERIAL PRIMARY KEY,

            -- Form identification
            name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            slug VARCHAR(255) NOT NULL,

            -- Entity configuration
            entity_type VARCHAR(50) NOT NULL,

            -- Form schema (JSON)
            schema JSONB NOT NULL DEFAULT '{"version":"1.0","fields":[]}',

            -- Settings
            submit_button_text VARCHAR(100) DEFAULT 'Submit',

            -- Lifecycle
            status VARCHAR(20) NOT NULL DEFAULT 'draft',
            ttl_expires_at TIMESTAMPTZ,

            -- Audit
            created_by INTEGER NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            -- Constraints
            UNIQUE(slug)
          );
        `, { transaction });

        // Create indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_intake_forms_status
          ON "${tenantHash}".intake_forms (status);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_intake_forms_entity_type
          ON "${tenantHash}".intake_forms (entity_type);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_intake_forms_slug
          ON "${tenantHash}".intake_forms (slug);
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
          DROP TABLE IF EXISTS "${tenantHash}".intake_forms CASCADE;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
