import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { getTenantHash } from "../tools/getTenantHash";
import { createNistAiRmfTablesForTenant } from "./COMPLETE_NIST_AI_RMF_IMPLEMENTATION";

export const createNewTenant = async (
  organization_id: number,
  transaction: Transaction
) => {
  try {
    const tenantHash = getTenantHash(organization_id);
    await sequelize.query(`CREATE SCHEMA "${tenantHash}";`, { transaction });

    // Create ENUM types for vendor scorecard fields
    await sequelize.query(
      `
      CREATE TYPE "${tenantHash}".enum_vendors_data_sensitivity AS ENUM (
        'None',
        'Internal only', 
        'Personally identifiable information (PII)',
        'Financial data',
        'Health data (e.g. HIPAA)',
        'Model weights or AI assets',
        'Other sensitive data'
      );`,
      { transaction }
    );

    await sequelize.query(
      `
      CREATE TYPE "${tenantHash}".enum_vendors_business_criticality AS ENUM (
        'Low (vendor supports non-core functions)',
        'Medium (affects operations but is replaceable)',
        'High (critical to core services or products)'
      );`,
      { transaction }
    );

    await sequelize.query(
      `
      CREATE TYPE "${tenantHash}".enum_vendors_past_issues AS ENUM (
        'None',
        'Minor incident (e.g. small delay, minor bug)',
        'Major incident (e.g. data breach, legal issue)'
      );`,
      { transaction }
    );

    await sequelize.query(
      `
      CREATE TYPE "${tenantHash}".enum_vendors_regulatory_exposure AS ENUM (
        'None',
        'GDPR (EU)',
        'HIPAA (US)',
        'SOC 2',
        'ISO 27001',
        'EU AI act',
        'CCPA (california)',
        'Other'
      );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE OR REPLACE FUNCTION "${tenantHash}".check_only_one_organizational_project()
        RETURNS TRIGGER AS $$
        BEGIN
          -- If this row is being set to TRUE...
          IF NEW.is_organizational = TRUE THEN
            -- Count other rows (exclude the row we're updating/inserting)
            IF EXISTS (
              SELECT 1
              FROM "${tenantHash}".projects
              WHERE is_organizational = TRUE
                AND (TG_OP = 'INSERT' OR id <> NEW.id)
            ) THEN
              RAISE EXCEPTION 'Only one project can have is_organizational = TRUE';
            END IF;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;`,
      { transaction }
    );

    // Create approval workflows tables
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".approval_workflows (
        id SERIAL PRIMARY KEY,
        workflow_title VARCHAR(255) NOT NULL,
        entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('use_case', 'file')),
        description TEXT,
        created_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".approval_workflow_steps (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL REFERENCES "${tenantHash}".approval_workflows(id) ON DELETE CASCADE,
        step_number INTEGER NOT NULL,
        step_name VARCHAR(255) NOT NULL,
        description TEXT,
        requires_all_approvers BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(workflow_id, step_number)
      );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".approval_step_approvers (
        id SERIAL PRIMARY KEY,
        workflow_step_id INTEGER NOT NULL REFERENCES "${tenantHash}".approval_workflow_steps(id) ON DELETE CASCADE,
        approver_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(workflow_step_id, approver_id)
      );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".approval_requests (
        id SERIAL PRIMARY KEY,
        request_name VARCHAR(255) NOT NULL,
        workflow_id INTEGER NOT NULL REFERENCES "${tenantHash}".approval_workflows(id) ON DELETE CASCADE,
        entity_id INTEGER,
        entity_type VARCHAR(50) CHECK (entity_type IN ('use_case', 'file')),
        entity_data JSONB,
        status VARCHAR(50) NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Withdrawn')) DEFAULT 'Pending',
        requested_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        current_step INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".approval_request_steps (
        id SERIAL PRIMARY KEY,
        request_id INTEGER NOT NULL REFERENCES "${tenantHash}".approval_requests(id) ON DELETE CASCADE,
        step_number INTEGER NOT NULL,
        step_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL CHECK (status IN ('Pending', 'Completed', 'Rejected')) DEFAULT 'Pending',
        date_assigned TIMESTAMP NOT NULL DEFAULT NOW(),
        date_completed TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(request_id, step_number)
      );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".approval_request_step_approvals (
        id SERIAL PRIMARY KEY,
        request_step_id INTEGER NOT NULL REFERENCES "${tenantHash}".approval_request_steps(id) ON DELETE CASCADE,
        approver_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        approval_result VARCHAR(50) NOT NULL CHECK (approval_result IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
        comments TEXT,
        approved_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(request_step_id, approver_id)
      );`,
      { transaction }
    );

    await Promise.all(
      [
        `CREATE SEQUENCE IF NOT EXISTS "${tenantHash}".project_uc_id_seq;`,
        `CREATE TABLE IF NOT EXISTS "${tenantHash}".projects
      (
        id serial NOT NULL,
        uc_id character varying(255) UNIQUE,
        project_title character varying(255) NOT NULL,
        owner integer,
        start_date timestamp with time zone NOT NULL,
        ai_risk_classification enum_projects_ai_risk_classification,
        type_of_high_risk_role enum_projects_type_of_high_risk_role,
        goal character varying(255) NOT NULL,
        target_industry character varying(255),
        description character varying(255),
        geography integer NOT NULL,
        last_updated timestamp with time zone NOT NULL,
        last_updated_by integer,
        is_demo boolean NOT NULL DEFAULT false,
        is_organizational boolean NOT NULL DEFAULT false,
        status projects_status_enum NOT NULL DEFAULT 'Not started',
        approval_workflow_id INTEGER REFERENCES "${tenantHash}".approval_workflows(id) ON DELETE SET NULL,
        pending_frameworks JSONB DEFAULT NULL,
        enable_ai_data_insertion BOOLEAN DEFAULT FALSE,
        _source VARCHAR(100),
        created_at timestamp without time zone NOT NULL DEFAULT now(),
        CONSTRAINT projects_pkey PRIMARY KEY (id),
        CONSTRAINT projects_owner_fkey FOREIGN KEY (owner)
          REFERENCES public.users (id) MATCH SIMPLE
          ON UPDATE NO ACTION ON DELETE SET NULL,
        CONSTRAINT projects_last_updated_by_fkey FOREIGN KEY (last_updated_by)
          REFERENCES public.users (id) MATCH SIMPLE
          ON UPDATE NO ACTION ON DELETE SET NULL
      );`,
        `CREATE TRIGGER "trg_${tenantHash}_ensure_one_organizational_project"
        BEFORE INSERT OR UPDATE ON "${tenantHash}".projects
        FOR EACH ROW
          EXECUTE FUNCTION "${tenantHash}".check_only_one_organizational_project();`,
        `CREATE TABLE IF NOT EXISTS "${tenantHash}".vendors
      (
        id serial NOT NULL,
        order_no integer,
        vendor_name character varying(255) NOT NULL,
        vendor_provides text NOT NULL,
        assignee integer,
        website character varying(255) NOT NULL,
        vendor_contact_person character varying(255) NOT NULL,
        review_result character varying(255),
        review_status enum_vendors_review_status,
        reviewer integer,
        review_date timestamp with time zone,
        data_sensitivity "${tenantHash}".enum_vendors_data_sensitivity,
        business_criticality "${tenantHash}".enum_vendors_business_criticality,
        past_issues "${tenantHash}".enum_vendors_past_issues,
        regulatory_exposure "${tenantHash}".enum_vendors_regulatory_exposure,
        risk_score integer,
        is_demo boolean NOT NULL DEFAULT false,
        created_at timestamp without time zone NOT NULL DEFAULT now(),
        CONSTRAINT vendors_pkey PRIMARY KEY (id),
        CONSTRAINT vendors_assignee_fkey FOREIGN KEY (assignee)
          REFERENCES public.users (id) MATCH SIMPLE
          ON UPDATE NO ACTION ON DELETE SET NULL,
        CONSTRAINT vendors_reviewer_fkey FOREIGN KEY (reviewer)
          REFERENCES public.users (id) MATCH SIMPLE
          ON UPDATE NO ACTION ON DELETE SET NULL
      );`,
        `CREATE TABLE IF NOT EXISTS "${tenantHash}".trainingregistar
      (
        id serial NOT NULL,
        training_name character varying(255) NOT NULL,
        duration varchar(255),
        provider character varying(255),
        department character varying(255),
        status enum_trainingregistar_status,
        people integer,
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
        description character varying(255),
        is_demo boolean NOT NULL DEFAULT false,
        CONSTRAINT trainingregistar_pkey PRIMARY KEY (id)
      );`,
      ].map((query) => sequelize.query(query, { transaction }))
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".projects_members
    (
      user_id integer NOT NULL,
      project_id integer NOT NULL,
      is_demo boolean NOT NULL DEFAULT false,
      CONSTRAINT projects_members_pkey PRIMARY KEY (user_id, project_id),
      CONSTRAINT projects_members_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES "${tenantHash}".projects (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT projects_members_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`,
      { transaction }
    );

    // Create use_case_change_history table for tracking project/use case changes
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".use_case_change_history (
        id SERIAL PRIMARY KEY,
        use_case_id INTEGER NOT NULL REFERENCES "${tenantHash}".projects(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
        field_name VARCHAR(255),
        old_value TEXT,
        new_value TEXT,
        changed_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      { transaction }
    );

    // Create indexes for use_case_change_history
    await Promise.all(
      [
        `CREATE INDEX IF NOT EXISTS idx_use_case_change_history_use_case_id ON "${tenantHash}".use_case_change_history(use_case_id);`,
        `CREATE INDEX IF NOT EXISTS idx_use_case_change_history_changed_at ON "${tenantHash}".use_case_change_history(changed_at DESC);`,
        `CREATE INDEX IF NOT EXISTS idx_use_case_change_history_use_case_changed ON "${tenantHash}".use_case_change_history(use_case_id, changed_at DESC);`,
      ].map((query) => sequelize.query(query, { transaction }))
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".event_logs (
        id SERIAL PRIMARY KEY,
        event_type public.enum_event_logs_event_type NOT NULL,
        description TEXT,
        user_id INTEGER,
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_event_logs_user FOREIGN KEY (user_id)
          REFERENCES public.users (id)
          ON UPDATE CASCADE
          ON DELETE SET NULL
      );`, { transaction });

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".vendors_projects
    (
      vendor_id integer NOT NULL,
      project_id integer NOT NULL,
      is_demo boolean NOT NULL DEFAULT false,
      CONSTRAINT vendors_projects_pkey PRIMARY KEY (vendor_id, project_id),
      CONSTRAINT vendors_projects_vendor_id_fkey FOREIGN KEY (vendor_id)
        REFERENCES "${tenantHash}".vendors (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT vendors_projects_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES "${tenantHash}".projects (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".risks
    (
      id serial NOT NULL,
      risk_name character varying(255) NOT NULL,
      risk_owner integer,
      ai_lifecycle_phase enum_projectrisks_ai_lifecycle_phase NOT NULL,
      risk_description text NOT NULL,
      risk_category enum_projectrisks_risk_category[] NOT NULL,
      impact character varying(255) NOT NULL,
      assessment_mapping text NOT NULL,
      controls_mapping text NOT NULL,
      likelihood enum_projectrisks_likelihood NOT NULL,
      severity enum_projectrisks_severity NOT NULL,
      risk_level_autocalculated enum_projectrisks_risk_level_autocalculated NOT NULL,
      review_notes text,
      mitigation_status enum_projectrisks_mitigation_status NOT NULL,
      current_risk_level enum_projectrisks_current_risk_level NOT NULL,
      deadline timestamp with time zone NOT NULL,
      mitigation_plan text NOT NULL,
      implementation_strategy text NOT NULL,
      mitigation_evidence_document character varying(255) NOT NULL,
      likelihood_mitigation enum_projectrisks_likelihood_mitigation NOT NULL,
      risk_severity enum_projectrisks_risk_severity NOT NULL,
      final_risk_level character varying(255) NOT NULL,
      risk_approval integer,
      approval_status character varying(255) NOT NULL,
      date_of_assessment timestamp with time zone NOT NULL,
      is_demo boolean NOT NULL DEFAULT false,
      created_at timestamp without time zone NOT NULL DEFAULT now(),
      updated_at timestamp without time zone NOT NULL DEFAULT now(),
      is_deleted boolean NOT NULL DEFAULT false,
      deleted_at timestamp without time zone,
      CONSTRAINT projectrisks_pkey PRIMARY KEY (id),
      CONSTRAINT projectrisks_risk_owner_fkey FOREIGN KEY (risk_owner)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT projectrisks_risk_approval_fkey FOREIGN KEY (risk_approval)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".projects_risks (
      risk_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      CONSTRAINT projects_risks_pkey PRIMARY KEY (risk_id, project_id),
      CONSTRAINT projects_risks_risk_id_fkey FOREIGN KEY (risk_id) REFERENCES "${tenantHash}".risks(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT projects_risks_project_id_fkey FOREIGN KEY (project_id) REFERENCES "${tenantHash}".projects(id) ON DELETE CASCADE ON UPDATE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".frameworks_risks (
      risk_id INTEGER NOT NULL,
      framework_id INTEGER NOT NULL,
        CONSTRAINT frameworks_risks_pkey PRIMARY KEY (risk_id, framework_id),
        CONSTRAINT frameworks_risks_risk_id_fkey FOREIGN KEY (risk_id) REFERENCES "${tenantHash}".risks(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT frameworks_risks_framework_id_fkey FOREIGN KEY (framework_id) REFERENCES public.frameworks(id) ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".files
    (
      id serial NOT NULL,
      filename character varying(255) NOT NULL,
      content bytea NOT NULL,
      project_id integer,
      uploaded_by integer,
      uploaded_time timestamp with time zone NOT NULL,
      is_demo boolean NOT NULL DEFAULT false,
      source enum_files_source NOT NULL,
      type character varying(255) NOT NULL,
      size bigint,
      file_path character varying(500),
      org_id integer,
      model_id integer,
      tags jsonb DEFAULT '[]'::jsonb,
      review_status character varying(20) DEFAULT 'draft',
      version character varying(20) DEFAULT '1.0',
      expiry_date date,
      last_modified_by integer,
      updated_at timestamp with time zone DEFAULT now(),
      description text,
      file_group_id UUID DEFAULT gen_random_uuid(),
      approval_workflow_id integer,
      -- Optional plain-text content for search/snippets
      content_text text,
      -- tsvector column for PostgreSQL full-text search
      content_search tsvector,
      CONSTRAINT files_pkey PRIMARY KEY (id),
      CONSTRAINT files_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES "${tenantHash}".projects (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT files_uploaded_by_fkey FOREIGN KEY (uploaded_by)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT files_org_id_fkey FOREIGN KEY (org_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT files_last_modified_by_fkey FOREIGN KEY (last_modified_by)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT files_approval_workflow_id_fkey FOREIGN KEY (approval_workflow_id)
        REFERENCES "${tenantHash}".approval_workflows (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT chk_review_status CHECK (review_status IN ('draft', 'pending_review', 'approved', 'rejected', 'expired', 'superseded')),
      CONSTRAINT chk_version_format CHECK (version ~ '^[0-9]+\\.[0-9]+(\\.[0-9]+)?$')
    );`,
      { transaction }
    );

    // Indexes for files table to optimize org-level file queries
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_files_org_id ON "${tenantHash}".files(org_id);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_files_uploaded_time ON "${tenantHash}".files(uploaded_time DESC);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_files_review_status ON "${tenantHash}".files(review_status);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_files_expiry_date ON "${tenantHash}".files(expiry_date);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_files_tags ON "${tenantHash}".files USING GIN(tags);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_files_updated_at ON "${tenantHash}".files(updated_at DESC);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_files_file_group_id ON "${tenantHash}".files(file_group_id);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_files_approval_workflow_id ON "${tenantHash}".files(approval_workflow_id);`,
      { transaction }
    );

    // Full-text search index on extracted content
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_files_content_search ON "${tenantHash}".files USING GIN(content_search);`,
      { transaction }
    );

    // File entity links table for flexible file-to-entity linking
    // Works with any framework: EU AI Act, NIST AI, ISO 27001, ISO 42001, plugins
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".file_entity_links (
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
      );`,
      { transaction }
    );

    // Indexes for file_entity_links
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_file_entity_links_file_id ON "${tenantHash}".file_entity_links(file_id);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_file_entity_links_entity ON "${tenantHash}".file_entity_links(framework_type, entity_type, entity_id);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_file_entity_links_project ON "${tenantHash}".file_entity_links(project_id);`,
      { transaction }
    );

    // File change history table for tracking file modifications
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".file_change_history (
        id SERIAL PRIMARY KEY,
        file_id INTEGER NOT NULL REFERENCES "${tenantHash}".files(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
        field_name VARCHAR(255),
        old_value TEXT,
        new_value TEXT,
        changed_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      { transaction }
    );

    // Indexes for file_change_history
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_file_change_history_file_id ON "${tenantHash}".file_change_history(file_id);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_file_change_history_changed_at ON "${tenantHash}".file_change_history(changed_at DESC);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_file_change_history_file_changed ON "${tenantHash}".file_change_history(file_id, changed_at DESC);`,
      { transaction }
    );

    // Virtual folders table for hierarchical folder structure
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".virtual_folders (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        parent_id INTEGER NULL REFERENCES "${tenantHash}".virtual_folders(id) ON DELETE CASCADE,
        color VARCHAR(7) NULL,
        icon VARCHAR(50) NULL,
        is_system BOOLEAN DEFAULT FALSE,
        created_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_folder_name_per_parent UNIQUE (parent_id, name),
        CONSTRAINT no_circular_reference CHECK (id != parent_id)
      );`,
      { transaction }
    );

    // File folder mappings junction table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".file_folder_mappings (
        id SERIAL PRIMARY KEY,
        file_id INTEGER NOT NULL,
        folder_id INTEGER NOT NULL REFERENCES "${tenantHash}".virtual_folders(id) ON DELETE CASCADE,
        assigned_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_file_folder UNIQUE (file_id, folder_id)
      );`,
      { transaction }
    );

    // Indexes for virtual_folders table
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_virtual_folders_parent_id ON "${tenantHash}".virtual_folders(parent_id);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_virtual_folders_created_by ON "${tenantHash}".virtual_folders(created_by);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_virtual_folders_name ON "${tenantHash}".virtual_folders(name);`,
      { transaction }
    );

    // Indexes for file_folder_mappings table
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_file_folder_mappings_file_id ON "${tenantHash}".file_folder_mappings(file_id);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_file_folder_mappings_folder_id ON "${tenantHash}".file_folder_mappings(folder_id);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_file_folder_mappings_assigned_by ON "${tenantHash}".file_folder_mappings(assigned_by);`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".projects_frameworks
    (
      id serial NOT NULL,
      project_id integer NOT NULL,
      framework_id integer NOT NULL,
      is_demo boolean DEFAULT false,
      CONSTRAINT projects_frameworks_pkey PRIMARY KEY (project_id, framework_id),
      CONSTRAINT projects_frameworks_id_key UNIQUE (id),
      CONSTRAINT projects_frameworks_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES "${tenantHash}".projects (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT projects_frameworks_framework_id_fkey FOREIGN KEY (framework_id)
        REFERENCES public.frameworks (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".assessments
    (
      id serial NOT NULL,
      project_id integer,
      is_demo boolean NOT NULL DEFAULT false,
      created_at timestamp without time zone NOT NULL DEFAULT now(),
      projects_frameworks_id integer NOT NULL,
      CONSTRAINT assessments_pkey PRIMARY KEY (id),
      CONSTRAINT assessments_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES "${tenantHash}".projects (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT assessments_projects_frameworks_id_fkey FOREIGN KEY (projects_frameworks_id)
        REFERENCES "${tenantHash}".projects_frameworks (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".projectscopes
    (
      id serial NOT NULL,
      assessment_id integer NOT NULL,
      describe_ai_environment text NOT NULL,
      is_new_ai_technology boolean NOT NULL,
      uses_personal_data boolean NOT NULL,
      project_scope_documents character varying(255) NOT NULL,
      technology_type character varying(255) NOT NULL,
      has_ongoing_monitoring boolean NOT NULL,
      unintended_outcomes text NOT NULL,
      technology_documentation character varying(255) NOT NULL,
      is_demo boolean NOT NULL DEFAULT false,
      created_at timestamp without time zone NOT NULL DEFAULT now(),
      CONSTRAINT projectscopes_pkey PRIMARY KEY (id),
      CONSTRAINT projectscopes_assessment_id_fkey FOREIGN KEY (assessment_id)
        REFERENCES "${tenantHash}".assessments (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".vendorrisks
    (
      id serial NOT NULL,
      vendor_id integer NOT NULL,
      order_no integer,
      risk_description text NOT NULL,
      impact_description text NOT NULL,
      likelihood enum_vendorrisks_likelihood NOT NULL,
      risk_severity enum_vendorrisks_risk_severity NOT NULL,
      action_plan text NOT NULL,
      action_owner integer,
      risk_level character varying(255) NOT NULL,
      is_demo boolean NOT NULL DEFAULT false,
      created_at timestamp without time zone NOT NULL DEFAULT now(),
      updated_at timestamp without time zone NOT NULL DEFAULT now(),
      is_deleted boolean NOT NULL DEFAULT false,
      deleted_at timestamp without time zone,
      CONSTRAINT vendorrisks_pkey PRIMARY KEY (id),
      CONSTRAINT vendorrisks_vendor_id_fkey FOREIGN KEY (vendor_id)
        REFERENCES "${tenantHash}".vendors (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT vendorrisks_action_owner_fkey FOREIGN KEY (action_owner)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".controls_eu
    (
      id serial NOT NULL,
      status enum_controls_status,
      approver integer,
      risk_review enum_controls_risk_review,
      owner integer,
      reviewer integer,
      due_date timestamp with time zone,
      implementation_details text,
      is_demo boolean NOT NULL DEFAULT false,
      control_meta_id integer,
      projects_frameworks_id integer,
      created_at timestamp without time zone NOT NULL DEFAULT now(),
      CONSTRAINT controls_eu_pkey PRIMARY KEY (id),
      CONSTRAINT controls_eu_approver_fkey FOREIGN KEY (approver)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT controls_eu_owner_fkey FOREIGN KEY (owner)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT controls_eu_reviewer_fkey FOREIGN KEY (reviewer)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT controls_eu_control_meta_id_fkey FOREIGN KEY (control_meta_id)
        REFERENCES public.controls_struct_eu (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT controls_eu_projects_frameworks_id_fkey FOREIGN KEY (projects_frameworks_id)
        REFERENCES "${tenantHash}".projects_frameworks (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".subcontrols_eu
    (
      id serial NOT NULL,
      status enum_subcontrols_status,
      approver integer,
      risk_review enum_subcontrols_risk_review,
      owner integer,
      reviewer integer,
      due_date timestamp with time zone,
      implementation_details text,
      control_id integer NOT NULL,
      subcontrol_meta_id integer,
      is_demo boolean NOT NULL DEFAULT false,
      evidence_files jsonb,
      feedback_files jsonb,
      evidence_description text,
      feedback_description text,
      created_at timestamp without time zone NOT NULL DEFAULT now(),
      CONSTRAINT subcontrols_eu_pkey PRIMARY KEY (id),
      CONSTRAINT subcontrols_eu_approver_fkey FOREIGN KEY (approver)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT subcontrols_eu_owner_fkey FOREIGN KEY (owner)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT subcontrols_eu_reviewer_fkey FOREIGN KEY (reviewer)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT subcontrols_eu_control_id_fkey FOREIGN KEY (control_id)
        REFERENCES "${tenantHash}".controls_eu (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT subcontrols_eu_subcontrol_meta_id_fkey FOREIGN KEY (subcontrol_meta_id)
        REFERENCES public.subcontrols_struct_eu (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".answers_eu
    (
      id serial NOT NULL,
      assessment_id integer NOT NULL,
      question_id integer NOT NULL,
      answer text,
      evidence_files jsonb,
      dropdown_options text[],
      status enum_status_questions DEFAULT 'Not started'::enum_status_questions,
      created_at timestamp without time zone DEFAULT now(),
      is_demo boolean NOT NULL DEFAULT false,
      CONSTRAINT answers_eu_pkey PRIMARY KEY (id),
      CONSTRAINT answers_eu_assessment_id_fkey FOREIGN KEY (assessment_id)
        REFERENCES "${tenantHash}".assessments (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT answers_eu_question_id_fkey FOREIGN KEY (question_id)
        REFERENCES public.questions_struct_eu (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".subclauses_iso
    (
      id serial NOT NULL,
      implementation_description text,
      evidence_links jsonb,
      status enum_subclauses_iso_status DEFAULT 'Not started'::enum_subclauses_iso_status,
      owner integer,
      reviewer integer,
      approver integer,
      due_date date,
      auditor_feedback text,
      subclause_meta_id integer,
      projects_frameworks_id integer,
      created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
      is_demo boolean DEFAULT false,
      CONSTRAINT subclauses_iso_pkey PRIMARY KEY (id),
      CONSTRAINT subclauses_iso_owner_fkey FOREIGN KEY (owner)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT subclauses_iso_reviewer_fkey FOREIGN KEY (reviewer)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT subclauses_iso_approver_fkey FOREIGN KEY (approver)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT subclauses_iso_subclause_meta_id_fkey FOREIGN KEY (subclause_meta_id)
        REFERENCES public.subclauses_struct_iso (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT subclauses_iso_projects_frameworks_id_fkey FOREIGN KEY (projects_frameworks_id)
        REFERENCES "${tenantHash}".projects_frameworks (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".controls_eu__risks (
      control_id INTEGER NOT NULL,
      projects_risks_id INTEGER NOT NULL,
      PRIMARY KEY (control_id, projects_risks_id),
      FOREIGN KEY (control_id) REFERENCES "${tenantHash}".controls_eu(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".risks(id) ON DELETE CASCADE ON UPDATE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `COMMENT ON TABLE "${tenantHash}".controls_eu__risks IS
      'DEPRECATED as of Nov 2025: Control-level risks removed. This table is no longer used.
        Risk associations are now managed at subcontrol level only.
        Existing data preserved for potential future migration or historical reference.';`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".answers_eu__risks (
      answer_id INTEGER NOT NULL,
      projects_risks_id INTEGER NOT NULL,
      PRIMARY KEY (answer_id, projects_risks_id),
      FOREIGN KEY (answer_id) REFERENCES "${tenantHash}".answers_eu(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".risks(id) ON DELETE CASCADE ON UPDATE CASCADE
      );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".subcontrols_eu__risks (
      subcontrol_id INTEGER NOT NULL,
      projects_risks_id INTEGER NOT NULL,
      PRIMARY KEY (subcontrol_id, projects_risks_id),
      FOREIGN KEY (subcontrol_id) REFERENCES "${tenantHash}".subcontrols_eu(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".risks(id) ON DELETE CASCADE ON UPDATE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".annexcategories_iso
    (
      id serial NOT NULL,
      is_applicable boolean DEFAULT false,
      justification_for_exclusion text,
      implementation_description text,
      evidence_links jsonb,
      status enum_annexcategories_iso_status DEFAULT 'Not started'::enum_annexcategories_iso_status,
      owner integer,
      reviewer integer,
      approver integer,
      due_date date,
      auditor_feedback text,
      projects_frameworks_id integer,
      annexcategory_meta_id integer,
      created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
      is_demo boolean DEFAULT false,
      CONSTRAINT annexcategories_iso_pkey PRIMARY KEY (id),
      CONSTRAINT annexcategories_iso_owner_fkey FOREIGN KEY (owner)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT annexcategories_iso_reviewer_fkey FOREIGN KEY (reviewer)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT annexcategories_iso_approver_fkey FOREIGN KEY (approver)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT annexcategories_iso_projects_frameworks_id_fkey FOREIGN KEY (projects_frameworks_id)
        REFERENCES "${tenantHash}".projects_frameworks (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT annexcategories_iso_annexcategory_meta_id_fkey FOREIGN KEY (annexcategory_meta_id)
        REFERENCES public.annexcategories_struct_iso (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".annexcategories_iso__risks
    (
      annexcategory_id integer,
      projects_risks_id integer NOT NULL,
      CONSTRAINT annexcategories_iso__risks_pkey PRIMARY KEY (projects_risks_id),
      CONSTRAINT annexcategories_iso__risks_annexcategory_id_fkey FOREIGN KEY (annexcategory_id)
        REFERENCES "${tenantHash}".annexcategories_iso (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT annexcategories_iso__risks_projects_risks_id_fkey FOREIGN KEY (projects_risks_id)
        REFERENCES "${tenantHash}".risks (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".subclauses_iso__risks (
      subclause_id INTEGER NOT NULL,
      projects_risks_id INTEGER NOT NULL,
      PRIMARY KEY (subclause_id, projects_risks_id),
      FOREIGN KEY (subclause_id) REFERENCES "${tenantHash}".subclauses_iso(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".risks(id) ON DELETE CASCADE ON UPDATE CASCADE
    );`,
      { transaction }
    );

    await Promise.all(
      [
        `CREATE TABLE "${tenantHash}".ai_trust_center (
        id INTEGER GENERATED ALWAYS AS (1) STORED UNIQUE PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        logo INTEGER REFERENCES "${tenantHash}".files(id) ON DELETE CASCADE,
        header_color VARCHAR(7) NOT NULL DEFAULT '#000000',
        visible BOOLEAN NOT NULL DEFAULT FALSE,
        intro_visible BOOLEAN NOT NULL DEFAULT TRUE,
        compliance_badges_visible BOOLEAN NOT NULL DEFAULT TRUE,
        company_description_visible BOOLEAN NOT NULL DEFAULT TRUE,
        terms_and_contact_visible BOOLEAN NOT NULL DEFAULT TRUE,
        resources_visible BOOLEAN NOT NULL DEFAULT TRUE,
        subprocessor_visible BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );`,
        `CREATE TABLE "${tenantHash}".ai_trust_center_intro (
        id INTEGER GENERATED ALWAYS AS (1) STORED UNIQUE PRIMARY KEY,
        purpose_visible BOOLEAN NOT NULL DEFAULT TRUE,
        purpose_text TEXT NOT NULL,
        our_statement_visible BOOLEAN NOT NULL DEFAULT TRUE,
        our_statement_text TEXT NOT NULL,
        our_mission_visible BOOLEAN NOT NULL DEFAULT TRUE,
        our_mission_text TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );`,
        `CREATE TABLE "${tenantHash}".ai_trust_center_compliance_badges (
        id INTEGER GENERATED ALWAYS AS (1) STORED UNIQUE PRIMARY KEY,
        SOC2_Type_I BOOLEAN NOT NULL DEFAULT TRUE,
        SOC2_Type_II BOOLEAN NOT NULL DEFAULT TRUE,
        ISO_27001 BOOLEAN NOT NULL DEFAULT TRUE,
        ISO_42001 BOOLEAN NOT NULL DEFAULT TRUE,
        CCPA BOOLEAN NOT NULL DEFAULT TRUE,
        GDPR BOOLEAN NOT NULL DEFAULT TRUE,
        HIPAA BOOLEAN NOT NULL DEFAULT TRUE,
        EU_AI_Act BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );`,
        `CREATE TABLE "${tenantHash}".ai_trust_center_company_description (
        id INTEGER GENERATED ALWAYS AS (1) STORED UNIQUE PRIMARY KEY,
        background_visible BOOLEAN NOT NULL DEFAULT TRUE,
        background_text TEXT NOT NULL,
        core_benefits_visible BOOLEAN NOT NULL DEFAULT TRUE,
        core_benefits_text TEXT NOT NULL,
        compliance_doc_visible BOOLEAN NOT NULL DEFAULT TRUE,
        compliance_doc_text TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );`,
        `CREATE TABLE "${tenantHash}".ai_trust_center_terms_and_contact (
        id INTEGER GENERATED ALWAYS AS (1) STORED UNIQUE PRIMARY KEY,
        terms_visible BOOLEAN NOT NULL DEFAULT TRUE,
        terms_text TEXT NOT NULL,
        privacy_visible BOOLEAN NOT NULL DEFAULT TRUE,
        privacy_text TEXT NOT NULL,
        email_visible BOOLEAN NOT NULL DEFAULT TRUE,
        email_text TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );`,
        `CREATE TABLE "${tenantHash}".ai_trust_center_resources (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        visible BOOLEAN NOT NULL DEFAULT TRUE,
        file_id INTEGER NOT NULL REFERENCES "${tenantHash}".files(id) ON DELETE CASCADE,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );`,
        `CREATE TABLE "${tenantHash}".ai_trust_center_subprocessor (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        purpose TEXT NOT NULL,
        location VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );`,
      ].map((query) => sequelize.query(query, { transaction }))
    );

    await Promise.all(
      [
        `INSERT INTO "${tenantHash}".ai_trust_center (title) VALUES ('');`,
        `INSERT INTO "${tenantHash}".ai_trust_center_intro (purpose_text, our_statement_text, our_mission_text) VALUES ('', '', '');`,
        `INSERT INTO "${tenantHash}".ai_trust_center_company_description (background_text, core_benefits_text, compliance_doc_text) VALUES ('', '', '');`,
        `INSERT INTO "${tenantHash}".ai_trust_center_compliance_badges DEFAULT VALUES;`,
        `INSERT INTO "${tenantHash}".ai_trust_center_terms_and_contact (terms_text, privacy_text, email_text) VALUES ('', '', '');`,
      ].map((query) => sequelize.query(query, { transaction }))
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".subclauses_iso27001(
        id SERIAL PRIMARY KEY,
        implementation_description TEXT,
        evidence_links JSONB,
        status enum_subclauses_iso_status DEFAULT 'Not started',
        owner INT,
        reviewer INT,
        approver INT,
        due_date DATE,
        auditor_feedback TEXT,
        subclause_meta_id INT,
        projects_frameworks_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_demo BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (subclause_meta_id) REFERENCES public.subclauses_struct_iso27001(id) ON DELETE CASCADE,
        FOREIGN KEY (projects_frameworks_id) REFERENCES "${tenantHash}".projects_frameworks(id) ON DELETE CASCADE,
        FOREIGN KEY (owner) REFERENCES public.users(id) ON DELETE SET NULL,
        FOREIGN KEY (reviewer) REFERENCES public.users(id) ON DELETE SET NULL,
        FOREIGN KEY (approver) REFERENCES public.users(id) ON DELETE SET NULL
      );`,
      { transaction }
    );
    await sequelize.query(
      `CREATE TABLE "${tenantHash}".subclauses_iso27001__risks(
        subclause_id INT,
        projects_risks_id INT PRIMARY KEY,
        FOREIGN KEY (subclause_id) REFERENCES "${tenantHash}".subclauses_iso27001(id) ON DELETE CASCADE,
        FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".risks(id) ON DELETE CASCADE
      );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".annexcontrols_iso27001(
        id SERIAL PRIMARY KEY,
        implementation_description TEXT,
        evidence_links JSONB,
        status enum_annexcategories_iso_status DEFAULT 'Not started',
        owner INT,
        reviewer INT,
        approver INT,
        due_date DATE,
        auditor_feedback TEXT,
        projects_frameworks_id INT,
        annexcontrol_meta_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_demo BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (annexcontrol_meta_id) REFERENCES public.annexcontrols_struct_iso27001(id) ON DELETE CASCADE,
        FOREIGN KEY (projects_frameworks_id) REFERENCES "${tenantHash}".projects_frameworks(id) ON DELETE CASCADE,
        FOREIGN KEY (owner) REFERENCES public.users(id) ON DELETE SET NULL,
        FOREIGN KEY (reviewer) REFERENCES public.users(id) ON DELETE SET NULL,
        FOREIGN KEY (approver) REFERENCES public.users(id) ON DELETE SET NULL
      );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".annexcontrols_iso27001__risks(
        annexcontrol_id INT,
        projects_risks_id INT PRIMARY KEY,
        FOREIGN KEY (annexcontrol_id) REFERENCES "${tenantHash}".annexcontrols_iso27001(id) ON DELETE CASCADE,
        FOREIGN KEY (projects_risks_id) REFERENCES "${tenantHash}".risks(id) ON DELETE CASCADE
      );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".policy_manager (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR(255) NOT NULL,
        "content_html" TEXT DEFAULT '',
        "status" VARCHAR(50) DEFAULT 'Draft',
        "tags" TEXT[] NOT NULL,
        "next_review_date" TIMESTAMP NOT NULL,
        "author_id" INTEGER NOT NULL NOT NULL,
        "last_updated_by" INTEGER NOT NULL,
        "last_updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "review_status" VARCHAR(50) DEFAULT NULL,
        "review_comment" TEXT DEFAULT NULL,
        "reviewed_by" INTEGER DEFAULT NULL,
        "reviewed_at" TIMESTAMP DEFAULT NULL,
        is_demo boolean NOT NULL DEFAULT false,
        FOREIGN KEY ("author_id") REFERENCES public.users(id) ON DELETE SET NULL,
        FOREIGN KEY ("last_updated_by") REFERENCES public.users(id) ON DELETE SET NULL,
        FOREIGN KEY ("reviewed_by") REFERENCES public.users(id) ON DELETE SET NULL
      );`,
      { transaction }
    );

    // Create policy_manager__assigned_reviewer_ids mapping table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".policy_manager__assigned_reviewer_ids (
        policy_manager_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        PRIMARY KEY (policy_manager_id, user_id),
        FOREIGN KEY (policy_manager_id)
          REFERENCES "${tenantHash}".policy_manager(id)
          ON DELETE CASCADE,
        FOREIGN KEY (user_id)
          REFERENCES public.users(id)
          ON DELETE CASCADE
      );`,
      { transaction }
    );

    // Create indexes for policy reviewer mapping table
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_policy_reviewer_policy_id
       ON "${tenantHash}".policy_manager__assigned_reviewer_ids(policy_manager_id);`,
      { transaction }
    );

    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_policy_reviewer_user_id
       ON "${tenantHash}".policy_manager__assigned_reviewer_ids(user_id);`,
      { transaction }
    );

    // Create policy_change_history table for tracking policy changes
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".policy_change_history (
        id SERIAL PRIMARY KEY,
        policy_id INTEGER NOT NULL REFERENCES "${tenantHash}".policy_manager(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
        field_name VARCHAR(255),
        old_value TEXT,
        new_value TEXT,
        changed_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      { transaction }
    );

    // Create indexes for policy_change_history
    await Promise.all(
      [
        `CREATE INDEX IF NOT EXISTS idx_policy_change_history_policy_id ON "${tenantHash}".policy_change_history(policy_id);`,
        `CREATE INDEX IF NOT EXISTS idx_policy_change_history_changed_at ON "${tenantHash}".policy_change_history(changed_at DESC);`,
        `CREATE INDEX IF NOT EXISTS idx_policy_change_history_policy_changed ON "${tenantHash}".policy_change_history(policy_id, changed_at DESC);`,
      ].map((query) => sequelize.query(query, { transaction }))
    );

    await sequelize.query(
      `
      CREATE TABLE "${tenantHash}".model_inventories (
        id SERIAL PRIMARY KEY,
        provider_model VARCHAR(255) NOT NULL,
        version VARCHAR(255) NOT NULL,
        approver INTEGER,
        capabilities TEXT NOT NULL,
        security_assessment BOOLEAN NOT NULL DEFAULT false,
        status enum_model_inventories_status NOT NULL DEFAULT 'Pending'::enum_model_inventories_status,
        status_date TIMESTAMP WITH TIME ZONE NOT NULL,
        reference_link VARCHAR(255) NOT NULL,
        biases VARCHAR(255) NOT NULL,
        limitations VARCHAR(255) NOT NULL,
        hosting_provider VARCHAR(255) NOT NULL,
        security_assessment_data JSONB DEFAULT '[]'::JSONB,
        is_demo BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
        provider VARCHAR(255) NOT NULL,
        model VARCHAR(255) NOT NULL,
        CONSTRAINT fk_model_inventories_approver FOREIGN KEY (approver)
          REFERENCES public.users (id) MATCH SIMPLE
          ON UPDATE NO ACTION ON DELETE SET NULL
      );`,
      { transaction }
    );

    // Create model_inventory_change_history table for tracking changes
    await sequelize.query(
      `
      CREATE TABLE IF NOT EXISTS "${tenantHash}".model_inventory_change_history (
        id SERIAL PRIMARY KEY,
        model_inventory_id INTEGER NOT NULL REFERENCES "${tenantHash}".model_inventories(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
        field_name VARCHAR(255),
        old_value TEXT,
        new_value TEXT,
        changed_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      { transaction }
    );

    // Create indexes for model_inventory_change_history
    await Promise.all(
      [
        `CREATE INDEX IF NOT EXISTS idx_${tenantHash}_model_inventory_change_history_model_id ON "${tenantHash}".model_inventory_change_history(model_inventory_id);`,
        `CREATE INDEX IF NOT EXISTS idx_${tenantHash}_model_inventory_change_history_changed_at ON "${tenantHash}".model_inventory_change_history(changed_at DESC);`,
      ].map((query) => sequelize.query(query, { transaction }))
    );

    await sequelize.query(
      `
      CREATE TABLE "${tenantHash}".model_risks (
        id SERIAL PRIMARY KEY,
        risk_name VARCHAR(255) NOT NULL,
        risk_category enum_model_risks_risk_category NOT NULL,
        risk_level enum_model_risks_risk_level NOT NULL,
        status enum_model_risks_status NOT NULL DEFAULT 'Open',
        owner INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        target_date TIMESTAMP NOT NULL,
        description TEXT,
        mitigation_plan TEXT,
        impact TEXT,
        likelihood VARCHAR(255),
        key_metrics TEXT,
        current_values TEXT,
        threshold VARCHAR(255),
        model_id INTEGER REFERENCES "${tenantHash}".model_inventories(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_deleted BOOLEAN NOT NULL DEFAULT false,
        deleted_at TIMESTAMP,
        is_demo BOOLEAN NOT NULL DEFAULT false
      );`,
      { transaction }
    );

    // Create dataset ENUM types if they don't exist
    await sequelize.query(
      `
      DO $$
        BEGIN
          CREATE TYPE enum_dataset_status AS ENUM ('Draft', 'Active', 'Deprecated', 'Archived');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
    `,
      { transaction }
    );

    await sequelize.query(
      `
      DO $$
        BEGIN
          CREATE TYPE enum_dataset_type AS ENUM ('Training', 'Validation', 'Testing', 'Production', 'Reference');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
    `,
      { transaction }
    );

    await sequelize.query(
      `
      DO $$
        BEGIN
          CREATE TYPE enum_data_classification AS ENUM ('Public', 'Internal', 'Confidential', 'Restricted');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
    `,
      { transaction }
    );

    await sequelize.query(
      `
      DO $$
        BEGIN
          CREATE TYPE enum_dataset_change_action AS ENUM ('created', 'updated', 'deleted');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
    `,
      { transaction }
    );

    // Create datasets table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".datasets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        version VARCHAR(50) NOT NULL,
        owner VARCHAR(255) NOT NULL,
        type enum_dataset_type NOT NULL,
        function TEXT NOT NULL,
        source VARCHAR(255) NOT NULL,
        license VARCHAR(255) NULL,
        format VARCHAR(100) NULL,
        classification enum_data_classification NOT NULL,
        contains_pii BOOLEAN NOT NULL DEFAULT false,
        pii_types TEXT NULL,
        status enum_dataset_status NOT NULL DEFAULT 'Draft',
        status_date TIMESTAMP NOT NULL,
        known_biases TEXT NULL,
        bias_mitigation TEXT NULL,
        collection_method TEXT NULL,
        preprocessing_steps TEXT NULL,
        documentation_data JSONB NOT NULL DEFAULT '[]',
        is_demo BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      { transaction }
    );

    // Indexes for datasets table
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_datasets_name ON "${tenantHash}".datasets(name);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_datasets_status ON "${tenantHash}".datasets(status);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_datasets_type ON "${tenantHash}".datasets(type);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_datasets_classification ON "${tenantHash}".datasets(classification);`,
      { transaction }
    );

    // Create dataset_model_inventories junction table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".dataset_model_inventories (
        id SERIAL PRIMARY KEY,
        dataset_id INTEGER NOT NULL,
        model_inventory_id INTEGER NOT NULL,
        relationship_type VARCHAR(50) NOT NULL DEFAULT 'trained_on',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_dataset_model_inv_dataset FOREIGN KEY (dataset_id)
          REFERENCES "${tenantHash}".datasets(id) ON DELETE CASCADE,
        CONSTRAINT fk_dataset_model_inv_model FOREIGN KEY (model_inventory_id)
          REFERENCES "${tenantHash}".model_inventories(id) ON DELETE CASCADE,
        CONSTRAINT uq_dataset_model_inventory UNIQUE (dataset_id, model_inventory_id)
      );`,
      { transaction }
    );

    // Indexes for dataset_model_inventories
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_dataset_model_inv_dataset ON "${tenantHash}".dataset_model_inventories(dataset_id);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_dataset_model_inv_model ON "${tenantHash}".dataset_model_inventories(model_inventory_id);`,
      { transaction }
    );

    // Create dataset_projects junction table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".dataset_projects (
        id SERIAL PRIMARY KEY,
        dataset_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_dataset_project_dataset FOREIGN KEY (dataset_id)
          REFERENCES "${tenantHash}".datasets(id) ON DELETE CASCADE,
        CONSTRAINT fk_dataset_project_project FOREIGN KEY (project_id)
          REFERENCES "${tenantHash}".projects(id) ON DELETE CASCADE,
        CONSTRAINT uq_dataset_project UNIQUE (dataset_id, project_id)
      );`,
      { transaction }
    );

    // Indexes for dataset_projects
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_dataset_project_dataset ON "${tenantHash}".dataset_projects(dataset_id);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_dataset_project_project ON "${tenantHash}".dataset_projects(project_id);`,
      { transaction }
    );

    // Create dataset_change_histories table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".dataset_change_histories (
        id SERIAL PRIMARY KEY,
        dataset_id INTEGER NOT NULL,
        action enum_dataset_change_action NOT NULL,
        field_name VARCHAR(100) NULL,
        old_value TEXT NULL,
        new_value TEXT NULL,
        changed_by_user_id INTEGER NULL,
        changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_dataset_change_history_dataset FOREIGN KEY (dataset_id)
          REFERENCES "${tenantHash}".datasets(id) ON DELETE CASCADE,
        CONSTRAINT fk_dataset_change_history_user FOREIGN KEY (changed_by_user_id)
          REFERENCES public.users(id) ON DELETE SET NULL
      );`,
      { transaction }
    );

    // Indexes for dataset_change_histories
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_dataset_change_history_dataset_id ON "${tenantHash}".dataset_change_histories(dataset_id);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_dataset_change_history_changed_at ON "${tenantHash}".dataset_change_histories(changed_at);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_dataset_change_history_composite ON "${tenantHash}".dataset_change_histories(dataset_id, changed_at DESC);`,
      { transaction }
    );

    // Create task ENUM types if they don't exist
    await sequelize.query(
      `
      DO $$ 
        BEGIN
          CREATE TYPE enum_tasks_priority AS ENUM ('Low', 'Medium', 'High');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
    `,
      { transaction }
    );

    await sequelize.query(
      `
      DO $$ 
        BEGIN
          CREATE TYPE enum_tasks_status AS ENUM ('Open', 'In Progress', 'Completed', 'Overdue', 'Deleted');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
    `,
      { transaction }
    );

    // Create tasks table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".tasks
    (
      id serial NOT NULL,
      title character varying(255) NOT NULL,
      description text,
      creator_id integer,
      organization_id integer,
      due_date timestamp with time zone,
      priority enum_tasks_priority NOT NULL DEFAULT 'Medium',
      status enum_tasks_status NOT NULL DEFAULT 'Open',
      categories jsonb DEFAULT '[]',
      use_cases JSONB DEFAULT '[]'::jsonb,
      models JSONB DEFAULT '[]'::jsonb,
      frameworks JSONB DEFAULT '[]'::jsonb,
      vendors JSONB DEFAULT '[]'::jsonb,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      is_demo boolean NOT NULL DEFAULT false,
      CONSTRAINT tasks_pkey PRIMARY KEY (id),
      CONSTRAINT tasks_creator_id_fkey FOREIGN KEY (creator_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE SET NULL,
      CONSTRAINT tasks_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE SET NULL
    );`,
      { transaction }
    );

    // Add indexes for tasks table
    await Promise.all(
      [
        `CREATE INDEX IF NOT EXISTS "${tenantHash}_tasks_creator_id_idx" ON "${tenantHash}".tasks (creator_id);`,
        `CREATE INDEX IF NOT EXISTS "${tenantHash}_tasks_due_date_idx" ON "${tenantHash}".tasks (due_date);`,
        `CREATE INDEX IF NOT EXISTS "${tenantHash}_tasks_status_idx" ON "${tenantHash}".tasks (status);`,
        `CREATE INDEX IF NOT EXISTS "${tenantHash}_tasks_priority_idx" ON "${tenantHash}".tasks (priority);`,
        `CREATE INDEX IF NOT EXISTS "${tenantHash}_tasks_created_at_idx" ON "${tenantHash}".tasks (created_at);`,
        `CREATE INDEX IF NOT EXISTS "${tenantHash}_tasks_organization_id_idx" ON "${tenantHash}".tasks (organization_id);`,
      ].map((query) => sequelize.query(query, { transaction }))
    );

    // Create task_assignees table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".task_assignees
    (
      id serial NOT NULL,
      task_id integer NOT NULL,
      user_id integer NOT NULL,
      assigned_at timestamp with time zone NOT NULL DEFAULT now(),
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT task_assignees_pkey PRIMARY KEY (id),
      CONSTRAINT task_assignees_task_id_fkey FOREIGN KEY (task_id)
        REFERENCES "${tenantHash}".tasks (id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT task_assignees_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT unique_task_user_assignment UNIQUE (task_id, user_id)
    );`,
      { transaction }
    );

    // Add indexes for task_assignees table
    await Promise.all(
      [
        `CREATE INDEX IF NOT EXISTS "${tenantHash}_task_assignees_task_id_idx" ON "${tenantHash}".task_assignees (task_id);`,
        `CREATE INDEX IF NOT EXISTS "${tenantHash}_task_assignees_user_id_idx" ON "${tenantHash}".task_assignees (user_id);`,
      ].map((query) => sequelize.query(query, { transaction }))
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".api_tokens
    (
      id SERIAL PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      created_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL
    );`,
      { transaction }
    );

    // Create ai-incident-management table
    await sequelize.query(
      `
      CREATE TABLE IF NOT EXISTS "${tenantHash}"."ai_incident_managements" (
        id SERIAL PRIMARY KEY,
        incident_id VARCHAR(255) NOT NULL UNIQUE,
        ai_project VARCHAR(255) NOT NULL,
        type VARCHAR(255) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        occurred_date TIMESTAMP NOT NULL,
        date_detected TIMESTAMP NOT NULL,
        reporter VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Open',
        categories_of_harm JSON NOT NULL,
        affected_persons_groups TEXT,
        description TEXT NOT NULL,
        relationship_causality TEXT,
        immediate_mitigations TEXT,
        planned_corrective_actions TEXT,
        model_system_version VARCHAR(255),
        interim_report BOOLEAN NOT NULL DEFAULT FALSE,
        approval_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
        approved_by VARCHAR(255),
        approval_date TIMESTAMP,
        approval_notes TEXT,
        archived BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `,
      { transaction }
    );

    // Add indexes
    await sequelize.query(
      `
      CREATE INDEX IF NOT EXISTS "${tenantHash}_severity_idx" ON "${tenantHash}"."ai_incident_managements" (severity);
      CREATE INDEX IF NOT EXISTS "${tenantHash}_status_idx" ON "${tenantHash}"."ai_incident_managements" (status);
      CREATE INDEX IF NOT EXISTS "${tenantHash}_approval_status_idx" ON "${tenantHash}"."ai_incident_managements" (approval_status);
      CREATE INDEX IF NOT EXISTS "${tenantHash}_created_at_idx" ON "${tenantHash}"."ai_incident_managements" (created_at);
    `,
      { transaction }
    );

    // Create and attach incident_id sequence
    await sequelize.query(
      `
      CREATE SEQUENCE IF NOT EXISTS "${tenantHash}".incident_id_seq START 1;
      ALTER TABLE "${tenantHash}".ai_incident_managements
      ALTER COLUMN incident_id 
      SET DEFAULT 'INC-' || nextval('"${tenantHash}".incident_id_seq');
    `,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".automations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      trigger_id INTEGER REFERENCES public.automation_triggers(id) ON DELETE RESTRICT,
      params JSONB DEFAULT '{}',
      is_active BOOLEAN DEFAULT TRUE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".automation_actions (
      id SERIAL PRIMARY KEY,
      automation_id INTEGER REFERENCES "${tenantHash}".automations(id) ON DELETE CASCADE,
      action_type_id INTEGER REFERENCES public.automation_actions(id) ON DELETE RESTRICT,
      params JSONB DEFAULT '{}',
      "order" INTEGER DEFAULT 1
    );`,
      { transaction }
    );

    // MLflow tables are now created by the MLflow plugin on installation
    // Removed mlflow_integrations and mlflow_model_records from here

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".plugin_installations (
        id SERIAL PRIMARY KEY,
        plugin_key VARCHAR(100) NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'installed' CHECK (status IN ('installed')),
        installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        error_message TEXT,
        configuration JSONB,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE INDEX idx_plugin_installations_key_${tenantHash} ON "${tenantHash}".plugin_installations(plugin_key);`,
      { transaction }
    );

    // Note: file_manager table removed - all files now stored in unified 'files' table

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".file_access_logs (
      id SERIAL PRIMARY KEY,
      file_id INTEGER NOT NULL REFERENCES "${tenantHash}".files(id) ON DELETE CASCADE,
      accessed_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      access_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      action VARCHAR(20) NOT NULL CHECK (action IN ('download', 'view')),
      org_id INTEGER NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".model_inventories_projects_frameworks (
      id SERIAL PRIMARY KEY,
      model_inventory_id INTEGER NOT NULL,
      project_id INTEGER,
      framework_id INTEGER,
      CONSTRAINT unique_model_project_framework
        UNIQUE (model_inventory_id, project_id, framework_id),
      CONSTRAINT fk_model_inventory
        FOREIGN KEY (model_inventory_id)
        REFERENCES "${tenantHash}".model_inventories(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_project
        FOREIGN KEY (project_id)
        REFERENCES "${tenantHash}".projects(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_framework
        FOREIGN KEY (framework_id)
        REFERENCES public.frameworks(id)
        ON DELETE CASCADE,
      CONSTRAINT check_project_or_framework
        CHECK (
          (project_id IS NOT NULL AND framework_id IS NULL) OR
          (project_id IS NULL AND framework_id IS NOT NULL) OR
          (project_id IS NOT NULL AND framework_id IS NOT NULL)
        )
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".automation_execution_logs (
      id SERIAL PRIMARY KEY,
      automation_id INTEGER REFERENCES "${tenantHash}".automations(id) ON DELETE CASCADE,
      triggered_at TIMESTAMP DEFAULT NOW(),
      trigger_data JSONB DEFAULT '{}',
      action_results JSONB DEFAULT '[]',
      status TEXT CHECK (status IN ('success', 'partial_success', 'failure')) DEFAULT 'success',
      execution_time_ms INTEGER,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".risk_history (
      id SERIAL PRIMARY KEY,
      parameter VARCHAR(255) NOT NULL,
      snapshot_data JSONB NOT NULL DEFAULT '{}',
      recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
      triggered_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".model_inventory_history (
      id SERIAL PRIMARY KEY,
      parameter VARCHAR(255) NOT NULL,
      snapshot_data JSONB NOT NULL DEFAULT '{}',
      recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
      triggered_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
      { transaction }
    );

    await sequelize.query(
      `
      CREATE TABLE "${tenantHash}".evidence_hub (
        id SERIAL PRIMARY KEY,
        evidence_name VARCHAR(255) NOT NULL,
        evidence_type VARCHAR(100) NOT NULL,
        description TEXT,
        evidence_files JSONB NOT NULL DEFAULT '[]',
        expiry_date TIMESTAMP,
        mapped_model_ids INTEGER[],
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
      { transaction }
    );

    // Create share_links table for sharing views
    await sequelize.query(
      `CREATE TABLE "${tenantHash}".share_links (
        id SERIAL PRIMARY KEY,
        share_token VARCHAR(64) UNIQUE NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id INTEGER NOT NULL,
        created_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
        settings JSONB DEFAULT '{"shareAllFields": false, "allowDataExport": true, "allowViewersToOpenRecords": false, "displayToolbar": true}'::jsonb,
        is_enabled BOOLEAN DEFAULT true,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,
      { transaction }
    );

    // Create indexes for share_links table
    await sequelize.query(
      `CREATE INDEX share_links_token_idx ON "${tenantHash}".share_links(share_token);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX share_links_resource_idx ON "${tenantHash}".share_links(resource_type, resource_id);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX share_links_created_by_idx ON "${tenantHash}".share_links(created_by);`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".ce_markings (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES "${tenantHash}".projects(id) ON DELETE CASCADE,

      -- Classification and scope
      is_high_risk_ai_system BOOLEAN DEFAULT false,
      role_in_product VARCHAR(50) DEFAULT 'standalone',
      annex_iii_category VARCHAR(50) DEFAULT 'annex_iii_5',

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
      created_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
      updated_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,

      CONSTRAINT unique_project_ce_marking UNIQUE(project_id)
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".ce_marking_conformity_steps (
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
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".ce_marking_audit_trail (
      id SERIAL PRIMARY KEY,
      ce_marking_id INTEGER NOT NULL REFERENCES "${tenantHash}".ce_markings(id) ON DELETE CASCADE,
      field_name VARCHAR(255) NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
      changed_at TIMESTAMP DEFAULT NOW(),
      change_type VARCHAR(50) -- 'create', 'update', 'delete'
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".ce_marking_policies (
      id SERIAL PRIMARY KEY,
      ce_marking_id INTEGER NOT NULL,
      policy_id INTEGER NOT NULL,
      linked_at TIMESTAMP NOT NULL DEFAULT NOW(),
      linked_by INTEGER NOT NULL,
      CONSTRAINT fk_ce_marking_policies_ce_marking
        FOREIGN KEY (ce_marking_id)
        REFERENCES "${tenantHash}".ce_markings (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
      );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".ce_marking_evidences (
      id SERIAL PRIMARY KEY,
      ce_marking_id INTEGER NOT NULL,
      file_id INTEGER NOT NULL,
      linked_at TIMESTAMP NOT NULL DEFAULT NOW(),
      linked_by INTEGER NOT NULL,
      CONSTRAINT fk_ce_marking_evidences_ce_marking
        FOREIGN KEY (ce_marking_id)
        REFERENCES "${tenantHash}".ce_markings (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".ce_marking_incidents (
      id SERIAL PRIMARY KEY,
      ce_marking_id INTEGER NOT NULL,
      incident_id INTEGER NOT NULL,
      linked_at TIMESTAMP NOT NULL DEFAULT NOW(),
      linked_by INTEGER NOT NULL,

      CONSTRAINT fk_ce_marking_incidents_ce_marking
        FOREIGN KEY (ce_marking_id)
        REFERENCES "${tenantHash}".ce_markings (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

      CONSTRAINT fk_ce_marking_incidents_incident
        FOREIGN KEY (incident_id)
        REFERENCES "${tenantHash}".ai_incident_managements (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    );`,
      { transaction }
    );

    // Create policy_linked_objects table for linking policies with controls/risks/evidence
    await sequelize.query(
      `CREATE TABLE "${tenantHash}".policy_linked_objects (
          id SERIAL PRIMARY KEY,
          
          policy_id INTEGER NOT NULL,
          object_id INTEGER NOT NULL,
          object_type VARCHAR(50) NOT NULL CHECK (object_type IN ('control', 'risk', 'evidence')),
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (policy_id)
            REFERENCES "${tenantHash}".policy_manager(id)
            ON DELETE CASCADE
      );`,
      { transaction }
    );


    // Create notes table for collaborative annotation system
    await sequelize.query(
      `CREATE TABLE "${tenantHash}".notes (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        author_id INTEGER NOT NULL,
        attached_to VARCHAR(50) NOT NULL,
        attached_to_id VARCHAR(255) NOT NULL,
        organization_id INTEGER NOT NULL,
        is_edited BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL,
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
      );`,
      { transaction }
    );

    // Create indexes for notes table
    await sequelize.query(
      `CREATE INDEX idx_notes_entity ON "${tenantHash}".notes(attached_to, attached_to_id, organization_id);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX idx_notes_author ON "${tenantHash}".notes(author_id);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX idx_notes_organization ON "${tenantHash}".notes(organization_id);`,
      { transaction }
    );

    // Create change history table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".project_risk_change_history (
          id SERIAL PRIMARY KEY,
          project_risk_id INTEGER NOT NULL
            REFERENCES "${tenantHash}".risks(id) ON DELETE CASCADE,
          action VARCHAR(50) NOT NULL
            CHECK (action IN ('created', 'updated', 'deleted')),
          field_name VARCHAR(255),
          old_value TEXT,
          new_value TEXT,
          changed_by_user_id INTEGER
            REFERENCES public.users(id) ON DELETE SET NULL,
          changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );`,
      { transaction }
    );

    // Indexes
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_project_risk_change_history_risk_id
        ON "${tenantHash}".project_risk_change_history(project_risk_id);`,
      { transaction }
    );

    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_project_risk_change_history_changed_at
        ON "${tenantHash}".project_risk_change_history(changed_at DESC);`,
      { transaction }
    );

    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_project_risk_change_history_risk_changed
        ON "${tenantHash}".project_risk_change_history(project_risk_id, changed_at DESC);`,
      { transaction }
    );
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".vendor_change_history (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER NOT NULL REFERENCES "${tenantHash}".vendors(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
        field_name VARCHAR(255),
        old_value TEXT,
        new_value TEXT,
        changed_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `, { transaction });

    // Add risk query optimization indexes
    await Promise.all(
      [
        // Index on risks table for filtering and sorting
        `CREATE INDEX IF NOT EXISTS idx_risks_is_deleted ON "${tenantHash}".risks(is_deleted);`,
        `CREATE INDEX IF NOT EXISTS idx_risks_created_at_id ON "${tenantHash}".risks(created_at DESC, id ASC);`,
        `CREATE INDEX IF NOT EXISTS idx_risks_severity_likelihood ON "${tenantHash}".risks(severity, likelihood);`,

        // Indexes on junction tables for risk_id lookups
        `CREATE INDEX IF NOT EXISTS idx_projects_risks_risk_id ON "${tenantHash}".projects_risks(risk_id);`,
        `CREATE INDEX IF NOT EXISTS idx_frameworks_risks_risk_id ON "${tenantHash}".frameworks_risks(risk_id);`,
        `CREATE INDEX IF NOT EXISTS idx_subclauses_iso_risks_risk_id ON "${tenantHash}".subclauses_iso__risks(projects_risks_id);`,
        `CREATE INDEX IF NOT EXISTS idx_annexcategories_iso_risks_risk_id ON "${tenantHash}".annexcategories_iso__risks(projects_risks_id);`,
        `CREATE INDEX IF NOT EXISTS idx_controls_eu_risks_risk_id ON "${tenantHash}".controls_eu__risks(projects_risks_id);`,
        `CREATE INDEX IF NOT EXISTS idx_answers_eu_risks_risk_id ON "${tenantHash}".answers_eu__risks(projects_risks_id);`,
        `CREATE INDEX IF NOT EXISTS idx_subcontrols_eu_risks_risk_id ON "${tenantHash}".subcontrols_eu__risks(projects_risks_id);`,
        `CREATE INDEX IF NOT EXISTS idx_annexcontrols_iso27001_risks_risk_id ON "${tenantHash}".annexcontrols_iso27001__risks(projects_risks_id);`,
        `CREATE INDEX IF NOT EXISTS idx_subclauses_iso27001_risks_risk_id ON "${tenantHash}".subclauses_iso27001__risks(projects_risks_id);`,

        // Foreign key indexes for joins
        `CREATE INDEX IF NOT EXISTS idx_subclauses_iso_subclause_id ON "${tenantHash}".subclauses_iso__risks(subclause_id);`,
        `CREATE INDEX IF NOT EXISTS idx_annexcategories_iso_annexcategory_id ON "${tenantHash}".annexcategories_iso__risks(annexcategory_id);`,
        `CREATE INDEX IF NOT EXISTS idx_controls_eu_control_id ON "${tenantHash}".controls_eu__risks(control_id);`,
        `CREATE INDEX IF NOT EXISTS idx_answers_eu_answer_id ON "${tenantHash}".answers_eu__risks(answer_id);`,
        `CREATE INDEX IF NOT EXISTS idx_subcontrols_eu_subcontrol_id ON "${tenantHash}".subcontrols_eu__risks(subcontrol_id);`,
        `CREATE INDEX IF NOT EXISTS idx_annexcontrols_iso27001_annexcontrol_id ON "${tenantHash}".annexcontrols_iso27001__risks(annexcontrol_id);`,
        `CREATE INDEX IF NOT EXISTS idx_subclauses_iso27001_subclause_id ON "${tenantHash}".subclauses_iso27001__risks(subclause_id);`,
      ].map((query) => sequelize.query(query, { transaction }))
    );

    // NIST AI RMF FRAMEWORK TABLES CREATION
    console.log(`🏗️ Creating NIST AI RMF tables for new tenant: ${tenantHash}`);
    await createNistAiRmfTablesForTenant(tenantHash, transaction);

    // ========================================
    // EVALSERVER TABLES
    // ========================================
    console.log(`🔬 Creating EvalServer (LLM Evals) tables for tenant: ${tenantHash}`);

    // 1. llm_evals_organizations table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".llm_evals_organizations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,
      { transaction }
    );
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".llm_evals_org_members (
        org_id VARCHAR(255) NOT NULL REFERENCES "${tenantHash}".llm_evals_organizations(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (org_id, user_id)
      );`, { transaction }
    );

    // 2. llm_evals_projects table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".llm_evals_projects (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        use_case VARCHAR(50) DEFAULT 'chatbot',
        org_id VARCHAR(255) NOT NULL REFERENCES "${tenantHash}".llm_evals_organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255)
      );`,
      { transaction }
    );

    // Create indexes for llm_evals_projects
    await Promise.all([
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_projects_created_at ON "${tenantHash}".llm_evals_projects(created_at DESC);`,
        { transaction }
      ),
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_projects_org_id ON "${tenantHash}".llm_evals_projects(org_id);`,
        { transaction }
      ),
    ]);

    // 3. llm_evals_datasets table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".llm_evals_datasets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        path TEXT NOT NULL,
        size BIGINT NOT NULL DEFAULT 0,
        prompt_count INTEGER DEFAULT 0,
        dataset_type VARCHAR(50) DEFAULT 'chatbot',
        turn_type VARCHAR(50) DEFAULT 'single-turn',
        org_id VARCHAR(255) NOT NULL REFERENCES "${tenantHash}".llm_evals_organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255)
      );`,
      { transaction }
    );

    // 4. llm_evals_scorers table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".llm_evals_scorers (
        id VARCHAR(255) PRIMARY KEY,
        org_id VARCHAR(255) NOT NULL REFERENCES "${tenantHash}".llm_evals_organizations(id) ON DELETE CASCADE,
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
      );`,
      { transaction }
    );

    // 4b. llm_evals_models table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".llm_evals_models (
        id VARCHAR(255) PRIMARY KEY,
        org_id VARCHAR(255) NOT NULL REFERENCES "${tenantHash}".llm_evals_organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        provider VARCHAR(100) NOT NULL,
        endpoint_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255)
      );`,
      { transaction }
    );

    // 5. llm_evals_experiments table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".llm_evals_experiments (
        id VARCHAR(255) PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL REFERENCES "${tenantHash}".llm_evals_projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        config JSONB NOT NULL,
        baseline_experiment_id VARCHAR(255) REFERENCES "${tenantHash}".llm_evals_experiments(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'pending',
        results JSONB,
        error_message TEXT,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255)
      );`,
      { transaction }
    );

    // Create indexes for llm_evals_experiments
    await Promise.all([
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_experiments_project_id ON "${tenantHash}".llm_evals_experiments(project_id);`,
        { transaction }
      ),
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_experiments_status ON "${tenantHash}".llm_evals_experiments(status);`,
        { transaction }
      ),
    ]);

    // 6. llm_evals_logs table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".llm_evals_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id VARCHAR(255) NOT NULL REFERENCES "${tenantHash}".llm_evals_projects(id) ON DELETE CASCADE,
        experiment_id VARCHAR(255) REFERENCES "${tenantHash}".llm_evals_experiments(id) ON DELETE CASCADE,
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
      );`,
      { transaction }
    );

    // Create indexes for llm_evals_logs
    await Promise.all([
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_logs_project_id ON "${tenantHash}".llm_evals_logs(project_id);`,
        { transaction }
      ),
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_logs_experiment_id ON "${tenantHash}".llm_evals_logs(experiment_id);`,
        { transaction }
      ),
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_logs_timestamp ON "${tenantHash}".llm_evals_logs(timestamp DESC);`,
        { transaction }
      ),
    ]);

    // 7. llm_evals_metrics table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".llm_evals_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id VARCHAR(255) NOT NULL REFERENCES "${tenantHash}".llm_evals_projects(id) ON DELETE CASCADE,
        experiment_id VARCHAR(255) REFERENCES "${tenantHash}".llm_evals_experiments(id) ON DELETE CASCADE,
        metric_name VARCHAR(255) NOT NULL,
        metric_type VARCHAR(255) NOT NULL,
        value DOUBLE PRECISION NOT NULL,
        dimensions JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,
      { transaction }
    );

    // Create indexes for llm_evals_metrics
    await Promise.all([
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_metrics_project_id ON "${tenantHash}".llm_evals_metrics(project_id);`,
        { transaction }
      ),
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_metrics_metric_name ON "${tenantHash}".llm_evals_metrics(metric_name);`,
        { transaction }
      ),
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_metrics_timestamp ON "${tenantHash}".llm_evals_metrics(timestamp DESC);`,
        { transaction }
      ),
    ]);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".llm_evals_api_keys (
        id SERIAL PRIMARY KEY,
        provider VARCHAR(50) NOT NULL UNIQUE,
        encrypted_api_key TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `, { transaction });

    // Legacy evaluation_llm_api_keys table (for backward compatibility)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".evaluation_llm_api_keys (
        id SERIAL PRIMARY KEY,
        provider VARCHAR(50) NOT NULL UNIQUE,
        encrypted_api_key TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `, { transaction });

    // Create trigger on evaluation_llm_api_keys table
    await sequelize.query(`
      CREATE TRIGGER trg_${tenantHash}_update_evaluation_llm_api_keys_updated_at
      BEFORE UPDATE ON "${tenantHash}".evaluation_llm_api_keys
      FOR EACH ROW EXECUTE PROCEDURE update_evaluation_llm_api_keys_updated_at();
    `, { transaction });

    // Create trigger on llm_evals_api_keys table
    await sequelize.query(`
      CREATE TRIGGER trg_${tenantHash}_update_llm_evals_api_keys_updated_at
      BEFORE UPDATE ON "${tenantHash}".llm_evals_api_keys
      FOR EACH ROW EXECUTE PROCEDURE update_evaluation_llm_api_keys_updated_at();
    `, { transaction });

    // 8. llm_evals_arena_comparisons table (for LLM Arena head-to-head comparisons)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".llm_evals_arena_comparisons (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        org_id VARCHAR(255) REFERENCES "${tenantHash}".llm_evals_organizations(id) ON DELETE CASCADE,
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

    // Create indexes for llm_evals_arena_comparisons
    await Promise.all([
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_arena_comparisons_org_id ON "${tenantHash}".llm_evals_arena_comparisons(org_id);`,
        { transaction }
      ),
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_arena_comparisons_status ON "${tenantHash}".llm_evals_arena_comparisons(status);`,
        { transaction }
      ),
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_arena_comparisons_created_at ON "${tenantHash}".llm_evals_arena_comparisons(created_at DESC);`,
        { transaction }
      ),
    ]);

    // 9. llm_evals_bias_audits table (for demographic bias audits)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".llm_evals_bias_audits (
        id VARCHAR(255) PRIMARY KEY,
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
    `, { transaction });
    await Promise.all([
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_bias_audits_org_id ON "${tenantHash}".llm_evals_bias_audits(org_id);`,
        { transaction }
      ),
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_bias_audits_status ON "${tenantHash}".llm_evals_bias_audits(status);`,
        { transaction }
      ),
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_bias_audits_project_id ON "${tenantHash}".llm_evals_bias_audits(project_id);`,
        { transaction }
      ),
      sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_llm_evals_bias_audits_created_at ON "${tenantHash}".llm_evals_bias_audits(created_at DESC);`,
        { transaction }
      ),
    ]);

    // 10. llm_evals_bias_audit_results table (per-group breakdown rows)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".llm_evals_bias_audit_results (
        id SERIAL PRIMARY KEY,
        audit_id VARCHAR(255) NOT NULL REFERENCES "${tenantHash}".llm_evals_bias_audits(id) ON DELETE CASCADE,
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
    `, { transaction });
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_llm_evals_bias_audit_results_audit_id ON "${tenantHash}".llm_evals_bias_audit_results(audit_id);`,
      { transaction }
    );

    console.log(`✅ EvalServer tables created successfully for tenant: ${tenantHash}`);

    // Create change history table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".project_risk_change_history (
        id SERIAL PRIMARY KEY,
        project_risk_id INTEGER NOT NULL REFERENCES "${tenantHash}".risks(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
        field_name VARCHAR(255),
        old_value TEXT,
        new_value TEXT,
        changed_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `, { transaction });

    await Promise.all([
      `
        CREATE INDEX IF NOT EXISTS idx_project_risk_change_history_risk_id
        ON "${tenantHash}".project_risk_change_history(project_risk_id);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_project_risk_change_history_changed_at
        ON "${tenantHash}".project_risk_change_history(changed_at DESC);
        `,
      `
        CREATE INDEX IF NOT EXISTS idx_project_risk_change_history_risk_changed
        ON "${tenantHash}".project_risk_change_history(project_risk_id, changed_at DESC);
        `
    ].map((query) => sequelize.query(query, { transaction })));

    // Create change history table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".vendor_risk_change_history (
        id SERIAL PRIMARY KEY,
        vendor_risk_id INTEGER NOT NULL REFERENCES "${tenantHash}".vendorrisks(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
        field_name VARCHAR(255),
        old_value TEXT,
        new_value TEXT,
        changed_by_user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `, { transaction });

    await Promise.all([
      `
        CREATE INDEX IF NOT EXISTS idx_vendor_risk_change_history_vendor_risk_id
        ON "${tenantHash}".vendor_risk_change_history(vendor_risk_id);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_vendor_risk_change_history_changed_at
        ON "${tenantHash}".vendor_risk_change_history(changed_at DESC);
        `,
      `
        CREATE INDEX IF NOT EXISTS idx_vendor_risk_change_history_risk_changed
        ON "${tenantHash}".vendor_risk_change_history(vendor_risk_id, changed_at DESC);
      `
    ].map((query) => sequelize.query(query, { transaction })));

    // Create llm_keys table for LLM API key management
    // Note: Requires global ENUM type enum_llm_keys_provider to exist
    // This is created by migration 20251126220719-create-llm-keys-table.js
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".llm_keys (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        name enum_llm_keys_provider NOT NULL,
        url TEXT,
        model TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".advisor_conversations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        domain VARCHAR(100) NOT NULL,
        messages JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, domain)
      );`, { transaction }
    );

    // ========================================
    // AI DETECTION TABLES
    // ========================================
    console.log(`🔍 Creating AI Detection tables for tenant: ${tenantHash}`);

    // Create ai_detection_scans table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".ai_detection_scans (
        id SERIAL PRIMARY KEY,
        repository_url VARCHAR(500) NOT NULL,
        repository_owner VARCHAR(255) NOT NULL,
        repository_name VARCHAR(255) NOT NULL,
        default_branch VARCHAR(100) DEFAULT 'main',
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        findings_count INTEGER DEFAULT 0,
        files_scanned INTEGER DEFAULT 0,
        total_files INTEGER,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        duration_ms INTEGER,
        error_message TEXT,
        triggered_by INTEGER NOT NULL,
        cache_path VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      { transaction }
    );

    // Create indexes for ai_detection_scans
    await Promise.all([
      `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_scans_status_idx" ON "${tenantHash}".ai_detection_scans(status);`,
      `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_scans_triggered_by_idx" ON "${tenantHash}".ai_detection_scans(triggered_by);`,
      `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_scans_created_at_idx" ON "${tenantHash}".ai_detection_scans(created_at DESC);`,
      `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_scans_repo_idx" ON "${tenantHash}".ai_detection_scans(repository_owner, repository_name);`,
    ].map((query) => sequelize.query(query, { transaction })));

    // Create ai_detection_findings table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".ai_detection_findings (
        id SERIAL PRIMARY KEY,
        scan_id INTEGER NOT NULL REFERENCES "${tenantHash}".ai_detection_scans(id) ON DELETE CASCADE,
        finding_type VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        provider VARCHAR(100),
        confidence VARCHAR(20) NOT NULL,
        risk_level VARCHAR(20) DEFAULT 'medium',
        description TEXT,
        documentation_url VARCHAR(500),
        file_count INTEGER DEFAULT 1,
        file_paths JSONB,
        -- Governance columns
        governance_status VARCHAR(20) DEFAULT NULL,
        governance_updated_at TIMESTAMP WITH TIME ZONE,
        governance_updated_by INTEGER,
        -- License columns
        license_id VARCHAR(100),
        license_name VARCHAR(255),
        license_risk VARCHAR(20),
        license_source VARCHAR(50),
        -- Model security scanning columns (Phase 2)
        severity VARCHAR(20),
        cwe_id VARCHAR(20),
        cwe_name VARCHAR(200),
        owasp_ml_id VARCHAR(20),
        owasp_ml_name VARCHAR(200),
        threat_type VARCHAR(50),
        operator_name VARCHAR(100),
        module_name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(scan_id, name, provider)
      );`,
      { transaction }
    );

    // Create indexes for ai_detection_findings
    await Promise.all([
      `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_findings_scan_idx" ON "${tenantHash}".ai_detection_findings(scan_id);`,
      `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_findings_confidence_idx" ON "${tenantHash}".ai_detection_findings(confidence);`,
      `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_findings_provider_idx" ON "${tenantHash}".ai_detection_findings(provider);`,
      `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_findings_risk_level_idx" ON "${tenantHash}".ai_detection_findings(risk_level);`,
      `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_findings_governance_idx" ON "${tenantHash}".ai_detection_findings(governance_status);`,
      `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_findings_severity_idx" ON "${tenantHash}".ai_detection_findings(severity);`,
      `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_findings_type_idx" ON "${tenantHash}".ai_detection_findings(finding_type);`,
      `CREATE INDEX IF NOT EXISTS "${tenantHash}_ai_findings_license_risk_idx" ON "${tenantHash}".ai_detection_findings(license_risk);`,
    ].map((query) => sequelize.query(query, { transaction })));

    // Create github_tokens table (for private repository access)
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".github_tokens (
        id SERIAL PRIMARY KEY,
        encrypted_token TEXT NOT NULL,
        token_name VARCHAR(100) DEFAULT 'GitHub Personal Access Token',
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_used_at TIMESTAMP WITH TIME ZONE
      );`,
      { transaction }
    );

    console.log(`✅ AI Detection tables created successfully for tenant: ${tenantHash}`);

    // Create change history table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".incident_change_history (
        id SERIAL PRIMARY KEY,
        incident_id INTEGER NOT NULL REFERENCES "${tenantHash}".ai_incident_managements(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
        field_name VARCHAR(255),
        old_value TEXT,
        new_value TEXT,
        changed_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `, { transaction });

    // ========================================
    // POST-MARKET MONITORING TABLES
    // ========================================
    console.log(`📊 Creating Post-Market Monitoring tables for tenant: ${tenantHash}`);

    // 1. PMM Configurations - one per use case/project
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".post_market_monitoring_configs (
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
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".post_market_monitoring_questions (
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
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".post_market_monitoring_cycles (
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
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".post_market_monitoring_responses (
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
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".post_market_monitoring_reports (
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
    await Promise.all([
      `CREATE INDEX IF NOT EXISTS idx_pmm_configs_project ON "${tenantHash}".post_market_monitoring_configs(project_id);`,
      `CREATE INDEX IF NOT EXISTS idx_pmm_cycles_config ON "${tenantHash}".post_market_monitoring_cycles(config_id);`,
      `CREATE INDEX IF NOT EXISTS idx_pmm_cycles_status ON "${tenantHash}".post_market_monitoring_cycles(status);`,
      `CREATE INDEX IF NOT EXISTS idx_pmm_cycles_due_at ON "${tenantHash}".post_market_monitoring_cycles(due_at);`,
      `CREATE INDEX IF NOT EXISTS idx_pmm_responses_cycle ON "${tenantHash}".post_market_monitoring_responses(cycle_id);`,
      `CREATE INDEX IF NOT EXISTS idx_pmm_questions_config ON "${tenantHash}".post_market_monitoring_questions(config_id);`,
    ].map((query) => sequelize.query(query, { transaction })));

    console.log(`✅ Post-Market Monitoring tables created successfully for tenant: ${tenantHash}`);

    // Create index on incident_id for faster lookups
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_incident_change_history_incident_id
      ON "${tenantHash}".incident_change_history(incident_id);
    `, { transaction });

    // Create index on changed_at for time-based queries
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_incident_change_history_changed_at
      ON "${tenantHash}".incident_change_history(changed_at DESC);
    `, { transaction });

    // Create composite index for incident_id + changed_at (most common query pattern)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_incident_change_history_incident_changed
      ON "${tenantHash}".incident_change_history(incident_id, changed_at DESC);
    `, { transaction });

    // ── Notifications Tables ──────────────────────────────────────────

    // Create notification type enum
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "${tenantHash}".enum_notification_type AS ENUM (
          'task_assigned',
          'task_completed',
          'review_requested',
          'review_approved',
          'review_rejected',
          'approval_requested',
          'approval_approved',
          'approval_rejected',
          'approval_complete',
          'policy_due_soon',
          'policy_overdue',
          'training_assigned',
          'training_completed',
          'vendor_review_due',
          'file_uploaded',
          'comment_added',
          'mention',
          'system'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `, { transaction });

    // Create entity type enum for notifications
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "${tenantHash}".enum_notification_entity_type AS ENUM (
          'project',
          'task',
          'policy',
          'vendor',
          'model',
          'training',
          'file',
          'use_case',
          'risk',
          'assessment',
          'comment',
          'user'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `, { transaction });

    // Notifications table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        type "${tenantHash}".enum_notification_type NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        entity_type "${tenantHash}".enum_notification_entity_type NULL,
        entity_id INTEGER NULL,
        entity_name VARCHAR(255) NULL,
        action_url VARCHAR(500) NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at TIMESTAMP WITH TIME ZONE NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_by INTEGER NULL REFERENCES public.users(id) ON DELETE SET NULL,
        metadata JSONB NULL
      );
    `, { transaction });

    // Indexes for notifications
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON "${tenantHash}".notifications(user_id);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON "${tenantHash}".notifications(user_id, is_read) WHERE is_read = FALSE;`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON "${tenantHash}".notifications(created_at DESC);`,
      { transaction }
    );
    await sequelize.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_entity ON "${tenantHash}".notifications(entity_type, entity_id);`,
      { transaction }
    );

    // ── Entity Graph Tables ──────────────────────────────────────────

    // Entity graph annotations table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".entity_graph_annotations (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        organization_id INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
      );
    `, { transaction });

    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_annotations_user_entity_${tenantHash.replace(/[^a-z0-9]/g, "_")}
      ON "${tenantHash}".entity_graph_annotations(user_id, entity_type, entity_id);
    `, { transaction });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_annotations_user_${tenantHash.replace(/[^a-z0-9]/g, "_")}
      ON "${tenantHash}".entity_graph_annotations(user_id, organization_id);
    `, { transaction });

    // Entity graph views table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".entity_graph_views (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        user_id INTEGER NOT NULL,
        organization_id INTEGER NOT NULL,
        config JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
      );
    `, { transaction });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_views_user_${tenantHash.replace(/[^a-z0-9]/g, "_")}
      ON "${tenantHash}".entity_graph_views(user_id, organization_id);
    `, { transaction });

    // Entity graph gap rules table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".entity_graph_gap_rules (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        organization_id INTEGER NOT NULL,
        rules JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
      );
    `, { transaction });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_gap_rules_org_${tenantHash.replace(/[^a-z0-9]/g, "_")}
      ON "${tenantHash}".entity_graph_gap_rules(organization_id);
    `, { transaction });

    // ── AI Incident Management Tables ──────────────────────────────────────────

    // AI incident managements table
    await sequelize.query(`
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
    await sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "${tenantHash}".incident_id_seq START 1;
    `, { transaction });

    // Set default value on incident_id column
    await sequelize.query(`
      ALTER TABLE "${tenantHash}".ai_incident_managements
      ALTER COLUMN incident_id
      SET DEFAULT 'INC-' || nextval('"${tenantHash}".incident_id_seq');
    `, { transaction });

    // Indexes for ai_incident_managements
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_${tenantHash}_ai_incident_severity ON "${tenantHash}".ai_incident_managements (severity);
    `, { transaction });
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_${tenantHash}_ai_incident_status ON "${tenantHash}".ai_incident_managements (status);
    `, { transaction });
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_${tenantHash}_ai_incident_approval_status ON "${tenantHash}".ai_incident_managements (approval_status);
    `, { transaction });
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_${tenantHash}_ai_incident_created_at ON "${tenantHash}".ai_incident_managements (created_at);
    `, { transaction });

    // ── Bias and Fairness Evaluations Tables ──────────────────────────────────────────

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".bias_fairness_evaluations (
        id SERIAL PRIMARY KEY,
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
    `, { transaction });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_${tenantHash}_bias_fairness_evaluations_status ON "${tenantHash}".bias_fairness_evaluations(status);
    `, { transaction });
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_${tenantHash}_bias_fairness_evaluations_eval_id ON "${tenantHash}".bias_fairness_evaluations(eval_id);
    `, { transaction });

    // ── MLflow Integration Tables ──────────────────────────────────────────

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".mlflow_integrations (
        id SERIAL PRIMARY KEY,
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
        updated_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `, { transaction });

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".mlflow_model_records (
        id SERIAL PRIMARY KEY,
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
        CONSTRAINT mlflow_model_records_org_model_version_unique UNIQUE (model_name, version)
      );
    `, { transaction });

    // Note: Model Lifecycle tables are now created by the model-lifecycle plugin
    // Install the plugin from the marketplace to enable lifecycle tracking

    // ────────────────────────────────────────────────────────
    // Shadow AI Detection tables
    // ────────────────────────────────────────────────────────

    // 1. shadow_ai_tools (must come before events due to FK)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_tools (
        id                  SERIAL PRIMARY KEY,
        name                VARCHAR(255) NOT NULL UNIQUE,
        vendor              VARCHAR(255),
        domains             TEXT[] NOT NULL,
        status              VARCHAR(50) DEFAULT 'detected',
        risk_score          INTEGER,
        first_detected_at   TIMESTAMPTZ DEFAULT NOW(),
        last_seen_at        TIMESTAMPTZ,
        total_users         INTEGER DEFAULT 0,
        total_events        INTEGER DEFAULT 0,
        trains_on_data      BOOLEAN,
        soc2_certified      BOOLEAN,
        gdpr_compliant      BOOLEAN,
        data_residency      VARCHAR(100),
        sso_support         BOOLEAN,
        encryption_at_rest  BOOLEAN,
        model_inventory_id  INTEGER,
        governance_owner_id INTEGER,
        risk_entry_id       INTEGER,
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      );
    `, { transaction });

    // 2. shadow_ai_events
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_events (
        id              BIGSERIAL PRIMARY KEY,
        user_email      VARCHAR(255) NOT NULL,
        destination     VARCHAR(512) NOT NULL,
        uri_path        TEXT,
        http_method     VARCHAR(10),
        action          VARCHAR(20) DEFAULT 'allowed',
        detected_tool_id INTEGER REFERENCES "${tenantHash}".shadow_ai_tools(id) ON DELETE SET NULL,
        detected_model  VARCHAR(255),
        event_timestamp TIMESTAMPTZ NOT NULL,
        ingested_at     TIMESTAMPTZ DEFAULT NOW(),
        department      VARCHAR(255),
        job_title       VARCHAR(255),
        manager_email   VARCHAR(255)
      );
    `, { transaction });

    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_shadow_events_timestamp ON "${tenantHash}".shadow_ai_events(event_timestamp);`, { transaction });
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_shadow_events_user ON "${tenantHash}".shadow_ai_events(user_email);`, { transaction });
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_shadow_events_tool ON "${tenantHash}".shadow_ai_events(detected_tool_id);`, { transaction });

    // 3. shadow_ai_daily_rollups
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_daily_rollups (
        id              SERIAL PRIMARY KEY,
        rollup_date     DATE NOT NULL,
        user_email      VARCHAR(255) NOT NULL,
        tool_id         INTEGER REFERENCES "${tenantHash}".shadow_ai_tools(id) ON DELETE CASCADE,
        department      VARCHAR(255),
        total_events    INTEGER DEFAULT 0,
        post_events     INTEGER DEFAULT 0,
        blocked_events  INTEGER DEFAULT 0,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(rollup_date, user_email, tool_id)
      );
    `, { transaction });

    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_shadow_rollups_date ON "${tenantHash}".shadow_ai_daily_rollups(rollup_date);`, { transaction });
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_shadow_rollups_tool ON "${tenantHash}".shadow_ai_daily_rollups(tool_id);`, { transaction });

    // 4. shadow_ai_monthly_rollups
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_monthly_rollups (
        id              SERIAL PRIMARY KEY,
        rollup_month    DATE NOT NULL,
        tool_id         INTEGER REFERENCES "${tenantHash}".shadow_ai_tools(id) ON DELETE CASCADE,
        department      VARCHAR(255),
        unique_users    INTEGER DEFAULT 0,
        total_events    INTEGER DEFAULT 0,
        post_events     INTEGER DEFAULT 0,
        blocked_events  INTEGER DEFAULT 0,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(rollup_month, tool_id, department)
      );
    `, { transaction });

    // 5. shadow_ai_rules
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_rules (
        id              SERIAL PRIMARY KEY,
        name            VARCHAR(255) NOT NULL,
        description     TEXT,
        is_active       BOOLEAN DEFAULT true,
        trigger_type    VARCHAR(100) NOT NULL,
        trigger_config  JSONB DEFAULT '{}',
        actions         JSONB NOT NULL,
        cooldown_minutes INTEGER DEFAULT 1440,
        created_by      INTEGER NOT NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      );
    `, { transaction });

    // 6. shadow_ai_rule_notifications
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_rule_notifications (
        id          SERIAL PRIMARY KEY,
        rule_id     INTEGER REFERENCES "${tenantHash}".shadow_ai_rules(id) ON DELETE CASCADE,
        user_id     INTEGER NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(rule_id, user_id)
      );
    `, { transaction });

    // 7. shadow_ai_api_keys
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_api_keys (
        id              SERIAL PRIMARY KEY,
        key_hash        VARCHAR(255) NOT NULL UNIQUE,
        key_prefix      VARCHAR(20) NOT NULL,
        label           VARCHAR(255),
        created_by      INTEGER NOT NULL,
        last_used_at    TIMESTAMPTZ,
        is_active       BOOLEAN DEFAULT true,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );
    `, { transaction });

    // 8. shadow_ai_syslog_config
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_syslog_config (
        id                  SERIAL PRIMARY KEY,
        source_identifier   VARCHAR(255) NOT NULL,
        parser_type         VARCHAR(50) NOT NULL,
        is_active           BOOLEAN DEFAULT true,
        created_at          TIMESTAMPTZ DEFAULT NOW()
      );
    `, { transaction });

    // 9. shadow_ai_alert_history
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_alert_history (
        id              SERIAL PRIMARY KEY,
        rule_id         INTEGER REFERENCES "${tenantHash}".shadow_ai_rules(id) ON DELETE SET NULL,
        rule_name       VARCHAR(255),
        trigger_type    VARCHAR(100),
        trigger_data    JSONB,
        actions_taken   JSONB,
        fired_at        TIMESTAMPTZ DEFAULT NOW()
      );
    `, { transaction });

    // 10. shadow_ai_settings
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".shadow_ai_settings (
        id SERIAL PRIMARY KEY,
        rate_limit_max_events_per_hour INTEGER NOT NULL DEFAULT 0,
        retention_events_days INTEGER NOT NULL DEFAULT 30,
        retention_daily_rollups_days INTEGER NOT NULL DEFAULT 365,
        retention_alert_history_days INTEGER NOT NULL DEFAULT 90,
        updated_at TIMESTAMP DEFAULT NOW(),
        updated_by INTEGER NULL REFERENCES public.users(id)
      );
    `, { transaction });

    // Insert default settings row
    await sequelize.query(`
      INSERT INTO "${tenantHash}".shadow_ai_settings (id)
      VALUES (1)
      ON CONFLICT (id) DO NOTHING;
    `, { transaction });

    // 11. feature_settings
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".feature_settings (
        id SERIAL PRIMARY KEY,
        lifecycle_enabled BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMP DEFAULT NOW(),
        updated_by INTEGER NULL REFERENCES public.users(id)
      );
    `, { transaction });

    // Insert default feature settings row
    await sequelize.query(`
      INSERT INTO "${tenantHash}".feature_settings (id)
      VALUES (1)
      ON CONFLICT (id) DO NOTHING;
    `, { transaction });


    // Composite indexes for common query patterns
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_shadow_events_dept_ts ON "${tenantHash}".shadow_ai_events(department, event_timestamp DESC);`, { transaction });
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_shadow_events_user_ts ON "${tenantHash}".shadow_ai_events(user_email, event_timestamp DESC);`, { transaction });
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_shadow_events_tool_ts ON "${tenantHash}".shadow_ai_events(detected_tool_id, event_timestamp DESC);`, { transaction });
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_shadow_events_action_ts ON "${tenantHash}".shadow_ai_events(action, event_timestamp DESC);`, { transaction });
    await sequelize.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_shadow_api_keys_hash_active ON "${tenantHash}".shadow_ai_api_keys(key_hash) WHERE is_active = true;`, { transaction });
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_shadow_monthly_rollups_tool ON "${tenantHash}".shadow_ai_monthly_rollups(tool_id);`, { transaction });
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_shadow_alert_history_fired ON "${tenantHash}".shadow_ai_alert_history(fired_at DESC);`, { transaction });
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_shadow_alert_history_rule ON "${tenantHash}".shadow_ai_alert_history(rule_id);`, { transaction });
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_shadow_rules_active ON "${tenantHash}".shadow_ai_rules(is_active);`, { transaction });
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_shadow_rule_notifications_rule ON "${tenantHash}".shadow_ai_rule_notifications(rule_id);`, { transaction });

    // 12. agent_primitives (Agent Discovery)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".agent_primitives (
        id SERIAL PRIMARY KEY,
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
        reviewed_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMP,
        linked_model_inventory_id INTEGER,
        is_stale BOOLEAN NOT NULL DEFAULT false,
        is_manual BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT agent_primitives_source_external_unique UNIQUE (source_system, external_id)
      );
    `, { transaction });

    // agent_primitives indexes
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_agent_primitives_source ON "${tenantHash}".agent_primitives(source_system);`, { transaction });
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_agent_primitives_status ON "${tenantHash}".agent_primitives(review_status);`, { transaction });
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_agent_primitives_type ON "${tenantHash}".agent_primitives(primitive_type);`, { transaction });
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_agent_primitives_stale ON "${tenantHash}".agent_primitives(is_stale);`, { transaction });
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_agent_primitives_created ON "${tenantHash}".agent_primitives(created_at DESC);`, { transaction });

    // 13. agent_discovery_sync_log
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".agent_discovery_sync_log (
        id SERIAL PRIMARY KEY,
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
    `, { transaction });

    // 14. agent_audit_log
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".agent_audit_log (
        id SERIAL PRIMARY KEY,
        agent_primitive_id INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL,
        field_changed VARCHAR(100),
        old_value TEXT,
        new_value TEXT,
        performed_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `, { transaction });
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_audit_log_primitive
      ON "${tenantHash}".agent_audit_log (agent_primitive_id);
    `, { transaction });
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_audit_log_created
      ON "${tenantHash}".agent_audit_log (created_at DESC);
    `, { transaction });

    console.log(`✅ Shadow AI tables created successfully for tenant: ${tenantHash}`);

    // Create invitations table
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".invitations (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        surname VARCHAR(255),
        role_id INT REFERENCES public.roles(id),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        invited_by INT REFERENCES public.users(id),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      { transaction }
    );
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_pending_email
      ON "${tenantHash}".invitations (email)
      WHERE status = 'pending';
    `, { transaction });

    // Create task_change_history table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".task_change_history (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES "${tenantHash}".tasks(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
        field_name VARCHAR(255),
        old_value TEXT,
        new_value TEXT,
        changed_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        changed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `, { transaction });

    await Promise.all([
      `CREATE INDEX IF NOT EXISTS idx_task_change_history_task_id ON "${tenantHash}".task_change_history(task_id);`,
      `CREATE INDEX IF NOT EXISTS idx_task_change_history_changed_at ON "${tenantHash}".task_change_history(changed_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_task_change_history_task_changed ON "${tenantHash}".task_change_history(task_id, changed_at DESC);`,
    ].map((query) => sequelize.query(query, { transaction })));

    // Create training_change_history table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".training_change_history (
        id SERIAL PRIMARY KEY,
        training_id INTEGER NOT NULL REFERENCES "${tenantHash}".trainingregistar(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
        field_name VARCHAR(255),
        old_value TEXT,
        new_value TEXT,
        changed_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        changed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `, { transaction });

    await Promise.all([
      `CREATE INDEX IF NOT EXISTS idx_training_change_history_training_id ON "${tenantHash}".training_change_history(training_id);`,
      `CREATE INDEX IF NOT EXISTS idx_training_change_history_changed_at ON "${tenantHash}".training_change_history(changed_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_training_change_history_training_changed ON "${tenantHash}".training_change_history(training_id, changed_at DESC);`,
    ].map((query) => sequelize.query(query, { transaction })));

    // Create model_risk_change_history table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantHash}".model_risk_change_history (
        id SERIAL PRIMARY KEY,
        model_risk_id INTEGER NOT NULL REFERENCES "${tenantHash}".model_risks(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
        field_name VARCHAR(255),
        old_value TEXT,
        new_value TEXT,
        changed_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        changed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `, { transaction });

    await Promise.all([
      `CREATE INDEX IF NOT EXISTS idx_model_risk_change_history_risk_id ON "${tenantHash}".model_risk_change_history(model_risk_id);`,
      `CREATE INDEX IF NOT EXISTS idx_model_risk_change_history_changed_at ON "${tenantHash}".model_risk_change_history(changed_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_model_risk_change_history_risk_changed ON "${tenantHash}".model_risk_change_history(model_risk_id, changed_at DESC);`,
    ].map((query) => sequelize.query(query, { transaction })));

  } catch (error) {
    throw error;
  }
};
