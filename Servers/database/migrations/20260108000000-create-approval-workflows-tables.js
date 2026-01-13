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
        console.log('Organizations table does not exist yet. Skipping approval workflows table creation.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Create approval_workflows table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".approval_workflows (
            id SERIAL PRIMARY KEY,
            workflow_title VARCHAR(255) NOT NULL,
            entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('use_case', 'project')),
            description TEXT,
            created_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `, { transaction });

        // Create approval_workflow_steps table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".approval_workflow_steps (
            id SERIAL PRIMARY KEY,
            workflow_id INTEGER NOT NULL REFERENCES "${tenantHash}".approval_workflows(id) ON DELETE CASCADE,
            step_number INTEGER NOT NULL,
            step_name VARCHAR(255) NOT NULL,
            description TEXT,
            requires_all_approvers BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(workflow_id, step_number)
          );
        `, { transaction });

        // Create approval_step_approvers table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".approval_step_approvers (
            id SERIAL PRIMARY KEY,
            workflow_step_id INTEGER NOT NULL REFERENCES "${tenantHash}".approval_workflow_steps(id) ON DELETE CASCADE,
            approver_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(workflow_step_id, approver_id)
          );
        `, { transaction });

        // Create approval_requests table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".approval_requests (
            id SERIAL PRIMARY KEY,
            request_name VARCHAR(255) NOT NULL,
            workflow_id INTEGER NOT NULL REFERENCES "${tenantHash}".approval_workflows(id) ON DELETE CASCADE,
            entity_id INTEGER,
            entity_type VARCHAR(50),
            entity_data JSONB,
            status VARCHAR(50) NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Withdrawn')) DEFAULT 'Pending',
            requested_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            current_step INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `, { transaction });

        // Create approval_request_steps table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".approval_request_steps (
            id SERIAL PRIMARY KEY,
            request_id INTEGER NOT NULL REFERENCES "${tenantHash}".approval_requests(id) ON DELETE CASCADE,
            step_number INTEGER NOT NULL,
            step_name VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL CHECK (status IN ('Pending', 'Completed', 'Rejected')) DEFAULT 'Pending',
            date_assigned TIMESTAMP NOT NULL DEFAULT NOW(),
            date_completed TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(request_id, step_number)
          );
        `, { transaction });

        // Create approval_request_step_approvals table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".approval_request_step_approvals (
            id SERIAL PRIMARY KEY,
            request_step_id INTEGER NOT NULL REFERENCES "${tenantHash}".approval_request_steps(id) ON DELETE CASCADE,
            approver_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            approval_result VARCHAR(50) NOT NULL CHECK (approval_result IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
            comments TEXT,
            approved_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(request_step_id, approver_id)
          );
        `, { transaction });

        // Create indexes for better performance

        // Workflow indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_workflows_entity_type
          ON "${tenantHash}".approval_workflows(entity_type);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_workflows_is_active
          ON "${tenantHash}".approval_workflows(is_active);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_workflows_created_by
          ON "${tenantHash}".approval_workflows(created_by);
        `, { transaction });

        // Workflow steps indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_workflow_steps_workflow_id
          ON "${tenantHash}".approval_workflow_steps(workflow_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_workflow_steps_step_number
          ON "${tenantHash}".approval_workflow_steps(workflow_id, step_number);
        `, { transaction });

        // Step approvers indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_step_approvers_workflow_step_id
          ON "${tenantHash}".approval_step_approvers(workflow_step_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_step_approvers_approver_id
          ON "${tenantHash}".approval_step_approvers(approver_id);
        `, { transaction });

        // Request indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_requests_workflow_id
          ON "${tenantHash}".approval_requests(workflow_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_requests_status
          ON "${tenantHash}".approval_requests(status);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_by
          ON "${tenantHash}".approval_requests(requested_by);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_requests_entity
          ON "${tenantHash}".approval_requests(entity_type, entity_id);
        `, { transaction });

        // Request steps indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_request_steps_request_id
          ON "${tenantHash}".approval_request_steps(request_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_request_steps_status
          ON "${tenantHash}".approval_request_steps(status);
        `, { transaction });

        // Request step approvals indexes
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_request_step_approvals_request_step_id
          ON "${tenantHash}".approval_request_step_approvals(request_step_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_request_step_approvals_approver_id
          ON "${tenantHash}".approval_request_step_approvals(approver_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_approval_request_step_approvals_result
          ON "${tenantHash}".approval_request_step_approvals(approval_result);
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

      if (!tableExists[0].exists) {
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Drop tables in reverse order (respecting foreign key constraints)
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".approval_request_step_approvals;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".approval_request_steps;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".approval_requests;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".approval_step_approvers;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".approval_workflow_steps;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".approval_workflows;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
