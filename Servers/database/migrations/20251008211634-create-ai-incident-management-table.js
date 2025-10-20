'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1️⃣ Get all organization IDs
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      // 2️⃣ Loop through each org and create its tenant-specific table + sequence
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Create table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".ai_incident_managements (
            id SERIAL PRIMARY KEY,
            incident_id TEXT UNIQUE DEFAULT NULL,
            ai_project TEXT NOT NULL,
            type TEXT NOT NULL,
            severity TEXT CHECK (severity IN ('Minor', 'Serious', 'Very serious')) NOT NULL,
            occurred_date TIMESTAMPTZ NOT NULL,
            date_detected TIMESTAMPTZ NOT NULL,
            reporter TEXT NOT NULL,
            status TEXT CHECK (status IN ('Open', 'Investigating', 'Mitigated', 'Closed')) DEFAULT 'Open' NOT NULL,
            categories_of_harm JSON NOT NULL,
            affected_persons_groups TEXT,
            description TEXT NOT NULL,
            relationship_causality TEXT,
            immediate_mitigations TEXT,
            planned_corrective_actions TEXT,
            model_system_version TEXT,
            interim_report BOOLEAN DEFAULT FALSE NOT NULL,
            approval_status TEXT CHECK (approval_status IN ('Pending', 'Approved', 'Rejected', 'Not required')) DEFAULT 'Pending' NOT NULL,
            approved_by TEXT,
            approval_date TIMESTAMPTZ,
            approval_notes TEXT,
            archived BOOLEAN DEFAULT FALSE NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
          );
        `, { transaction });

       // Create sequence for incident_id
        await queryInterface.sequelize.query(`
          CREATE SEQUENCE IF NOT EXISTS "${tenantHash}".incident_id_seq START 1;
        `, { transaction });

        // Set default value on the column
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".ai_incident_managements
          ALTER COLUMN incident_id 
          SET DEFAULT 'INC-' || nextval('"${tenantHash}".incident_id_seq');
        `, { transaction });
        

        // Add indexes for performance
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_${tenantHash}_severity ON "${tenantHash}".ai_incident_managements (severity);
          CREATE INDEX IF NOT EXISTS idx_${tenantHash}_status ON "${tenantHash}".ai_incident_managements (status);
          CREATE INDEX IF NOT EXISTS idx_${tenantHash}_approval_status ON "${tenantHash}".ai_incident_managements (approval_status);
          CREATE INDEX IF NOT EXISTS idx_${tenantHash}_created_at ON "${tenantHash}".ai_incident_managements (created_at);
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

        // Drop table and sequence
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".ai_incident_managements CASCADE;
          DROP SEQUENCE IF EXISTS "${tenantHash}".incident_id_seq CASCADE;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
