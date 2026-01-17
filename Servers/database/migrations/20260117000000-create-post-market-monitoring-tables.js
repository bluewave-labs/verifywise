'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Get all organizations to create tenant-specific tables
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // 1. PMM Configurations - one per use case/project
        await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".post_market_monitoring_configs (
            id SERIAL PRIMARY KEY,
            project_id INTEGER REFERENCES "${tenantHash}".projects(id) ON DELETE CASCADE,
            is_active BOOLEAN DEFAULT FALSE,
            frequency_value INTEGER NOT NULL DEFAULT 30,
            frequency_unit TEXT CHECK (frequency_unit IN ('days', 'weeks', 'months')) DEFAULT 'days',
            start_date DATE,
            reminder_days INTEGER DEFAULT 3,
            escalation_days INTEGER DEFAULT 7,
            escalation_contact_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
            notification_hour INTEGER DEFAULT 9,
            created_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(project_id)
          );
        `, { transaction });

        // 2. PMM Questions - global template (config_id NULL) or use-case specific
        await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".post_market_monitoring_questions (
            id SERIAL PRIMARY KEY,
            config_id INTEGER REFERENCES "${tenantHash}".post_market_monitoring_configs(id) ON DELETE CASCADE,
            question_text TEXT NOT NULL,
            question_type TEXT CHECK (question_type IN ('yes_no', 'multi_select', 'multi_line_text')) NOT NULL,
            options JSONB DEFAULT '[]',
            suggestion_text TEXT,
            is_required BOOLEAN DEFAULT TRUE,
            is_system_default BOOLEAN DEFAULT FALSE,
            allows_flag_for_concern BOOLEAN DEFAULT TRUE,
            display_order INTEGER DEFAULT 0,
            eu_ai_act_article TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `, { transaction });

        // 3. PMM Cycles - tracking each monitoring period
        await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".post_market_monitoring_cycles (
            id SERIAL PRIMARY KEY,
            config_id INTEGER REFERENCES "${tenantHash}".post_market_monitoring_configs(id) ON DELETE CASCADE,
            cycle_number INTEGER NOT NULL,
            status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'escalated')) DEFAULT 'pending',
            started_at TIMESTAMP DEFAULT NOW(),
            due_at TIMESTAMP NOT NULL,
            reminder_sent_at TIMESTAMP,
            escalation_sent_at TIMESTAMP,
            completed_at TIMESTAMP,
            completed_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
            assigned_stakeholder_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `, { transaction });

        // 4. PMM Responses - answers to questions (supports partial saves)
        await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".post_market_monitoring_responses (
            id SERIAL PRIMARY KEY,
            cycle_id INTEGER REFERENCES "${tenantHash}".post_market_monitoring_cycles(id) ON DELETE CASCADE,
            question_id INTEGER REFERENCES "${tenantHash}".post_market_monitoring_questions(id) ON DELETE CASCADE,
            response_value JSONB,
            is_flagged BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(cycle_id, question_id)
          );
        `, { transaction });

        // 5. PMM Reports - generated PDF reports
        await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".post_market_monitoring_reports (
            id SERIAL PRIMARY KEY,
            cycle_id INTEGER REFERENCES "${tenantHash}".post_market_monitoring_cycles(id) ON DELETE CASCADE,
            file_id INTEGER REFERENCES "${tenantHash}".files(id) ON DELETE SET NULL,
            context_snapshot JSONB NOT NULL DEFAULT '{}',
            generated_at TIMESTAMP DEFAULT NOW(),
            generated_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
            UNIQUE(cycle_id)
          );
        `, { transaction });

        // Create indexes for better query performance
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_pmm_configs_project ON "${tenantHash}".post_market_monitoring_configs(project_id);
          CREATE INDEX idx_pmm_cycles_config ON "${tenantHash}".post_market_monitoring_cycles(config_id);
          CREATE INDEX idx_pmm_cycles_status ON "${tenantHash}".post_market_monitoring_cycles(status);
          CREATE INDEX idx_pmm_cycles_due_at ON "${tenantHash}".post_market_monitoring_cycles(due_at);
          CREATE INDEX idx_pmm_responses_cycle ON "${tenantHash}".post_market_monitoring_responses(cycle_id);
          CREATE INDEX idx_pmm_questions_config ON "${tenantHash}".post_market_monitoring_questions(config_id);
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

        // Drop tables in reverse order due to foreign key constraints
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".post_market_monitoring_reports CASCADE;
          DROP TABLE IF EXISTS "${tenantHash}".post_market_monitoring_responses CASCADE;
          DROP TABLE IF EXISTS "${tenantHash}".post_market_monitoring_cycles CASCADE;
          DROP TABLE IF EXISTS "${tenantHash}".post_market_monitoring_questions CASCADE;
          DROP TABLE IF EXISTS "${tenantHash}".post_market_monitoring_configs CASCADE;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
