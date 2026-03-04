'use strict';

/**
 * Base ENUMs and Roles Migration
 *
 * This creates all ENUM types and the roles table needed by the application.
 * Part 1 of the fresh installation migration set.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🚀 Creating base ENUMs and roles...');

      // ========================================
      // CORE ENUMS
      // ========================================

      // Project status
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE projects_status_enum AS ENUM ('Not started', 'In progress', 'Completed', 'On hold', 'Cancelled');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // Project risk classification
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_projects_ai_risk_classification AS ENUM (
            'high risk', 'limited risk', 'minimal risk',
            'prohibited', 'gpai', 'gpai_systemic', 'not_ai_system'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // High risk role types
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_projects_type_of_high_risk_role AS ENUM (
            'deployer', 'provider', 'distributor', 'importer',
            'product manufacturer', 'authorized representative',
            'not_applicable'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // Vendor review status
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_vendors_review_status AS ENUM (
            'Active', 'Under review', 'Not active', 'Pending', 'Approved', 'Rejected'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // Vendor scorecard enums
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_vendors_data_sensitivity AS ENUM (
            'None', 'Internal only', 'Personally identifiable information (PII)',
            'Financial data', 'Health data (e.g. HIPAA)',
            'Model weights or AI assets', 'Other sensitive data'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_vendors_business_criticality AS ENUM (
            'Low (vendor supports non-core functions)',
            'Medium (affects operations but is replaceable)',
            'High (critical to core services or products)'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_vendors_past_issues AS ENUM (
            'None', 'Minor incident (e.g. small delay, minor bug)',
            'Major incident (e.g. data breach, legal issue)'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_vendors_regulatory_exposure AS ENUM (
            'None', 'GDPR (EU)', 'HIPAA (US)', 'SOC 2',
            'ISO 27001', 'EU AI act', 'CCPA (california)', 'Other'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // Training status
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_trainingregistar_status AS ENUM (
            'Not started', 'In progress', 'Completed', 'Cancelled'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // Event log types
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_event_logs_event_type AS ENUM (
            'Create', 'Read', 'Update', 'Delete', 'Login', 'Logout', 'Error'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // Risk enums
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_projectrisks_ai_lifecycle_phase AS ENUM (
            'Design', 'Development', 'Testing', 'Deployment',
            'Operation', 'Monitoring', 'Decommissioning'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_projectrisks_risk_category AS ENUM (
            'Technical', 'Operational', 'Compliance', 'Ethical',
            'Security', 'Privacy', 'Financial', 'Reputational'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_projectrisks_likelihood AS ENUM (
            'Very low', 'Low', 'Medium', 'High', 'Very high'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_projectrisks_severity AS ENUM (
            'Very low', 'Low', 'Medium', 'High', 'Very high'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_projectrisks_risk_level_autocalculated AS ENUM (
            'Very low', 'Low', 'Medium', 'High', 'Very high', 'Critical'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_projectrisks_mitigation_status AS ENUM (
            'Not started', 'In progress', 'Completed', 'Accepted', 'Transferred'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_projectrisks_current_risk_level AS ENUM (
            'Very low', 'Low', 'Medium', 'High', 'Very high', 'Critical'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_projectrisks_likelihood_mitigation AS ENUM (
            'Very low', 'Low', 'Medium', 'High', 'Very high'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_projectrisks_risk_severity AS ENUM (
            'Very low', 'Low', 'Medium', 'High', 'Very high'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // Vendor risk enums
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_vendorrisks_likelihood AS ENUM (
            'Very low', 'Low', 'Medium', 'High', 'Very high'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_vendorrisks_risk_severity AS ENUM (
            'Very low', 'Low', 'Medium', 'High', 'Very high'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // File source enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_files_source AS ENUM (
            'Manual', 'Reporting', 'Policy', 'Vendor', 'Model',
            'Risk', 'Assessment', 'Control', 'Evidence', 'Training',
            'ISO42001Clause', 'ISO42001Annex', 'ISO27001Clause', 'ISO27001Annex',
            'NIST_AI_RMF', 'Incident', 'PMM', 'Plugin'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // Control status enums
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_controls_status AS ENUM ('Waiting', 'In progress', 'Done');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_controls_risk_review AS ENUM (
            'Acceptable risk', 'Residual risk', 'Unacceptable risk'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_subcontrols_status AS ENUM ('Waiting', 'In progress', 'Done');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_subcontrols_risk_review AS ENUM (
            'Acceptable risk', 'Residual risk', 'Unacceptable risk'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_status_questions AS ENUM (
            'Not started', 'Draft', 'In progress', 'Completed', 'Not applicable'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // ISO status enums
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_subclauses_iso_status AS ENUM (
            'Not started', 'Draft', 'In progress', 'Implemented', 'Not applicable'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_annexcategories_iso_status AS ENUM (
            'Not started', 'Draft', 'In progress', 'Implemented', 'Not applicable'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // Model inventory status
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_model_inventories_status AS ENUM (
            'Pending', 'Approved', 'Rejected', 'Retired',
            'Development', 'Testing', 'Production', 'Deprecated'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // Model risk enums
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_model_risks_risk_category AS ENUM (
            'Technical', 'Operational', 'Compliance', 'Ethical',
            'Security', 'Privacy', 'Financial', 'Reputational',
            'Performance', 'Bias', 'Fairness'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_model_risks_risk_level AS ENUM (
            'Very low', 'Low', 'Medium', 'High', 'Very high', 'Critical'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_model_risks_status AS ENUM (
            'Open', 'In progress', 'Resolved', 'Accepted', 'Closed'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // Dataset enums
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_dataset_status AS ENUM ('Draft', 'Active', 'Deprecated', 'Archived');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_dataset_type AS ENUM ('Training', 'Validation', 'Testing', 'Production', 'Reference');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_data_classification AS ENUM ('Public', 'Internal', 'Confidential', 'Restricted');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // Task enums
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_tasks_priority AS ENUM ('Low', 'Medium', 'High');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_tasks_status AS ENUM ('Open', 'In Progress', 'Completed', 'Overdue', 'Deleted');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // Notification enums
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_notification_type AS ENUM (
            'task_assigned', 'task_completed', 'task_updated',
            'review_requested', 'review_approved', 'review_rejected',
            'approval_requested', 'approval_approved', 'approval_rejected', 'approval_complete',
            'policy_due_soon', 'policy_overdue',
            'training_assigned', 'training_completed',
            'vendor_review_due', 'file_uploaded', 'comment_added', 'mention', 'system',
            'assignment_owner', 'assignment_reviewer', 'assignment_approver',
            'assignment_member', 'assignment_assignee', 'assignment_action_owner', 'assignment_risk_owner'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_notification_entity_type AS ENUM (
            'project', 'task', 'policy', 'vendor', 'model', 'training',
            'file', 'use_case', 'risk', 'assessment', 'comment', 'user'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // LLM Keys enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_llm_keys_provider AS ENUM ('Anthropic', 'OpenAI', 'OpenRouter', 'Custom');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // NIST AI RMF enum
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE enum_nist_ai_rmf_status AS ENUM (
            'Not started', 'Draft', 'In progress', 'Implemented', 'Not applicable', 'Awaiting review'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `, { transaction });

      // ========================================
      // ROLES TABLE
      // ========================================
      console.log('📋 Creating roles table...');

      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS roles (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description VARCHAR(255) NOT NULL,
          is_demo BOOLEAN DEFAULT false
        );
      `, { transaction });

      // Insert default roles
      await queryInterface.sequelize.query(`
        INSERT INTO roles (id, name, description) VALUES
          (1, 'Admin', 'Administrator with full access to the system.'),
          (2, 'Reviewer', 'Reviewer with access to review compliance and reports.'),
          (3, 'Editor', 'Editor with permission to modify and update project details.'),
          (4, 'Auditor', 'Auditor with access to compliance and security audits.')
        ON CONFLICT (id) DO NOTHING;
      `, { transaction });

      // Reset sequence
      await queryInterface.sequelize.query(`
        SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
      `, { transaction });

      await transaction.commit();
      console.log('✅ Base ENUMs and roles created successfully!');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔄 Rolling back base ENUMs and roles...');

      // Drop roles table
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS roles CASCADE;`, { transaction });

      // Note: We don't drop ENUMs here as they may be used by other tables
      // ENUMs should be dropped last if needed

      await transaction.commit();
      console.log('✅ Rollback completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
