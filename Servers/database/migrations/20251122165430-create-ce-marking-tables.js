'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if organizations table exists
      const tableExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'organizations'
        );`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      // If organizations table doesn't exist, skip migration
      if (!tableExists[0].exists) {
        console.log('Organizations table does not exist yet. Skipping CE marking tables creation.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Main CE Marking table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".ce_markings (
            id SERIAL PRIMARY KEY,
            project_id INTEGER NOT NULL,

            -- Classification and scope
            is_high_risk_ai_system BOOLEAN DEFAULT false,
            role_in_product VARCHAR(50) DEFAULT 'standalone',
            annex_iii_category VARCHAR(50) DEFAULT 'annex_iii_5',
            intended_purpose TEXT,

            -- EU AI Act completion (calculated fields, stored for performance)
            controls_completed INTEGER DEFAULT 0,
            controls_total INTEGER DEFAULT 0,
            assessments_completed INTEGER DEFAULT 0,
            assessments_total INTEGER DEFAULT 0,

            -- Declaration of conformity
            declaration_status VARCHAR(50) DEFAULT 'draft',
            signed_on DATE,
            signatory VARCHAR(255),
            declaration_document TEXT,

            -- EU registration
            registration_status VARCHAR(50) DEFAULT 'not_registered',
            eu_registration_id VARCHAR(255),
            registration_date DATE,
            eu_record_url TEXT,

            -- Policies and evidence (counts for now, relations later)
            policies_linked INTEGER DEFAULT 0,
            evidence_linked INTEGER DEFAULT 0,

            -- Incidents (counts for now, relations later)
            total_incidents INTEGER DEFAULT 0,
            ai_act_reportable_incidents INTEGER DEFAULT 0,
            last_incident TEXT,

            -- Metadata
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            created_by INTEGER REFERENCES public.users(id),
            updated_by INTEGER REFERENCES public.users(id),

            CONSTRAINT unique_project_ce_marking UNIQUE(project_id)
          );
        `, { transaction });

        // Conformity assessment steps table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".ce_marking_conformity_steps (
            id SERIAL PRIMARY KEY,
            ce_marking_id INTEGER NOT NULL REFERENCES "${tenantHash}".ce_markings(id) ON DELETE CASCADE,
            step_number INTEGER NOT NULL,
            step_name VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'Not started',
            owner VARCHAR(255),
            due_date DATE,
            completed_date DATE,

            -- Metadata
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),

            CONSTRAINT unique_ce_marking_step UNIQUE(ce_marking_id, step_number)
          );
        `, { transaction });

        // Audit trail table for CE Marking changes
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".ce_marking_audit_trail (
            id SERIAL PRIMARY KEY,
            ce_marking_id INTEGER NOT NULL REFERENCES "${tenantHash}".ce_markings(id) ON DELETE CASCADE,
            field_name VARCHAR(255) NOT NULL,
            old_value TEXT,
            new_value TEXT,
            changed_by INTEGER REFERENCES public.users(id),
            changed_at TIMESTAMP DEFAULT NOW(),
            change_type VARCHAR(50) -- 'create', 'update', 'delete'
          );
        `, { transaction });

        // Create indexes for better performance
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_ce_markings_project_id
          ON "${tenantHash}".ce_markings(project_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_ce_marking_conformity_steps_ce_marking_id
          ON "${tenantHash}".ce_marking_conformity_steps(ce_marking_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_ce_marking_audit_trail_ce_marking_id
          ON "${tenantHash}".ce_marking_audit_trail(ce_marking_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_ce_marking_audit_trail_changed_at
          ON "${tenantHash}".ce_marking_audit_trail(changed_at DESC);
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
      // Check if organizations table exists
      const tableExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'organizations'
        );`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      // If organizations table doesn't exist, skip migration
      if (!tableExists[0].exists) {
        console.log('Organizations table does not exist yet. Skipping CE marking tables rollback.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Drop tables in reverse order of creation
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".ce_marking_audit_trail;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".ce_marking_conformity_steps;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".ce_markings;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};