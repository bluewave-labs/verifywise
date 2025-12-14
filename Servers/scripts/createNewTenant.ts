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
        `CREATE TABLE IF NOT EXISTS "${tenantHash}".model_files
      (
        id serial NOT NULL,
        name character varying(255) NOT NULL,
        file_content bytea NOT NULL,
        CONSTRAINT model_files_pkey PRIMARY KEY (id)
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
      risk_category TEXT[] NOT NULL,
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
      CONSTRAINT files_pkey PRIMARY KEY (id),
      CONSTRAINT files_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES "${tenantHash}".projects (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT files_uploaded_by_fkey FOREIGN KEY (uploaded_by)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL
    );`,
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
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".model_data
    (
      id serial NOT NULL,
      name character varying(255) NOT NULL,
      file_content bytea NOT NULL,
      model_id integer NOT NULL,
      target_column character varying(255) NOT NULL,
      sensitive_column character varying(255) NOT NULL,
      CONSTRAINT model_data_pkey PRIMARY KEY (id),
      CONSTRAINT model_data_model_id_fkey FOREIGN KEY (model_id)
        REFERENCES "${tenantHash}".model_files (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".fairness_runs
    (
      id serial NOT NULL,
      data_id integer NOT NULL,
      metrics jsonb NOT NULL,
      CONSTRAINT fairness_runs_pkey PRIMARY KEY (id),
      CONSTRAINT fairness_runs_data_id_fkey FOREIGN KEY (data_id)
        REFERENCES "${tenantHash}".model_data (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
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
        "assigned_reviewer_ids" INTEGER[],
        "last_updated_by" INTEGER NOT NULL,
        "last_updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("author_id") REFERENCES public.users(id) ON DELETE CASCADE,
        FOREIGN KEY ("last_updated_by") REFERENCES public.users(id) ON DELETE SET NULL
      );`,
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
        model_id INTEGER REFERENCES "${tenantHash}".model_inventories(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_deleted BOOLEAN NOT NULL DEFAULT false,
        deleted_at TIMESTAMP
      );`,
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
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
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
      created_by INTEGER REFERENCES users(id),
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

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".mlflow_integrations (
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
      last_synced_at TIMESTAMP,
      last_sync_status VARCHAR(10) CHECK (last_sync_status IN ('success', 'partial', 'error')),
      last_sync_message TEXT,
      last_successful_test_at TIMESTAMP,
      last_failed_test_at TIMESTAMP,
      last_failed_test_message TEXT,
      updated_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".mlflow_model_records (
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
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".file_manager (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      size BIGINT NOT NULL,
      mimetype VARCHAR(255) NOT NULL,
      file_path VARCHAR(500),
      content BYTEA,
      uploaded_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      model_id INTEGER NULL,
      org_id INTEGER NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      is_demo BOOLEAN NOT NULL DEFAULT FALSE,
      source public.enum_file_manager_source DEFAULT 'file_manager'
    );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE "${tenantHash}".file_access_logs (
      id SERIAL PRIMARY KEY,
      file_id INTEGER NOT NULL REFERENCES "${tenantHash}".file_manager(id) ON DELETE CASCADE,
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
        created_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
      created_by INTEGER REFERENCES public.users(id),
      updated_by INTEGER REFERENCES public.users(id),

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
      changed_by INTEGER REFERENCES public.users(id),
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
        FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE,
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

    // NIST AI RMF FRAMEWORK TABLES CREATION
    console.log(`🏗️ Creating NIST AI RMF tables for new tenant: ${tenantHash}`);
    await createNistAiRmfTablesForTenant(tenantHash, transaction);
  } catch (error) {
    throw error;
  }
};
