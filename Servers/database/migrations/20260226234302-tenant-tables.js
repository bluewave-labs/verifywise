'use strict';

/**
 * Tenant Tables Migration
 *
 * Strategy:
 * - Drops and recreates all tenant tables for correct schema
 * - files & file_entity_links are NOT dropped here (owned by public-schema-tables migration)
 *
 * Part 3 of the migration set.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 Setting up tenant tables...');

    // Helper: Check if table exists
    const tableExists = async (tableName) => {
      const [result] = await queryInterface.sequelize.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = '${tableName}'
        ) as exists;
      `);
      return result[0].exists;
    };

    // Helper: Check if column exists
    const columnExists = async (tableName, columnName) => {
      const [result] = await queryInterface.sequelize.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = '${tableName}' AND column_name = '${columnName}'
        ) as exists;
      `);
      return result[0].exists;
    };

    // Helper: Add column if not exists
    const addColumn = async (tableName, columnName, definition) => {
      if (!(await columnExists(tableName, columnName))) {
        console.log(`  Adding ${columnName} to ${tableName}...`);
        await queryInterface.sequelize.query(`
          ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};
        `);
      }
    };

    // Helper: Create index if not exists
    const createIndex = async (indexName, tableName, columns) => {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${columns});
      `);
    };

    // Helper: Make column nullable if it exists
    const makeNullable = async (tableName, columnName) => {
      if (await columnExists(tableName, columnName)) {
        await queryInterface.sequelize.query(`
          ALTER TABLE ${tableName} ALTER COLUMN "${columnName}" DROP NOT NULL;
        `);
      }
    };

    // ========================================
    // DROP ALL TENANT TABLES (reverse dependency order)
    // Files & file_entity_links are NOT dropped (owned by public-schema-tables migration)
    // ========================================
    console.log('🗑️  Dropping existing tenant tables for clean recreation...');

    const tablesToDrop = [
      // Intake
      'intake_submissions',
      'intake_forms',
      // MLflow
      'mlflow_model_records',
      'mlflow_integrations',
      // Bias evaluations
      'bias_fairness_evaluations',
      // Agent discovery
      'agent_audit_log',
      'agent_discovery_sync_log',
      'agent_primitives',
      // LLM Evals
      'llm_evals_bias_audit_results',
      'llm_evals_bias_audits',
      'llm_evals_arena_comparisons',
      'evaluation_llm_api_keys',
      'llm_evals_api_keys',
      'llm_evals_metrics',
      'llm_evals_logs',
      'llm_evals_experiments',
      'llm_evals_models',
      'llm_evals_scorers',
      'llm_evals_datasets',
      'llm_evals_projects',
      'llm_evals_org_members',
      'llm_evals_organizations',
      // Post-market monitoring
      'post_market_monitoring_reports',
      'post_market_monitoring_responses',
      'post_market_monitoring_cycles',
      'post_market_monitoring_questions',
      'post_market_monitoring_configs',
      // CE marking
      'ce_marking_incidents',
      'ce_marking_evidences',
      'ce_marking_policies',
      'ce_marking_audit_trail',
      'ce_marking_conformity_steps',
      'ce_markings',
      // Misc tenant tables
      'file_access_logs',
      'advisor_conversations',
      'slack_webhooks',
      'feature_settings',
      'entity_graph_gap_rules',
      'entity_graph_views',
      'entity_graph_annotations',
      'user_preferences',
      'github_tokens',
      'api_tokens',
      'evidence_hub',
      // Shadow AI
      'shadow_ai_api_keys',
      'shadow_ai_syslog_config',
      'shadow_ai_settings',
      'shadow_ai_rule_notifications',
      'shadow_ai_alert_history',
      'shadow_ai_rules',
      'shadow_ai_monthly_rollups',
      'shadow_ai_daily_rollups',
      'shadow_ai_events',
      'shadow_ai_tools',
      // AI detection
      'ai_detection_risk_scoring_config',
      'ai_detection_repositories',
      'ai_detection_findings',
      'ai_detection_scans',
      // AI trust center
      'ai_trust_center_terms_and_contact',
      'ai_trust_center_subprocessor',
      'ai_trust_center_resources',
      'ai_trust_center_compliance_badges',
      'ai_trust_center_company_description',
      'ai_trust_center_intro',
      'ai_trust_center',
      // Risk junction tables
      'nist_ai_rmf_subcategories__risks',
      'annexcontrols_iso27001__risks',
      'subclauses_iso27001__risks',
      'subclauses_iso__risks',
      'answers_eu__risks',
      'controls_eu__risks',
      // History tables
      'model_inventory_history',
      'risk_history',
      'training_change_history',
      'task_change_history',
      'dataset_change_histories',
      'file_change_history',
      'model_risk_change_history',
      'model_inventory_change_history',
      'use_case_change_history',
      'incident_change_history',
      'policy_change_history',
      'project_risk_change_history',
      'vendor_risk_change_history',
      'vendor_change_history',
      // Junction tables
      'model_inventories_projects_frameworks',
      'dataset_model_inventories',
      'dataset_projects',
      'policy_manager__assigned_reviewer_ids',
      'policy_linked_objects',
      'task_entity_links',
      // Approval tables
      'approval_step_approvers',
      'approval_request_step_approvals',
      'approval_request_steps',
      'approval_requests',
      'approval_workflow_steps',
      'approval_workflows',
      // Remaining
      'share_links',
      'notes',
      'invitations',
      'llm_keys',
      'plugin_installations',
      'notifications',
      'automation_execution_logs',
      'automation_actions_data',
      'automations',
      'ai_incident_managements',
      'task_assignees',
      'tasks',
      'datasets',
      'model_risks',
      'model_inventories',
      'policy_manager',
      // NIST tenant tables
      'nist_ai_rmf_subcategories',
      // ISO tables
      'annexcontrols_iso27001',
      'subclauses_iso27001',
      'annexcategories_iso__risks',
      'annexcategories_iso',
      'subclauses_iso',
      // EU tables
      'subcontrols_eu__risks',
      'answers_eu',
      'subcontrols_eu',
      'controls_eu',
      // Framework data
      'assessments',
      'projects_frameworks',
      'projectscopes',
      'vendorrisks',
      // File organization (NOT files/file_entity_links - owned by public migration)
      'file_folder_mappings',
      'virtual_folders',
      // Core junction/data tables
      'frameworks_risks',
      'projects_risks',
      'risks',
      'vendors_projects',
      'event_logs',
      'projects_members',
      'trainingregistar',
      'vendors',
      'projects',
    ];

    for (const table of tablesToDrop) {
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
    }

    // Drop sequences used by tenant tables
    await queryInterface.sequelize.query(`DROP SEQUENCE IF EXISTS project_uc_id_seq CASCADE;`);
    await queryInterface.sequelize.query(`DROP SEQUENCE IF EXISTS incident_id_seq CASCADE;`);

    // ========================================
    // PROJECTS
    // ========================================
    console.log('📋 Creating projects table...');

    if (!(await tableExists('projects'))) {
      // Fresh install - create sequence and table
      await queryInterface.sequelize.query(`CREATE SEQUENCE IF NOT EXISTS project_uc_id_seq;`);
      await queryInterface.sequelize.query(`
        CREATE TABLE projects (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          uc_id VARCHAR(255),
          project_title VARCHAR(255) NOT NULL,
          owner INTEGER REFERENCES users(id) ON DELETE SET NULL,
          start_date TIMESTAMP WITH TIME ZONE,
          ai_risk_classification enum_projects_ai_risk_classification,
          type_of_high_risk_role enum_projects_type_of_high_risk_role,
          goal TEXT,
          target_industry VARCHAR(255),
          description TEXT,
          geography INTEGER,
          last_updated TIMESTAMP WITH TIME ZONE,
          last_updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          is_organizational BOOLEAN NOT NULL DEFAULT false,
          status projects_status_enum NOT NULL DEFAULT 'Not started',
          approval_workflow_id INTEGER,
          pending_frameworks JSONB DEFAULT NULL,
          enable_ai_data_insertion BOOLEAN DEFAULT FALSE,
          _source VARCHAR(100),
          created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          UNIQUE(organization_id, uc_id)
        );
      `);
    } else {
      // Existing table - add ALL missing columns
      await addColumn('projects', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
      await addColumn('projects', 'uc_id', 'VARCHAR(255)');
      await addColumn('projects', 'is_organizational', 'BOOLEAN DEFAULT false');
      await addColumn('projects', 'status', "projects_status_enum DEFAULT 'Not started'");
      await addColumn('projects', 'approval_workflow_id', 'INTEGER');
      await addColumn('projects', 'pending_frameworks', 'JSONB DEFAULT NULL');
      await addColumn('projects', 'enable_ai_data_insertion', 'BOOLEAN DEFAULT FALSE');
      await addColumn('projects', '_source', 'VARCHAR(100)');

      // Make certain columns nullable (for existing databases with stricter constraints)
      await makeNullable('projects', 'ai_risk_classification');
      await makeNullable('projects', 'type_of_high_risk_role');
      await makeNullable('projects', 'goal');
      await makeNullable('projects', 'geography');
      await makeNullable('projects', 'start_date');
      await makeNullable('projects', 'last_updated');
    }

    if (await columnExists('projects', 'organization_id')) {
      await createIndex('idx_projects_org', 'projects', 'organization_id');
    }

    // ========================================
    // VENDORS
    // ========================================
    console.log('📋 Ensuring vendors table...');

    if (!(await tableExists('vendors'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE vendors (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          order_no INTEGER,
          vendor_name VARCHAR(255) NOT NULL,
          vendor_provides TEXT NOT NULL,
          assignee INTEGER REFERENCES users(id) ON DELETE SET NULL,
          website VARCHAR(255) NOT NULL,
          vendor_contact_person VARCHAR(255) NOT NULL,
          review_result VARCHAR(255),
          review_status enum_vendors_review_status,
          reviewer INTEGER REFERENCES users(id) ON DELETE SET NULL,
          review_date TIMESTAMP WITH TIME ZONE,
          data_sensitivity enum_vendors_data_sensitivity,
          business_criticality enum_vendors_business_criticality,
          past_issues enum_vendors_past_issues,
          regulatory_exposure enum_vendors_regulatory_exposure,
          risk_score INTEGER,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `);
    } else {
      await addColumn('vendors', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
      await addColumn('vendors', 'data_sensitivity', 'enum_vendors_data_sensitivity');
      await addColumn('vendors', 'business_criticality', 'enum_vendors_business_criticality');
      await addColumn('vendors', 'past_issues', 'enum_vendors_past_issues');
      await addColumn('vendors', 'regulatory_exposure', 'enum_vendors_regulatory_exposure');
      await addColumn('vendors', 'risk_score', 'INTEGER');
      await addColumn('vendors', 'updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT now()');
    }

    if (await columnExists('vendors', 'organization_id')) {
      await createIndex('idx_vendors_org', 'vendors', 'organization_id');
    }

    // ========================================
    // TRAINING REGISTRAR
    // ========================================
    console.log('📋 Ensuring training table...');

    if (!(await tableExists('trainingregistar'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE trainingregistar (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          training_name VARCHAR(255) NOT NULL,
          duration VARCHAR(255),
          provider VARCHAR(255),
          department VARCHAR(255),
          status enum_trainingregistar_status,
          people INTEGER,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          description VARCHAR(255),
          is_demo BOOLEAN NOT NULL DEFAULT false
        );
      `);
    } else {
      await addColumn('trainingregistar', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
      await addColumn('trainingregistar', 'is_demo', 'BOOLEAN DEFAULT false');
    }

    if (await columnExists('trainingregistar', 'organization_id')) {
      await createIndex('idx_trainingregistar_org', 'trainingregistar', 'organization_id');
    }

    // ========================================
    // JUNCTION TABLES
    // ========================================
    console.log('📋 Ensuring junction tables...');

    // projects_members
    if (!(await tableExists('projects_members'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE projects_members (
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          PRIMARY KEY (user_id, project_id)
        );
      `);
    } else {
      await addColumn('projects_members', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // event_logs
    if (!(await tableExists('event_logs'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE event_logs (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          event_type enum_event_logs_event_type NOT NULL,
          description TEXT,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      await addColumn('event_logs', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // vendors_projects
    if (!(await tableExists('vendors_projects'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE vendors_projects (
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
          project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          PRIMARY KEY (vendor_id, project_id)
        );
      `);
    } else {
      await addColumn('vendors_projects', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ========================================
    // RISKS
    // ========================================
    console.log('📋 Ensuring risks table...');

    if (!(await tableExists('risks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE risks (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          risk_name VARCHAR(255) NOT NULL,
          risk_owner INTEGER REFERENCES users(id) ON DELETE SET NULL,
          ai_lifecycle_phase enum_projectrisks_ai_lifecycle_phase,
          risk_description TEXT,
          risk_category enum_projectrisks_risk_category[],
          impact VARCHAR(255),
          assessment_mapping TEXT,
          controls_mapping TEXT,
          likelihood enum_projectrisks_likelihood,
          severity enum_projectrisks_severity,
          risk_level_autocalculated enum_projectrisks_risk_level_autocalculated,
          review_notes TEXT,
          mitigation_status enum_projectrisks_mitigation_status,
          current_risk_level enum_projectrisks_current_risk_level,
          deadline TIMESTAMP WITH TIME ZONE,
          mitigation_plan TEXT,
          implementation_strategy TEXT,
          mitigation_evidence_document VARCHAR(255),
          likelihood_mitigation enum_projectrisks_likelihood_mitigation,
          risk_severity enum_projectrisks_risk_severity,
          final_risk_level VARCHAR(255),
          risk_approval INTEGER REFERENCES users(id) ON DELETE SET NULL,
          approval_status VARCHAR(255),
          date_of_assessment TIMESTAMP WITH TIME ZONE,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          is_deleted BOOLEAN NOT NULL DEFAULT false,
          deleted_at TIMESTAMP WITHOUT TIME ZONE
        );
      `);
    } else {
      await addColumn('risks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
      await addColumn('risks', 'is_deleted', 'BOOLEAN DEFAULT false');
      await addColumn('risks', 'deleted_at', 'TIMESTAMP WITHOUT TIME ZONE');
    }

    if (await columnExists('risks', 'organization_id')) {
      await createIndex('idx_risks_org', 'risks', 'organization_id');
    }

    // projects_risks junction
    if (!(await tableExists('projects_risks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE projects_risks (
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          risk_id INTEGER NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
          project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          PRIMARY KEY (risk_id, project_id)
        );
      `);
    } else {
      await addColumn('projects_risks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // frameworks_risks junction
    if (!(await tableExists('frameworks_risks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE frameworks_risks (
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          risk_id INTEGER NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
          framework_id INTEGER NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
          PRIMARY KEY (risk_id, framework_id)
        );
      `);
    } else {
      await addColumn('frameworks_risks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ========================================
    // FILES
    // ========================================
    console.log('📋 Ensuring files table...');

    if (!(await tableExists('files'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE files (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          filename VARCHAR(255) NOT NULL,
          content BYTEA,
          project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
          uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          uploaded_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
          is_demo BOOLEAN NOT NULL DEFAULT false,
          source enum_files_source,
          type VARCHAR(255),
          size BIGINT,
          file_path VARCHAR(500),
          org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          model_id INTEGER,
          tags JSONB DEFAULT '[]'::jsonb,
          review_status VARCHAR(20) DEFAULT 'draft',
          version VARCHAR(20) DEFAULT '1.0',
          expiry_date DATE,
          last_modified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          description TEXT,
          file_group_id UUID DEFAULT gen_random_uuid(),
          approval_workflow_id INTEGER,
          content_text TEXT,
          content_search TSVECTOR
        );
      `);
    } else {
      await addColumn('files', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
      await addColumn('files', 'tags', "JSONB DEFAULT '[]'::jsonb");
      await addColumn('files', 'review_status', "VARCHAR(20) DEFAULT 'draft'");
      await addColumn('files', 'version', "VARCHAR(20) DEFAULT '1.0'");
      await addColumn('files', 'expiry_date', 'DATE');
      await addColumn('files', 'file_group_id', 'UUID DEFAULT gen_random_uuid()');
      await addColumn('files', 'approval_workflow_id', 'INTEGER');
      await addColumn('files', 'content_text', 'TEXT');
      await addColumn('files', 'content_search', 'TSVECTOR');
    }

    // Ensure project_id is nullable (files can exist at org level without a project)
    await makeNullable('files', 'project_id');

    if (await columnExists('files', 'organization_id')) {
      await createIndex('idx_files_org', 'files', 'organization_id');
    }

    // file_entity_links
    if (!(await tableExists('file_entity_links'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE file_entity_links (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
          framework_type VARCHAR(50) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id INTEGER NOT NULL,
          project_id INTEGER,
          link_type VARCHAR(20) DEFAULT 'evidence',
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(file_id, framework_type, entity_type, entity_id)
        );
      `);
    } else {
      await addColumn('file_entity_links', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // virtual_folders
    if (!(await tableExists('virtual_folders'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE virtual_folders (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          parent_id INTEGER REFERENCES virtual_folders(id) ON DELETE CASCADE,
          color VARCHAR(7),
          icon VARCHAR(50),
          is_system BOOLEAN DEFAULT FALSE,
          created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE (organization_id, parent_id, name)
        );
      `);
    } else {
      await addColumn('virtual_folders', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // file_folder_mappings
    if (!(await tableExists('file_folder_mappings'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE file_folder_mappings (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
          folder_id INTEGER NOT NULL REFERENCES virtual_folders(id) ON DELETE CASCADE,
          assigned_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
          assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE (file_id, folder_id)
        );
      `);
    } else {
      await addColumn('file_folder_mappings', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ========================================
    // FRAMEWORKS DATA
    // ========================================
    console.log('📋 Ensuring framework data tables...');

    // projects_frameworks
    if (!(await tableExists('projects_frameworks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE projects_frameworks (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          framework_id INTEGER NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
          is_demo BOOLEAN DEFAULT false,
          UNIQUE(project_id, framework_id)
        );
      `);
    } else {
      await addColumn('projects_frameworks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // assessments
    if (!(await tableExists('assessments'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE assessments (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          projects_frameworks_id INTEGER REFERENCES projects_frameworks(id) ON DELETE CASCADE
        );
      `);
    } else {
      await addColumn('assessments', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // projectscopes
    if (!(await tableExists('projectscopes'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE projectscopes (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          assessment_id INTEGER NOT NULL,
          describe_ai_environment TEXT NOT NULL,
          is_new_ai_technology BOOLEAN NOT NULL,
          uses_personal_data BOOLEAN NOT NULL,
          project_scope_documents VARCHAR(255) NOT NULL,
          technology_type VARCHAR(255) NOT NULL,
          has_ongoing_monitoring BOOLEAN NOT NULL,
          unintended_outcomes TEXT NOT NULL,
          technology_documentation VARCHAR(255) NOT NULL,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
        );
      `);
    } else {
      await addColumn('projectscopes', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // vendorrisks
    if (!(await tableExists('vendorrisks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE vendorrisks (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
          order_no INTEGER,
          risk_description TEXT,
          impact_description TEXT,
          likelihood enum_vendorrisks_likelihood,
          risk_severity enum_vendorrisks_risk_severity,
          action_plan TEXT,
          action_owner INTEGER REFERENCES users(id) ON DELETE SET NULL,
          risk_level VARCHAR(255),
          is_demo BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          is_deleted BOOLEAN NOT NULL DEFAULT false,
          deleted_at TIMESTAMP WITHOUT TIME ZONE
        );
      `);
    } else {
      await addColumn('vendorrisks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
      await addColumn('vendorrisks', 'is_deleted', 'BOOLEAN DEFAULT false');
      await addColumn('vendorrisks', 'deleted_at', 'TIMESTAMP WITHOUT TIME ZONE');
      await addColumn('vendorrisks', 'updated_at', 'TIMESTAMP WITHOUT TIME ZONE DEFAULT now()');
    }

    if (await columnExists('vendorrisks', 'organization_id')) {
      await createIndex('idx_vendorrisks_org', 'vendorrisks', 'organization_id');
    }

    // ========================================
    // EU AI ACT CONTROLS
    // ========================================
    console.log('📋 Ensuring EU AI Act tenant tables...');

    if (!(await tableExists('controls_eu'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE controls_eu (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          status enum_controls_status,
          approver INTEGER REFERENCES users(id) ON DELETE SET NULL,
          risk_review enum_controls_risk_review,
          owner INTEGER REFERENCES users(id) ON DELETE SET NULL,
          reviewer INTEGER REFERENCES users(id) ON DELETE SET NULL,
          due_date TIMESTAMP WITH TIME ZONE,
          implementation_details TEXT,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          control_meta_id INTEGER REFERENCES controls_struct_eu(id) ON DELETE CASCADE,
          projects_frameworks_id INTEGER REFERENCES projects_frameworks(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
        );
      `);
    } else {
      await addColumn('controls_eu', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    if (!(await tableExists('subcontrols_eu'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE subcontrols_eu (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          status enum_subcontrols_status,
          approver INTEGER REFERENCES users(id) ON DELETE SET NULL,
          risk_review enum_subcontrols_risk_review,
          owner INTEGER REFERENCES users(id) ON DELETE SET NULL,
          reviewer INTEGER REFERENCES users(id) ON DELETE SET NULL,
          due_date TIMESTAMP WITH TIME ZONE,
          implementation_details TEXT,
          control_id INTEGER REFERENCES controls_eu(id) ON DELETE CASCADE,
          subcontrol_meta_id INTEGER REFERENCES subcontrols_struct_eu(id) ON DELETE CASCADE,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          evidence_description TEXT,
          feedback_description TEXT,
          created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
        );
      `);
    } else {
      await addColumn('subcontrols_eu', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    if (!(await tableExists('answers_eu'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE answers_eu (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
          question_id INTEGER REFERENCES questions_struct_eu(id) ON DELETE CASCADE,
          answer TEXT,
          dropdown_options TEXT[],
          status enum_status_questions DEFAULT 'Not started',
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
          is_demo BOOLEAN NOT NULL DEFAULT false
        );
      `);
    } else {
      await addColumn('answers_eu', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // subcontrols_eu__risks junction
    if (!(await tableExists('subcontrols_eu__risks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE subcontrols_eu__risks (
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          subcontrol_id INTEGER REFERENCES subcontrols_eu(id) ON DELETE CASCADE,
          projects_risks_id INTEGER REFERENCES risks(id) ON DELETE CASCADE,
          PRIMARY KEY (subcontrol_id, projects_risks_id)
        );
      `);
    } else {
      await addColumn('subcontrols_eu__risks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ========================================
    // ISO 42001
    // ========================================
    console.log('📋 Ensuring ISO 42001 tenant tables...');

    if (!(await tableExists('subclauses_iso'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE subclauses_iso (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          implementation_description TEXT,
          status enum_subclauses_iso_status DEFAULT 'Not started',
          owner INTEGER REFERENCES users(id) ON DELETE SET NULL,
          reviewer INTEGER REFERENCES users(id) ON DELETE SET NULL,
          approver INTEGER REFERENCES users(id) ON DELETE SET NULL,
          due_date DATE,
          auditor_feedback TEXT,
          subclause_meta_id INTEGER REFERENCES subclauses_struct_iso(id) ON DELETE CASCADE,
          projects_frameworks_id INTEGER REFERENCES projects_frameworks(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          is_demo BOOLEAN DEFAULT false
        );
      `);
    } else {
      await addColumn('subclauses_iso', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    if (!(await tableExists('annexcategories_iso'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE annexcategories_iso (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          is_applicable BOOLEAN DEFAULT false,
          justification_for_exclusion TEXT,
          implementation_description TEXT,
          status enum_annexcategories_iso_status DEFAULT 'Not started',
          owner INTEGER REFERENCES users(id) ON DELETE SET NULL,
          reviewer INTEGER REFERENCES users(id) ON DELETE SET NULL,
          approver INTEGER REFERENCES users(id) ON DELETE SET NULL,
          due_date DATE,
          auditor_feedback TEXT,
          projects_frameworks_id INTEGER REFERENCES projects_frameworks(id) ON DELETE CASCADE,
          annexcategory_meta_id INTEGER REFERENCES annexcategories_struct_iso(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          is_demo BOOLEAN DEFAULT false
        );
      `);
    } else {
      await addColumn('annexcategories_iso', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // annexcategories_iso__risks junction table
    if (!(await tableExists('annexcategories_iso__risks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE annexcategories_iso__risks (
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          annexcategory_id INTEGER,
          projects_risks_id INTEGER NOT NULL,
          PRIMARY KEY (projects_risks_id, annexcategory_id)
        );
      `);
    } else {
      await addColumn('annexcategories_iso__risks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ========================================
    // ISO 27001
    // ========================================
    console.log('📋 Ensuring ISO 27001 tenant tables...');

    if (!(await tableExists('subclauses_iso27001'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE subclauses_iso27001 (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          implementation_description TEXT,
          status enum_subclauses_iso_status DEFAULT 'Not started',
          owner INTEGER REFERENCES users(id) ON DELETE SET NULL,
          reviewer INTEGER REFERENCES users(id) ON DELETE SET NULL,
          approver INTEGER REFERENCES users(id) ON DELETE SET NULL,
          due_date DATE,
          auditor_feedback TEXT,
          subclause_meta_id INTEGER REFERENCES subclauses_struct_iso27001(id) ON DELETE CASCADE,
          projects_frameworks_id INTEGER REFERENCES projects_frameworks(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_demo BOOLEAN DEFAULT FALSE
        );
      `);
    } else {
      await addColumn('subclauses_iso27001', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    if (!(await tableExists('annexcontrols_iso27001'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE annexcontrols_iso27001 (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          implementation_description TEXT,
          status enum_annexcategories_iso_status DEFAULT 'Not started',
          owner INTEGER REFERENCES users(id) ON DELETE SET NULL,
          reviewer INTEGER REFERENCES users(id) ON DELETE SET NULL,
          approver INTEGER REFERENCES users(id) ON DELETE SET NULL,
          due_date DATE,
          auditor_feedback TEXT,
          projects_frameworks_id INTEGER REFERENCES projects_frameworks(id) ON DELETE CASCADE,
          annexcontrol_meta_id INTEGER REFERENCES annexcontrols_struct_iso27001(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_demo BOOLEAN DEFAULT FALSE
        );
      `);
    } else {
      await addColumn('annexcontrols_iso27001', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ========================================
    // NIST AI RMF
    // ========================================
    console.log('📋 Ensuring NIST AI RMF tenant tables...');

    if (!(await tableExists('nist_ai_rmf_subcategories'))) {
      // Only create if struct table exists
      if (await tableExists('nist_ai_rmf_subcategories_struct')) {
        await queryInterface.sequelize.query(`
          CREATE TABLE nist_ai_rmf_subcategories (
            id SERIAL PRIMARY KEY,
            organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
            implementation_description TEXT,
            status enum_nist_ai_rmf_status DEFAULT 'Not started',
            owner INTEGER REFERENCES users(id) ON DELETE SET NULL,
            reviewer INTEGER REFERENCES users(id) ON DELETE SET NULL,
            approver INTEGER REFERENCES users(id) ON DELETE SET NULL,
            due_date DATE,
            auditor_feedback TEXT,
            subcategory_meta_id INTEGER REFERENCES nist_ai_rmf_subcategories_struct(id) ON DELETE CASCADE,
            projects_frameworks_id INTEGER REFERENCES projects_frameworks(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_demo BOOLEAN DEFAULT FALSE
          );
        `);
      }
    } else {
      await addColumn('nist_ai_rmf_subcategories', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // Add index for NIST subcategories
    if (await tableExists('nist_ai_rmf_subcategories')) {
      await createIndex('idx_nist_subcategories_org', 'nist_ai_rmf_subcategories', 'organization_id');
      await createIndex('idx_nist_subcategories_pf', 'nist_ai_rmf_subcategories', 'projects_frameworks_id');
    }

    // ========================================
    // REMAINING TABLES (continue pattern)
    // ========================================
    console.log('📋 Ensuring remaining tenant tables...');

    // policy_manager
    if (!(await tableExists('policy_manager'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE policy_manager (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          content_html TEXT DEFAULT '',
          status VARCHAR(50) DEFAULT 'Draft',
          tags TEXT[] DEFAULT '{}',
          next_review_date TIMESTAMP,
          author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          last_updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          review_status VARCHAR(50),
          review_comment TEXT,
          reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMP,
          is_demo BOOLEAN NOT NULL DEFAULT false
        );
      `);
    } else {
      await addColumn('policy_manager', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // model_inventories
    if (!(await tableExists('model_inventories'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE model_inventories (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          provider_model VARCHAR(255),
          version VARCHAR(255),
          approver INTEGER REFERENCES users(id) ON DELETE SET NULL,
          capabilities TEXT,
          security_assessment BOOLEAN DEFAULT false,
          status enum_model_inventories_status DEFAULT 'Pending',
          status_date TIMESTAMP WITH TIME ZONE,
          reference_link VARCHAR(255),
          biases VARCHAR(255),
          limitations VARCHAR(255),
          hosting_provider VARCHAR(255),
          security_assessment_data JSONB DEFAULT '[]'::JSONB,
          is_demo BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          provider VARCHAR(255) NOT NULL,
          model VARCHAR(255) NOT NULL
        );
      `);
    } else {
      await addColumn('model_inventories', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    if (await columnExists('model_inventories', 'organization_id')) {
      await createIndex('idx_model_inventories_org', 'model_inventories', 'organization_id');
    }

    // model_risks
    if (!(await tableExists('model_risks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE model_risks (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          risk_name VARCHAR(255),
          risk_category enum_model_risks_risk_category,
          risk_level enum_model_risks_risk_level,
          status enum_model_risks_status DEFAULT 'Open',
          owner INTEGER REFERENCES users(id) ON DELETE SET NULL,
          target_date TIMESTAMP,
          description TEXT,
          mitigation_plan TEXT,
          impact TEXT,
          likelihood VARCHAR(255),
          key_metrics TEXT,
          current_values TEXT,
          threshold VARCHAR(255),
          model_id INTEGER REFERENCES model_inventories(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_deleted BOOLEAN DEFAULT false,
          deleted_at TIMESTAMP,
          is_demo BOOLEAN DEFAULT false
        );
      `);
    } else {
      await addColumn('model_risks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // datasets
    if (!(await tableExists('datasets'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE datasets (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255),
          description TEXT,
          version VARCHAR(50),
          owner VARCHAR(255),
          type enum_dataset_type,
          function TEXT,
          source VARCHAR(255),
          license VARCHAR(255),
          format VARCHAR(100),
          classification enum_data_classification,
          contains_pii BOOLEAN DEFAULT false,
          pii_types TEXT,
          status enum_dataset_status DEFAULT 'Draft',
          status_date TIMESTAMP,
          known_biases TEXT,
          bias_mitigation TEXT,
          collection_method TEXT,
          preprocessing_steps TEXT,
          documentation_data JSONB DEFAULT '[]',
          is_demo BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('datasets', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // tasks
    if (!(await tableExists('tasks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE tasks (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          due_date TIMESTAMP WITH TIME ZONE,
          priority enum_tasks_priority DEFAULT 'Medium',
          status enum_tasks_status DEFAULT 'Open',
          categories JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          is_demo BOOLEAN DEFAULT false
        );
      `);
    } else {
      await addColumn('tasks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    if (await columnExists('tasks', 'organization_id')) {
      await createIndex('idx_tasks_org', 'tasks', 'organization_id');
    }

    // task_assignees
    if (!(await tableExists('task_assignees'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE task_assignees (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          UNIQUE (task_id, user_id)
        );
      `);
    } else {
      await addColumn('task_assignees', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ai_incident_managements
    if (!(await tableExists('ai_incident_managements'))) {
      await queryInterface.sequelize.query(`CREATE SEQUENCE IF NOT EXISTS incident_id_seq;`);
      await queryInterface.sequelize.query(`
        CREATE TABLE ai_incident_managements (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          incident_id VARCHAR(255) DEFAULT 'INC-' || nextval('incident_id_seq'),
          ai_project VARCHAR(255),
          type VARCHAR(255),
          severity VARCHAR(20),
          occurred_date TIMESTAMP,
          date_detected TIMESTAMP,
          reporter VARCHAR(255),
          status VARCHAR(20) DEFAULT 'Open',
          categories_of_harm JSON,
          affected_persons_groups TEXT,
          description TEXT,
          relationship_causality TEXT,
          immediate_mitigations TEXT,
          planned_corrective_actions TEXT,
          model_system_version VARCHAR(255),
          interim_report BOOLEAN DEFAULT FALSE,
          approval_status VARCHAR(20) DEFAULT 'Pending',
          approved_by VARCHAR(255),
          approval_date TIMESTAMP,
          approval_notes TEXT,
          archived BOOLEAN DEFAULT FALSE,
          is_demo BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(organization_id, incident_id)
        );
      `);
    } else {
      await addColumn('ai_incident_managements', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // automations
    if (!(await tableExists('automations'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE automations (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          trigger_id INTEGER REFERENCES automation_triggers(id) ON DELETE RESTRICT,
          params JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT TRUE,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('automations', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // automation_actions_data
    if (!(await tableExists('automation_actions_data'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE automation_actions_data (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          automation_id INTEGER REFERENCES automations(id) ON DELETE CASCADE,
          action_type_id INTEGER REFERENCES automation_actions(id) ON DELETE RESTRICT,
          params JSONB DEFAULT '{}',
          "order" INTEGER DEFAULT 1
        );
      `);
    } else {
      await addColumn('automation_actions_data', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // automation_execution_logs
    if (!(await tableExists('automation_execution_logs'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE automation_execution_logs (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          automation_id INTEGER REFERENCES automations(id) ON DELETE CASCADE,
          triggered_at TIMESTAMP DEFAULT NOW(),
          trigger_data JSONB DEFAULT '{}',
          action_results JSONB DEFAULT '[]',
          status TEXT CHECK (status IN ('success', 'partial_success', 'failure')) DEFAULT 'success',
          execution_time_ms INTEGER,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('automation_execution_logs', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // notifications
    if (!(await tableExists('notifications'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE notifications (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type enum_notification_type,
          title VARCHAR(255),
          message TEXT,
          entity_type enum_notification_entity_type,
          entity_id INTEGER,
          entity_name VARCHAR(255),
          action_url VARCHAR(500),
          is_read BOOLEAN DEFAULT FALSE,
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          metadata JSONB
        );
      `);
    } else {
      await addColumn('notifications', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // plugin_installations
    if (!(await tableExists('plugin_installations'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE plugin_installations (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          plugin_key VARCHAR(100) NOT NULL,
          status VARCHAR(20) DEFAULT 'installed',
          installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          error_message TEXT,
          configuration JSONB,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(organization_id, plugin_key)
        );
      `);
    } else {
      await addColumn('plugin_installations', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // llm_keys
    if (!(await tableExists('llm_keys'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE llm_keys (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          key TEXT NOT NULL,
          name enum_llm_keys_provider NOT NULL,
          url TEXT,
          model TEXT NOT NULL,
          custom_headers JSONB DEFAULT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('llm_keys', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
      await addColumn('llm_keys', 'custom_headers', 'JSONB DEFAULT NULL');
    }

    // invitations
    if (!(await tableExists('invitations'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE invitations (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          email VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          surname VARCHAR(255),
          role_id INTEGER REFERENCES roles(id),
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          invited_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      await addColumn('invitations', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // notes
    if (!(await tableExists('notes'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE notes (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          attached_to VARCHAR(50) NOT NULL,
          attached_to_id VARCHAR(255) NOT NULL,
          is_edited BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      await addColumn('notes', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // share_links
    if (!(await tableExists('share_links'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE share_links (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          share_token VARCHAR(64) UNIQUE NOT NULL,
          resource_type VARCHAR(50) NOT NULL,
          resource_id INTEGER NOT NULL,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          settings JSONB DEFAULT '{"shareAllFields": false, "allowDataExport": true}'::jsonb,
          is_enabled BOOLEAN DEFAULT true,
          expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      await addColumn('share_links', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // approval_workflows
    if (!(await tableExists('approval_workflows'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE approval_workflows (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          workflow_title VARCHAR(255) NOT NULL,
          entity_type VARCHAR(50) CHECK (entity_type IN ('use_case', 'project', 'file')),
          description TEXT,
          created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('approval_workflows', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // approval_workflow_steps
    if (!(await tableExists('approval_workflow_steps'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE approval_workflow_steps (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          workflow_id INTEGER REFERENCES approval_workflows(id) ON DELETE CASCADE,
          step_number INTEGER NOT NULL,
          step_name VARCHAR(255) NOT NULL,
          description TEXT,
          requires_all_approvers BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(workflow_id, step_number)
        );
      `);
    } else {
      await addColumn('approval_workflow_steps', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // approval_requests
    if (!(await tableExists('approval_requests'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE approval_requests (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          request_name VARCHAR(255),
          workflow_id INTEGER REFERENCES approval_workflows(id) ON DELETE CASCADE,
          entity_id INTEGER,
          entity_type VARCHAR(50),
          entity_data JSONB,
          status VARCHAR(50) DEFAULT 'Pending',
          requested_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
          current_step INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('approval_requests', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ========================================
    // ADDITIONAL TENANT TABLES (Junction & Change History)
    // ========================================
    console.log('📋 Ensuring additional junction & history tables...');

    // approval_request_steps
    if (!(await tableExists('approval_request_steps'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE approval_request_steps (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          request_id INTEGER NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
          step_number INTEGER NOT NULL,
          step_name VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Approved', 'Rejected')),
          date_assigned TIMESTAMP,
          date_completed TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(request_id, step_number)
        );
      `);
    } else {
      await addColumn('approval_request_steps', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // approval_request_step_approvals
    if (!(await tableExists('approval_request_step_approvals'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE approval_request_step_approvals (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          request_step_id INTEGER NOT NULL REFERENCES approval_request_steps(id) ON DELETE CASCADE,
          approver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          approval_result VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (approval_result IN ('Pending', 'Approved', 'Rejected')),
          comments TEXT,
          approved_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(request_step_id, approver_id)
        );
      `);
    } else {
      await addColumn('approval_request_step_approvals', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // approval_step_approvers
    if (!(await tableExists('approval_step_approvers'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE approval_step_approvers (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          workflow_step_id INTEGER NOT NULL REFERENCES approval_workflow_steps(id) ON DELETE CASCADE,
          approver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(workflow_step_id, approver_id)
        );
      `);
    } else {
      await addColumn('approval_step_approvers', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // task_entity_links
    if (!(await tableExists('task_entity_links'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE task_entity_links (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
          entity_type VARCHAR(50) NOT NULL,
          entity_id INTEGER NOT NULL,
          entity_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(task_id, entity_type, entity_id)
        );
      `);
    } else {
      await addColumn('task_entity_links', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // policy_linked_objects
    if (!(await tableExists('policy_linked_objects'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE policy_linked_objects (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          policy_id INTEGER REFERENCES policy_manager(id) ON DELETE CASCADE,
          object_type VARCHAR(50) NOT NULL,
          object_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('policy_linked_objects', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // policy_manager__assigned_reviewer_ids
    if (!(await tableExists('policy_manager__assigned_reviewer_ids'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE policy_manager__assigned_reviewer_ids (
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          policy_manager_id INTEGER REFERENCES policy_manager(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          PRIMARY KEY (policy_manager_id, user_id)
        );
      `);
    } else {
      await addColumn('policy_manager__assigned_reviewer_ids', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // dataset_projects
    if (!(await tableExists('dataset_projects'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE dataset_projects (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
          project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(dataset_id, project_id)
        );
      `);
    } else {
      await addColumn('dataset_projects', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // dataset_model_inventories
    if (!(await tableExists('dataset_model_inventories'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE dataset_model_inventories (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
          model_inventory_id INTEGER REFERENCES model_inventories(id) ON DELETE CASCADE,
          relationship_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(dataset_id, model_inventory_id)
        );
      `);
    } else {
      await addColumn('dataset_model_inventories', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // model_inventories_projects_frameworks
    if (!(await tableExists('model_inventories_projects_frameworks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE model_inventories_projects_frameworks (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          model_inventory_id INTEGER REFERENCES model_inventories(id) ON DELETE CASCADE,
          project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
          framework_id INTEGER REFERENCES frameworks(id) ON DELETE CASCADE,
          UNIQUE(model_inventory_id, project_id, framework_id)
        );
      `);
    } else {
      await addColumn('model_inventories_projects_frameworks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // Change History Tables
    console.log('📋 Ensuring change history tables...');

    // vendor_change_history
    if (!(await tableExists('vendor_change_history'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE vendor_change_history (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          vendor_id INTEGER,
          field_name VARCHAR(255),
          old_value TEXT,
          new_value TEXT,
          action VARCHAR(50),
          changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          changed_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('vendor_change_history', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // vendor_risk_change_history
    if (!(await tableExists('vendor_risk_change_history'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE vendor_risk_change_history (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          vendor_risk_id INTEGER,
          field_name VARCHAR(255),
          old_value TEXT,
          new_value TEXT,
          action VARCHAR(50),
          changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          changed_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('vendor_risk_change_history', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // project_risk_change_history
    if (!(await tableExists('project_risk_change_history'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE project_risk_change_history (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          project_risk_id INTEGER,
          field_name VARCHAR(255),
          old_value TEXT,
          new_value TEXT,
          action VARCHAR(50),
          changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          changed_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('project_risk_change_history', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // policy_change_history
    if (!(await tableExists('policy_change_history'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE policy_change_history (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          policy_id INTEGER,
          field_name VARCHAR(255),
          old_value TEXT,
          new_value TEXT,
          action VARCHAR(50),
          changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          changed_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('policy_change_history', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // incident_change_history
    if (!(await tableExists('incident_change_history'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE incident_change_history (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          incident_id INTEGER,
          field_name VARCHAR(255),
          old_value TEXT,
          new_value TEXT,
          action VARCHAR(50),
          changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          changed_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('incident_change_history', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // use_case_change_history
    if (!(await tableExists('use_case_change_history'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE use_case_change_history (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          use_case_id INTEGER,
          field_name VARCHAR(255),
          old_value TEXT,
          new_value TEXT,
          action VARCHAR(50),
          changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          changed_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('use_case_change_history', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // model_inventory_change_history
    if (!(await tableExists('model_inventory_change_history'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE model_inventory_change_history (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          model_inventory_id INTEGER,
          field_name VARCHAR(255),
          old_value TEXT,
          new_value TEXT,
          action VARCHAR(50),
          changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          changed_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('model_inventory_change_history', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // model_risk_change_history
    if (!(await tableExists('model_risk_change_history'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE model_risk_change_history (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          model_risk_id INTEGER,
          field_name VARCHAR(255),
          old_value TEXT,
          new_value TEXT,
          action VARCHAR(50),
          changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          changed_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('model_risk_change_history', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // file_change_history
    if (!(await tableExists('file_change_history'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE file_change_history (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          file_id INTEGER,
          field_name VARCHAR(255),
          old_value TEXT,
          new_value TEXT,
          action VARCHAR(50),
          changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          changed_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('file_change_history', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // dataset_change_histories
    if (!(await tableExists('dataset_change_histories'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE dataset_change_histories (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          dataset_id INTEGER,
          field_name VARCHAR(255),
          old_value TEXT,
          new_value TEXT,
          action VARCHAR(50),
          changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          changed_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('dataset_change_histories', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // task_change_history
    if (!(await tableExists('task_change_history'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE task_change_history (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          task_id INTEGER,
          field_name VARCHAR(255),
          old_value TEXT,
          new_value TEXT,
          action VARCHAR(50),
          changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          changed_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('task_change_history', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // training_change_history
    if (!(await tableExists('training_change_history'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE training_change_history (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          training_id INTEGER,
          field_name VARCHAR(255),
          old_value TEXT,
          new_value TEXT,
          action VARCHAR(50),
          changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          changed_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('training_change_history', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // risk_history & model_inventory_history
    if (!(await tableExists('risk_history'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE risk_history (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          parameter VARCHAR(255),
          snapshot_data JSONB,
          recorded_at TIMESTAMP DEFAULT NOW(),
          triggered_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('risk_history', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    if (!(await tableExists('model_inventory_history'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE model_inventory_history (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          parameter VARCHAR(255),
          snapshot_data JSONB,
          recorded_at TIMESTAMP DEFAULT NOW(),
          triggered_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('model_inventory_history', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ========================================
    // RISK JUNCTION TABLES
    // ========================================
    console.log('📋 Ensuring risk junction tables...');

    // controls_eu__risks
    if (!(await tableExists('controls_eu__risks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE controls_eu__risks (
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          control_id INTEGER,
          projects_risks_id INTEGER,
          PRIMARY KEY (control_id, projects_risks_id)
        );
      `);
    } else {
      await addColumn('controls_eu__risks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // answers_eu__risks
    if (!(await tableExists('answers_eu__risks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE answers_eu__risks (
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          answer_id INTEGER,
          projects_risks_id INTEGER,
          PRIMARY KEY (answer_id, projects_risks_id)
        );
      `);
    } else {
      await addColumn('answers_eu__risks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // subclauses_iso__risks
    if (!(await tableExists('subclauses_iso__risks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE subclauses_iso__risks (
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          subclause_id INTEGER,
          projects_risks_id INTEGER,
          PRIMARY KEY (subclause_id, projects_risks_id)
        );
      `);
    } else {
      await addColumn('subclauses_iso__risks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // subclauses_iso27001__risks
    if (!(await tableExists('subclauses_iso27001__risks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE subclauses_iso27001__risks (
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          subclause_id INTEGER,
          projects_risks_id INTEGER,
          PRIMARY KEY (subclause_id, projects_risks_id)
        );
      `);
    } else {
      await addColumn('subclauses_iso27001__risks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // annexcontrols_iso27001__risks
    if (!(await tableExists('annexcontrols_iso27001__risks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE annexcontrols_iso27001__risks (
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          annexcontrol_id INTEGER,
          projects_risks_id INTEGER,
          PRIMARY KEY (annexcontrol_id, projects_risks_id)
        );
      `);
    } else {
      await addColumn('annexcontrols_iso27001__risks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // nist_ai_rmf_subcategories__risks
    if (!(await tableExists('nist_ai_rmf_subcategories__risks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE nist_ai_rmf_subcategories__risks (
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          nist_ai_rmf_subcategory_id INTEGER,
          projects_risks_id INTEGER,
          PRIMARY KEY (nist_ai_rmf_subcategory_id, projects_risks_id)
        );
      `);
    } else {
      await addColumn('nist_ai_rmf_subcategories__risks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ========================================
    // AI DETECTION, SHADOW AI, AI TRUST CENTER
    // ========================================
    console.log('📋 Ensuring AI detection & Shadow AI tables...');

    // ai_detection_scans
    if (!(await tableExists('ai_detection_scans'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ai_detection_scans (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          repository_url TEXT,
          repository_name VARCHAR(255),
          repository_owner VARCHAR(255),
          repository_id INTEGER,
          default_branch VARCHAR(255),
          status VARCHAR(50) DEFAULT 'pending',
          cache_path TEXT,
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          duration_ms INTEGER,
          error_message TEXT,
          total_files INTEGER DEFAULT 0,
          files_scanned INTEGER DEFAULT 0,
          findings_count INTEGER DEFAULT 0,
          triggered_by INTEGER,
          triggered_by_type VARCHAR(50),
          risk_score NUMERIC(5,2),
          risk_score_grade VARCHAR(10),
          risk_score_details JSONB,
          risk_score_calculated_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('ai_detection_scans', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ai_detection_findings
    if (!(await tableExists('ai_detection_findings'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ai_detection_findings (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          scan_id INTEGER,
          finding_type VARCHAR(50),
          name VARCHAR(255),
          category VARCHAR(100),
          provider VARCHAR(100),
          description TEXT,
          documentation_url TEXT,
          confidence NUMERIC(5,2),
          severity VARCHAR(20),
          threat_type VARCHAR(100),
          risk_level VARCHAR(20),
          license_id VARCHAR(100),
          license_name VARCHAR(255),
          license_risk VARCHAR(20),
          license_source VARCHAR(50),
          file_paths JSONB,
          file_count INTEGER DEFAULT 0,
          module_name VARCHAR(255),
          operator_name VARCHAR(255),
          governance_status VARCHAR(50),
          governance_updated_by INTEGER,
          governance_updated_at TIMESTAMP,
          cwe_id VARCHAR(50),
          cwe_name VARCHAR(255),
          owasp_ml_id VARCHAR(50),
          owasp_ml_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('ai_detection_findings', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ai_detection_repositories
    if (!(await tableExists('ai_detection_repositories'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ai_detection_repositories (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          repository_url VARCHAR(500) NOT NULL,
          repository_name VARCHAR(255) NOT NULL,
          repository_owner VARCHAR(255) NOT NULL,
          display_name VARCHAR(255),
          default_branch VARCHAR(255) DEFAULT 'main',
          github_token_id INTEGER REFERENCES github_tokens(id) ON DELETE SET NULL,
          is_enabled BOOLEAN DEFAULT TRUE,
          schedule_enabled BOOLEAN DEFAULT FALSE,
          schedule_frequency VARCHAR(50),
          schedule_hour INTEGER,
          schedule_minute INTEGER,
          schedule_day_of_week INTEGER,
          schedule_day_of_month INTEGER,
          last_scan_id INTEGER,
          last_scan_status VARCHAR(50),
          last_scan_at TIMESTAMPTZ,
          next_scan_at TIMESTAMPTZ,
          risk_score INTEGER,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(organization_id, repository_owner, repository_name)
        );
      `);
    } else {
      await addColumn('ai_detection_repositories', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ai_detection_risk_scoring_config
    if (!(await tableExists('ai_detection_risk_scoring_config'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ai_detection_risk_scoring_config (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          dimension_weights JSONB,
          llm_enabled BOOLEAN DEFAULT FALSE,
          llm_key_id INTEGER,
          updated_by INTEGER,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('ai_detection_risk_scoring_config', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // shadow_ai_tools
    if (!(await tableExists('shadow_ai_tools'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE shadow_ai_tools (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255) UNIQUE,
          vendor VARCHAR(255),
          domains TEXT[] NOT NULL,
          status VARCHAR(50) DEFAULT 'detected',
          risk_score INTEGER,
          total_events INTEGER DEFAULT 0,
          total_users INTEGER DEFAULT 0,
          first_detected_at TIMESTAMPTZ,
          last_seen_at TIMESTAMPTZ,
          governance_owner_id INTEGER,
          model_inventory_id INTEGER,
          risk_entry_id INTEGER,
          trains_on_data BOOLEAN,
          sso_support BOOLEAN,
          encryption_at_rest BOOLEAN,
          data_residency VARCHAR(100),
          gdpr_compliant BOOLEAN,
          soc2_certified BOOLEAN,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('shadow_ai_tools', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // shadow_ai_events
    if (!(await tableExists('shadow_ai_events'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE shadow_ai_events (
          id BIGSERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          detected_tool_id INTEGER REFERENCES shadow_ai_tools(id) ON DELETE SET NULL,
          user_email VARCHAR(255) NOT NULL,
          department VARCHAR(255),
          job_title VARCHAR(255),
          manager_email VARCHAR(255),
          action VARCHAR(50),
          http_method VARCHAR(10),
          uri_path TEXT,
          destination VARCHAR(512),
          detected_model VARCHAR(255),
          event_timestamp TIMESTAMPTZ,
          ingested_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('shadow_ai_events', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // shadow_ai_daily_rollups
    if (!(await tableExists('shadow_ai_daily_rollups'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE shadow_ai_daily_rollups (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          rollup_date DATE NOT NULL,
          tool_id INTEGER REFERENCES shadow_ai_tools(id) ON DELETE CASCADE,
          user_email VARCHAR(255) NOT NULL,
          department VARCHAR(255),
          total_events INTEGER DEFAULT 0,
          post_events INTEGER DEFAULT 0,
          blocked_events INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(organization_id, rollup_date, user_email, tool_id)
        );
      `);
    } else {
      await addColumn('shadow_ai_daily_rollups', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // shadow_ai_monthly_rollups
    if (!(await tableExists('shadow_ai_monthly_rollups'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE shadow_ai_monthly_rollups (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          rollup_month DATE NOT NULL,
          tool_id INTEGER REFERENCES shadow_ai_tools(id) ON DELETE CASCADE,
          department VARCHAR(255),
          total_events INTEGER DEFAULT 0,
          post_events INTEGER DEFAULT 0,
          blocked_events INTEGER DEFAULT 0,
          unique_users INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(organization_id, rollup_month, tool_id, department)
        );
      `);
    } else {
      await addColumn('shadow_ai_monthly_rollups', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // shadow_ai_rules
    if (!(await tableExists('shadow_ai_rules'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE shadow_ai_rules (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          trigger_type VARCHAR(100) NOT NULL,
          trigger_config JSONB NOT NULL,
          actions JSONB NOT NULL,
          cooldown_minutes INTEGER DEFAULT 1440,
          is_active BOOLEAN DEFAULT TRUE,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('shadow_ai_rules', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // shadow_ai_alert_history
    if (!(await tableExists('shadow_ai_alert_history'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE shadow_ai_alert_history (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          rule_id INTEGER REFERENCES shadow_ai_rules(id) ON DELETE SET NULL,
          rule_name VARCHAR(255),
          trigger_type VARCHAR(100),
          trigger_data JSONB,
          actions_taken JSONB,
          fired_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('shadow_ai_alert_history', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // shadow_ai_rule_notifications
    if (!(await tableExists('shadow_ai_rule_notifications'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE shadow_ai_rule_notifications (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          rule_id INTEGER REFERENCES shadow_ai_rules(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(organization_id, rule_id, user_id)
        );
      `);
    } else {
      await addColumn('shadow_ai_rule_notifications', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // shadow_ai_settings
    if (!(await tableExists('shadow_ai_settings'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE shadow_ai_settings (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          rate_limit_max_events_per_hour INTEGER DEFAULT 0,
          retention_events_days INTEGER DEFAULT 30,
          retention_daily_rollups_days INTEGER DEFAULT 365,
          retention_alert_history_days INTEGER DEFAULT 90,
          updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('shadow_ai_settings', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // shadow_ai_syslog_config
    if (!(await tableExists('shadow_ai_syslog_config'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE shadow_ai_syslog_config (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          is_active BOOLEAN DEFAULT true,
          source_identifier VARCHAR(255),
          parser_type VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('shadow_ai_syslog_config', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // shadow_ai_api_keys
    if (!(await tableExists('shadow_ai_api_keys'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE shadow_ai_api_keys (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          label VARCHAR(255) NOT NULL,
          key_prefix VARCHAR(20) NOT NULL,
          key_hash VARCHAR(255) NOT NULL UNIQUE,
          is_active BOOLEAN DEFAULT TRUE,
          last_used_at TIMESTAMPTZ,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('shadow_ai_api_keys', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ========================================
    // AI TRUST CENTER TABLES
    // ========================================
    console.log('📋 Ensuring AI Trust Center tables...');

    // ai_trust_center
    if (!(await tableExists('ai_trust_center'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ai_trust_center (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          title VARCHAR(255),
          logo TEXT,
          visible BOOLEAN DEFAULT TRUE,
          header_color VARCHAR(20),
          intro_visible BOOLEAN DEFAULT TRUE,
          company_description_visible BOOLEAN DEFAULT TRUE,
          compliance_badges_visible BOOLEAN DEFAULT TRUE,
          resources_visible BOOLEAN DEFAULT TRUE,
          subprocessor_visible BOOLEAN DEFAULT TRUE,
          terms_and_contact_visible BOOLEAN DEFAULT TRUE,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('ai_trust_center', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ai_trust_center_intro
    if (!(await tableExists('ai_trust_center_intro'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ai_trust_center_intro (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          purpose_visible BOOLEAN DEFAULT TRUE,
          purpose_text TEXT,
          our_mission_visible BOOLEAN DEFAULT TRUE,
          our_mission_text TEXT,
          our_statement_visible BOOLEAN DEFAULT TRUE,
          our_statement_text TEXT,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('ai_trust_center_intro', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ai_trust_center_company_description
    if (!(await tableExists('ai_trust_center_company_description'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ai_trust_center_company_description (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          background_visible BOOLEAN DEFAULT TRUE,
          background_text TEXT,
          core_benefits_visible BOOLEAN DEFAULT TRUE,
          core_benefits_text TEXT,
          compliance_doc_visible BOOLEAN DEFAULT TRUE,
          compliance_doc_text TEXT,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('ai_trust_center_company_description', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ai_trust_center_compliance_badges
    if (!(await tableExists('ai_trust_center_compliance_badges'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ai_trust_center_compliance_badges (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          gdpr BOOLEAN DEFAULT FALSE,
          hipaa BOOLEAN DEFAULT FALSE,
          ccpa BOOLEAN DEFAULT FALSE,
          soc2_type_i BOOLEAN DEFAULT FALSE,
          soc2_type_ii BOOLEAN DEFAULT FALSE,
          iso_27001 BOOLEAN DEFAULT FALSE,
          iso_42001 BOOLEAN DEFAULT FALSE,
          eu_ai_act BOOLEAN DEFAULT FALSE,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('ai_trust_center_compliance_badges', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ai_trust_center_resources
    if (!(await tableExists('ai_trust_center_resources'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ai_trust_center_resources (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255),
          description TEXT,
          file_id INTEGER,
          visible BOOLEAN DEFAULT TRUE,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('ai_trust_center_resources', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ai_trust_center_subprocessor
    if (!(await tableExists('ai_trust_center_subprocessor'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ai_trust_center_subprocessor (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255),
          purpose TEXT,
          location VARCHAR(255),
          url TEXT,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('ai_trust_center_subprocessor', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ai_trust_center_terms_and_contact
    if (!(await tableExists('ai_trust_center_terms_and_contact'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ai_trust_center_terms_and_contact (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          terms_visible BOOLEAN DEFAULT TRUE,
          terms_text TEXT,
          privacy_visible BOOLEAN DEFAULT TRUE,
          privacy_text TEXT,
          email_visible BOOLEAN DEFAULT TRUE,
          email_text TEXT,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('ai_trust_center_terms_and_contact', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ========================================
    // REMAINING TENANT TABLES
    // ========================================
    console.log('📋 Ensuring remaining tenant tables...');

    // evidence_hub
    if (!(await tableExists('evidence_hub'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE evidence_hub (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          evidence_name VARCHAR(255),
          evidence_type VARCHAR(100),
          description TEXT,
          status VARCHAR(50) DEFAULT 'active',
          expiry_date DATE,
          mapped_model_ids INTEGER[],
          mapped_framework_ids INTEGER[],
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('evidence_hub', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
      await addColumn('evidence_hub', 'status', "VARCHAR(50) DEFAULT 'active'");
      await addColumn('evidence_hub', 'mapped_framework_ids', 'INTEGER[]');
      await addColumn('evidence_hub', 'created_by', 'INTEGER REFERENCES users(id) ON DELETE SET NULL');
    }

    // api_tokens
    if (!(await tableExists('api_tokens'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE api_tokens (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255),
          token TEXT,
          expires_at TIMESTAMP,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('api_tokens', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // github_tokens
    if (!(await tableExists('github_tokens'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE github_tokens (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          token_name VARCHAR(255),
          encrypted_token TEXT,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          last_used_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('github_tokens', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // user_preferences
    if (!(await tableExists('user_preferences'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE user_preferences (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          preferences JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `);
    } else {
      await addColumn('user_preferences', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // entity_graph_annotations
    if (!(await tableExists('entity_graph_annotations'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE entity_graph_annotations (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          entity_type VARCHAR(50),
          entity_id INTEGER,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('entity_graph_annotations', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // entity_graph_views
    if (!(await tableExists('entity_graph_views'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE entity_graph_views (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255),
          config JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('entity_graph_views', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // entity_graph_gap_rules
    if (!(await tableExists('entity_graph_gap_rules'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE entity_graph_gap_rules (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          rules JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('entity_graph_gap_rules', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // feature_settings
    if (!(await tableExists('feature_settings'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE feature_settings (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          lifecycle_enabled BOOLEAN DEFAULT FALSE,
          updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('feature_settings', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // slack_webhooks
    if (!(await tableExists('slack_webhooks'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE slack_webhooks (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          access_token VARCHAR(255) NOT NULL,
          access_token_iv VARCHAR(255) NOT NULL,
          scope VARCHAR(255) NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          team_name VARCHAR(255) NOT NULL,
          team_id VARCHAR(255) NOT NULL,
          channel VARCHAR(255) NOT NULL,
          channel_id VARCHAR(255) NOT NULL,
          configuration_url VARCHAR(255) NOT NULL,
          url VARCHAR(255) NOT NULL,
          url_iv VARCHAR(255) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          routing_type TEXT[],
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      await addColumn('slack_webhooks', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // advisor_conversations
    if (!(await tableExists('advisor_conversations'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE advisor_conversations (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          domain VARCHAR(100),
          messages JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('advisor_conversations', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // file_access_logs
    if (!(await tableExists('file_access_logs'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE file_access_logs (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          file_id INTEGER,
          org_id INTEGER,
          accessed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          action VARCHAR(50),
          access_date TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('file_access_logs', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // NOTE: automation_actions_data already created above (line ~996)

    // =====================================================
    // CE MARKING TABLES
    // =====================================================
    console.log('  Creating CE Marking tables...');

    // ce_markings
    if (!(await tableExists('ce_markings'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ce_markings (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          is_high_risk_ai_system BOOLEAN DEFAULT false,
          role_in_product VARCHAR(50) DEFAULT 'standalone',
          annex_iii_category VARCHAR(50) DEFAULT 'annex_iii_5',
          controls_completed INTEGER DEFAULT 0,
          controls_total INTEGER DEFAULT 0,
          assessments_completed INTEGER DEFAULT 0,
          assessments_total INTEGER DEFAULT 0,
          declaration_status VARCHAR(50) DEFAULT 'draft',
          signed_on DATE,
          signatory VARCHAR(255),
          declaration_document TEXT,
          registration_status VARCHAR(50) DEFAULT 'not_registered',
          eu_registration_id VARCHAR(255),
          registration_date DATE,
          eu_record_url TEXT,
          policies_linked INTEGER DEFAULT 0,
          evidence_linked INTEGER DEFAULT 0,
          total_incidents INTEGER DEFAULT 0,
          ai_act_reportable_incidents INTEGER DEFAULT 0,
          last_incident TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          CONSTRAINT unique_project_ce_marking UNIQUE(project_id)
        );
      `);
    } else {
      await addColumn('ce_markings', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ce_marking_conformity_steps
    if (!(await tableExists('ce_marking_conformity_steps'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ce_marking_conformity_steps (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          ce_marking_id INTEGER NOT NULL,
          step_number INTEGER NOT NULL,
          step_name VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'Not started',
          owner VARCHAR(255),
          due_date DATE,
          completed_date DATE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(ce_marking_id, step_number)
        );
      `);
    } else {
      await addColumn('ce_marking_conformity_steps', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ce_marking_audit_trail
    if (!(await tableExists('ce_marking_audit_trail'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ce_marking_audit_trail (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          ce_marking_id INTEGER NOT NULL,
          field_name VARCHAR(255) NOT NULL,
          old_value TEXT,
          new_value TEXT,
          changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          changed_at TIMESTAMP DEFAULT NOW(),
          change_type VARCHAR(50)
        );
      `);
    } else {
      await addColumn('ce_marking_audit_trail', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ce_marking_policies
    if (!(await tableExists('ce_marking_policies'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ce_marking_policies (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          ce_marking_id INTEGER NOT NULL,
          policy_id INTEGER NOT NULL,
          linked_at TIMESTAMP NOT NULL DEFAULT NOW(),
          linked_by INTEGER NOT NULL
        );
      `);
    } else {
      await addColumn('ce_marking_policies', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ce_marking_evidences
    if (!(await tableExists('ce_marking_evidences'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ce_marking_evidences (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          ce_marking_id INTEGER NOT NULL,
          file_id INTEGER NOT NULL,
          linked_at TIMESTAMP NOT NULL DEFAULT NOW(),
          linked_by INTEGER NOT NULL
        );
      `);
    } else {
      await addColumn('ce_marking_evidences', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // ce_marking_incidents
    if (!(await tableExists('ce_marking_incidents'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE ce_marking_incidents (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          ce_marking_id INTEGER NOT NULL,
          incident_id INTEGER NOT NULL,
          linked_at TIMESTAMP NOT NULL DEFAULT NOW(),
          linked_by INTEGER NOT NULL
        );
      `);
    } else {
      await addColumn('ce_marking_incidents', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // =====================================================
    // POST-MARKET MONITORING TABLES
    // =====================================================
    console.log('  Creating Post-Market Monitoring tables...');

    // post_market_monitoring_configs
    if (!(await tableExists('post_market_monitoring_configs'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE post_market_monitoring_configs (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
          is_active BOOLEAN DEFAULT FALSE,
          frequency_value INTEGER NOT NULL DEFAULT 30,
          frequency_unit TEXT CHECK (frequency_unit IN ('days', 'weeks', 'months')) DEFAULT 'days',
          start_date DATE,
          reminder_days INTEGER DEFAULT 3,
          escalation_days INTEGER DEFAULT 7,
          escalation_contact_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          notification_hour INTEGER DEFAULT 9,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(project_id)
        );
      `);
    } else {
      await addColumn('post_market_monitoring_configs', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // post_market_monitoring_questions
    if (!(await tableExists('post_market_monitoring_questions'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE post_market_monitoring_questions (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          config_id INTEGER REFERENCES post_market_monitoring_configs(id) ON DELETE CASCADE,
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
      `);
    } else {
      await addColumn('post_market_monitoring_questions', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // post_market_monitoring_cycles
    if (!(await tableExists('post_market_monitoring_cycles'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE post_market_monitoring_cycles (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          config_id INTEGER REFERENCES post_market_monitoring_configs(id) ON DELETE CASCADE,
          cycle_number INTEGER NOT NULL,
          status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'escalated')) DEFAULT 'pending',
          started_at TIMESTAMP DEFAULT NOW(),
          due_at TIMESTAMP NOT NULL,
          reminder_sent_at TIMESTAMP,
          escalation_sent_at TIMESTAMP,
          completed_at TIMESTAMP,
          completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          assigned_stakeholder_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('post_market_monitoring_cycles', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // post_market_monitoring_responses
    if (!(await tableExists('post_market_monitoring_responses'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE post_market_monitoring_responses (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          cycle_id INTEGER REFERENCES post_market_monitoring_cycles(id) ON DELETE CASCADE,
          question_id INTEGER REFERENCES post_market_monitoring_questions(id) ON DELETE CASCADE,
          response_value JSONB,
          is_flagged BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(cycle_id, question_id)
        );
      `);
    } else {
      await addColumn('post_market_monitoring_responses', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // post_market_monitoring_reports
    if (!(await tableExists('post_market_monitoring_reports'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE post_market_monitoring_reports (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          cycle_id INTEGER REFERENCES post_market_monitoring_cycles(id) ON DELETE CASCADE,
          file_id INTEGER REFERENCES files(id) ON DELETE SET NULL,
          context_snapshot JSONB NOT NULL DEFAULT '{}',
          generated_at TIMESTAMP DEFAULT NOW(),
          generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          UNIQUE(cycle_id)
        );
      `);
    } else {
      await addColumn('post_market_monitoring_reports', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // =====================================================
    // LLM EVALS TABLES
    // =====================================================
    console.log('  Creating LLM Evals tables...');

    // llm_evals_organizations
    if (!(await tableExists('llm_evals_organizations'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE llm_evals_organizations (
          id VARCHAR(255) PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      await addColumn('llm_evals_organizations', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // llm_evals_org_members
    if (!(await tableExists('llm_evals_org_members'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE llm_evals_org_members (
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          org_id VARCHAR(255) NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(50) DEFAULT 'member',
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (org_id, user_id)
        );
      `);
    } else {
      await addColumn('llm_evals_org_members', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // llm_evals_projects
    if (!(await tableExists('llm_evals_projects'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE llm_evals_projects (
          id VARCHAR(255) PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          use_case VARCHAR(50) DEFAULT 'chatbot',
          org_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255)
        );
      `);
    } else {
      await addColumn('llm_evals_projects', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // llm_evals_datasets
    if (!(await tableExists('llm_evals_datasets'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE llm_evals_datasets (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          path TEXT NOT NULL,
          size BIGINT NOT NULL DEFAULT 0,
          prompt_count INTEGER DEFAULT 0,
          dataset_type VARCHAR(50) DEFAULT 'chatbot',
          turn_type VARCHAR(50) DEFAULT 'single-turn',
          org_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255)
        );
      `);
    } else {
      await addColumn('llm_evals_datasets', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // llm_evals_scorers
    if (!(await tableExists('llm_evals_scorers'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE llm_evals_scorers (
          id VARCHAR(255) PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          org_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(255) NOT NULL,
          metric_key VARCHAR(255) NOT NULL,
          config JSONB DEFAULT '{}',
          enabled BOOLEAN DEFAULT true,
          default_threshold DOUBLE PRECISION,
          weight DOUBLE PRECISION,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255)
        );
      `);
    } else {
      await addColumn('llm_evals_scorers', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // llm_evals_models
    if (!(await tableExists('llm_evals_models'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE llm_evals_models (
          id VARCHAR(255) PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          org_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          provider VARCHAR(100) NOT NULL,
          endpoint_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255)
        );
      `);
    } else {
      await addColumn('llm_evals_models', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // llm_evals_experiments
    if (!(await tableExists('llm_evals_experiments'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE llm_evals_experiments (
          id VARCHAR(255) PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          project_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          config JSONB NOT NULL,
          baseline_experiment_id VARCHAR(255),
          status VARCHAR(50) DEFAULT 'pending',
          results JSONB,
          error_message TEXT,
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255)
        );
      `);
    } else {
      await addColumn('llm_evals_experiments', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // llm_evals_logs
    if (!(await tableExists('llm_evals_logs'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE llm_evals_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          project_id VARCHAR(255) NOT NULL,
          experiment_id VARCHAR(255),
          trace_id UUID,
          parent_trace_id UUID,
          span_name VARCHAR(255),
          input_text TEXT,
          output_text TEXT,
          model_name VARCHAR(255),
          metadata JSONB DEFAULT '{}',
          latency_ms INTEGER,
          token_count INTEGER,
          cost NUMERIC(10, 6),
          status VARCHAR(50),
          error_message TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255)
        );
      `);
    } else {
      await addColumn('llm_evals_logs', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // llm_evals_metrics
    if (!(await tableExists('llm_evals_metrics'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE llm_evals_metrics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          project_id VARCHAR(255) NOT NULL,
          experiment_id VARCHAR(255),
          metric_name VARCHAR(255) NOT NULL,
          metric_type VARCHAR(255) NOT NULL,
          value DOUBLE PRECISION NOT NULL,
          dimensions JSONB,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      await addColumn('llm_evals_metrics', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // llm_evals_api_keys
    if (!(await tableExists('llm_evals_api_keys'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE llm_evals_api_keys (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          provider VARCHAR(50) NOT NULL,
          encrypted_api_key TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      await addColumn('llm_evals_api_keys', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // evaluation_llm_api_keys (legacy)
    if (!(await tableExists('evaluation_llm_api_keys'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE evaluation_llm_api_keys (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          provider VARCHAR(50) NOT NULL,
          encrypted_api_key TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      await addColumn('evaluation_llm_api_keys', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // llm_evals_arena_comparisons
    if (!(await tableExists('llm_evals_arena_comparisons'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE llm_evals_arena_comparisons (
          id VARCHAR(255) PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          org_id VARCHAR(255),
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
      `);
    } else {
      await addColumn('llm_evals_arena_comparisons', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // llm_evals_bias_audits
    if (!(await tableExists('llm_evals_bias_audits'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE llm_evals_bias_audits (
          id VARCHAR(255) PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          org_id VARCHAR(255) NOT NULL,
          project_id VARCHAR(255),
          preset_id VARCHAR(100) NOT NULL,
          preset_name VARCHAR(255) NOT NULL,
          mode VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          config JSONB NOT NULL,
          results JSONB,
          error TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_by VARCHAR(255)
        );
      `);
    } else {
      await addColumn('llm_evals_bias_audits', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // llm_evals_bias_audit_results
    if (!(await tableExists('llm_evals_bias_audit_results'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE llm_evals_bias_audit_results (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          audit_id VARCHAR(255) NOT NULL,
          category_type VARCHAR(100) NOT NULL,
          category_name VARCHAR(255) NOT NULL,
          applicant_count INTEGER NOT NULL,
          selected_count INTEGER NOT NULL,
          selection_rate DOUBLE PRECISION NOT NULL,
          impact_ratio DOUBLE PRECISION,
          excluded BOOLEAN DEFAULT FALSE,
          flagged BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      await addColumn('llm_evals_bias_audit_results', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // NOTE: Duplicate table definitions for vendor_risk_change_history, task_change_history,
    // training_change_history, model_risk_change_history, incident_change_history, llm_keys,
    // and invitations were removed from this section. They are defined earlier in this migration.

    // agent_primitives
    if (!(await tableExists('agent_primitives'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE agent_primitives (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          source_system VARCHAR(100) NOT NULL,
          primitive_type VARCHAR(50) NOT NULL,
          external_id VARCHAR(255) NOT NULL,
          display_name VARCHAR(255) NOT NULL,
          owner_id VARCHAR(255),
          permissions JSONB NOT NULL DEFAULT '[]',
          permission_categories JSONB NOT NULL DEFAULT '[]',
          last_activity TIMESTAMP,
          metadata JSONB NOT NULL DEFAULT '{}',
          review_status VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
          reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMP,
          linked_model_inventory_id INTEGER,
          is_stale BOOLEAN NOT NULL DEFAULT false,
          is_manual BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          CONSTRAINT agent_primitives_org_source_external_unique UNIQUE (organization_id, source_system, external_id)
        );
      `);
    } else {
      await addColumn('agent_primitives', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // agent_discovery_sync_log
    if (!(await tableExists('agent_discovery_sync_log'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE agent_discovery_sync_log (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          source_system VARCHAR(100) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'running',
          primitives_found INTEGER NOT NULL DEFAULT 0,
          primitives_created INTEGER NOT NULL DEFAULT 0,
          primitives_updated INTEGER NOT NULL DEFAULT 0,
          primitives_stale_flagged INTEGER NOT NULL DEFAULT 0,
          error_message TEXT,
          started_at TIMESTAMP NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMP,
          triggered_by VARCHAR(20) NOT NULL DEFAULT 'scheduled'
        );
      `);
    } else {
      await addColumn('agent_discovery_sync_log', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // agent_audit_log
    if (!(await tableExists('agent_audit_log'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE agent_audit_log (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          agent_primitive_id INTEGER NOT NULL,
          action VARCHAR(50) NOT NULL,
          field_changed VARCHAR(100),
          old_value TEXT,
          new_value TEXT,
          performed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('agent_audit_log', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // Agent discovery indexes
    await createIndex('idx_agent_primitives_org', 'agent_primitives', 'organization_id');
    await createIndex('idx_agent_primitives_source', 'agent_primitives', 'organization_id, source_system');
    await createIndex('idx_agent_primitives_status', 'agent_primitives', 'organization_id, review_status');
    await createIndex('idx_agent_primitives_type', 'agent_primitives', 'organization_id, primitive_type');
    await createIndex('idx_agent_sync_log_org', 'agent_discovery_sync_log', 'organization_id');
    await createIndex('idx_agent_audit_log_org', 'agent_audit_log', 'organization_id');
    await createIndex('idx_agent_audit_log_primitive', 'agent_audit_log', 'agent_primitive_id');

    // bias_fairness_evaluations
    if (!(await tableExists('bias_fairness_evaluations'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE bias_fairness_evaluations (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          eval_id VARCHAR(255) UNIQUE NOT NULL,
          model_name VARCHAR(255) NOT NULL,
          dataset_name VARCHAR(255) NOT NULL,
          model_task VARCHAR(100) NOT NULL,
          label_behavior VARCHAR(50) NOT NULL,
          config_data JSONB NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          results JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      await addColumn('bias_fairness_evaluations', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // mlflow_integrations
    if (!(await tableExists('mlflow_integrations'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE mlflow_integrations (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          tracking_server_url VARCHAR(255) NOT NULL,
          auth_method VARCHAR(10) NOT NULL DEFAULT 'none' CHECK (auth_method IN ('none', 'basic', 'token')),
          username VARCHAR(255),
          username_iv VARCHAR(255),
          password VARCHAR(255),
          password_iv VARCHAR(255),
          api_token VARCHAR(255),
          api_token_iv VARCHAR(255),
          verify_ssl BOOLEAN NOT NULL DEFAULT TRUE,
          timeout INTEGER NOT NULL DEFAULT 30,
          last_tested_at TIMESTAMP,
          last_test_status VARCHAR(10) CHECK (last_test_status IN ('success', 'error')),
          last_test_message TEXT,
          updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      await addColumn('mlflow_integrations', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // mlflow_model_records
    if (!(await tableExists('mlflow_model_records'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE mlflow_model_records (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          model_name VARCHAR(255) NOT NULL,
          version VARCHAR(255) NOT NULL,
          lifecycle_stage VARCHAR(255),
          run_id VARCHAR(255),
          description TEXT,
          source VARCHAR(255),
          status VARCHAR(255),
          tags JSONB NOT NULL DEFAULT '{}'::jsonb,
          metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
          parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
          experiment_id VARCHAR(255),
          experiment_name VARCHAR(255),
          artifact_location TEXT,
          training_status VARCHAR(255),
          training_started_at TIMESTAMP,
          training_ended_at TIMESTAMP,
          source_version VARCHAR(255),
          model_created_at TIMESTAMP,
          model_updated_at TIMESTAMP,
          last_synced_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT mlflow_model_records_org_model_version_unique UNIQUE (organization_id, model_name, version)
        );
      `);
    } else {
      await addColumn('mlflow_model_records', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // intake_forms
    if (!(await tableExists('intake_forms'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE intake_forms (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          slug VARCHAR(255) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          schema JSONB NOT NULL DEFAULT '{"version":"1.0","fields":[]}',
          submit_button_text VARCHAR(100) DEFAULT 'Submit',
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          ttl_expires_at TIMESTAMPTZ,
          public_id VARCHAR(16) UNIQUE,
          recipients JSONB DEFAULT '[]',
          risk_tier_system VARCHAR(20) DEFAULT 'generic',
          risk_assessment_config JSONB,
          llm_key_id INTEGER,
          suggested_questions_enabled BOOLEAN DEFAULT false,
          design_settings JSONB,
          created_by INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(slug)
        );
      `);
    } else {
      await addColumn('intake_forms', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // intake_submissions
    if (!(await tableExists('intake_submissions'))) {
      await queryInterface.sequelize.query(`
        CREATE TABLE intake_submissions (
          id SERIAL PRIMARY KEY,
          organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
          form_id INTEGER NOT NULL,
          submitter_email VARCHAR(255),
          submitter_name VARCHAR(255),
          data JSONB NOT NULL DEFAULT '{}',
          entity_type VARCHAR(50) NOT NULL,
          entity_id INTEGER,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          rejection_reason TEXT,
          reviewed_by INTEGER,
          reviewed_at TIMESTAMPTZ,
          original_submission_id INTEGER,
          resubmission_count INTEGER NOT NULL DEFAULT 0,
          ip_address VARCHAR(45),
          risk_assessment JSONB,
          risk_tier VARCHAR(20),
          risk_override JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    } else {
      await addColumn('intake_submissions', 'organization_id', 'INTEGER REFERENCES organizations(id) ON DELETE CASCADE');
    }

    // =====================================================
    // INDEXES
    // =====================================================
    console.log('📋 Creating indexes...');

    // Shadow AI indexes
    await createIndex('idx_shadow_ai_events_timestamp', 'shadow_ai_events', 'organization_id, event_timestamp');
    await createIndex('idx_shadow_ai_events_user', 'shadow_ai_events', 'organization_id, user_email');
    await createIndex('idx_shadow_ai_events_tool', 'shadow_ai_events', 'organization_id, detected_tool_id');
    await createIndex('idx_shadow_ai_daily_rollups_date', 'shadow_ai_daily_rollups', 'organization_id, rollup_date');
    await createIndex('idx_shadow_ai_daily_rollups_tool', 'shadow_ai_daily_rollups', 'organization_id, tool_id');
    await createIndex('idx_shadow_ai_alert_cooldown', 'shadow_ai_alert_history', 'rule_id, fired_at');

    // AI incident management indexes
    await createIndex('idx_ai_incidents_severity', 'ai_incident_managements', 'organization_id, severity');
    await createIndex('idx_ai_incidents_status', 'ai_incident_managements', 'organization_id, status');
    await createIndex('idx_ai_incidents_approval', 'ai_incident_managements', 'organization_id, approval_status');
    await createIndex('idx_ai_incidents_created', 'ai_incident_managements', 'organization_id, created_at');

    // AI detection indexes
    await createIndex('idx_ai_detection_findings_type', 'ai_detection_findings', 'organization_id, finding_type');
    await createIndex('idx_ai_detection_scans_status', 'ai_detection_scans', 'organization_id, status');

    // Partial unique index: prevent concurrent active scans for same repo
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_scans_unique_active
      ON ai_detection_scans (organization_id, repository_owner, repository_name)
      WHERE status IN ('pending', 'cloning', 'scanning');
    `);

    // Slack webhooks index
    await createIndex('idx_slack_webhooks_team', 'slack_webhooks', 'team_id');

    // Invitations partial unique index: only one pending invite per email per org
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_pending_email
      ON invitations(organization_id, email) WHERE status = 'pending';
    `);

    // =====================================================
    // FK CONSTRAINTS
    // =====================================================

    // CE marking FK constraints
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE ce_marking_conformity_steps ADD CONSTRAINT fk_ce_conformity_ce_marking FOREIGN KEY (ce_marking_id) REFERENCES ce_markings(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE ce_marking_audit_trail ADD CONSTRAINT fk_ce_audit_ce_marking FOREIGN KEY (ce_marking_id) REFERENCES ce_markings(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE ce_marking_policies ADD CONSTRAINT fk_ce_policies_ce_marking FOREIGN KEY (ce_marking_id) REFERENCES ce_markings(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE ce_marking_evidences ADD CONSTRAINT fk_ce_evidences_ce_marking FOREIGN KEY (ce_marking_id) REFERENCES ce_markings(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE ce_marking_incidents ADD CONSTRAINT fk_ce_incidents_ce_marking FOREIGN KEY (ce_marking_id) REFERENCES ce_markings(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE ce_marking_incidents ADD CONSTRAINT fk_ce_incidents_incident FOREIGN KEY (incident_id) REFERENCES ai_incident_managements(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // Add FK constraints if tables have approval_workflow_id
    if (await columnExists('projects', 'approval_workflow_id') && await tableExists('approval_workflows')) {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          ALTER TABLE projects
          ADD CONSTRAINT fk_projects_approval_workflow
          FOREIGN KEY (approval_workflow_id) REFERENCES approval_workflows(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
    }

    if (await columnExists('files', 'approval_workflow_id') && await tableExists('approval_workflows')) {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          ALTER TABLE files
          ADD CONSTRAINT fk_files_approval_workflow
          FOREIGN KEY (approval_workflow_id) REFERENCES approval_workflows(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
    }

    console.log('✅ Tenant tables migration complete!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back tenant tables...');
    // Rolling back is complex - in most cases you wouldn't want to drop these
    console.log('⚠️ Rollback not implemented - data preservation');
  }
};
