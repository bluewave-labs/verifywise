import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { getTenantHash } from "../tools/getTenantHash";

export const createNewTenant = async (organization_id: number, transaction: Transaction) => {
  try {
    const tenantHash = getTenantHash(organization_id);
    await sequelize.query(`CREATE SCHEMA "${tenantHash}";`, { transaction });

    await Promise.all([
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".projects
      (
        id serial NOT NULL,
        project_title character varying(255) NOT NULL,
        owner integer,
        start_date timestamp with time zone NOT NULL,
        ai_risk_classification enum_projects_ai_risk_classification NOT NULL,
        type_of_high_risk_role enum_projects_type_of_high_risk_role NOT NULL,
        goal character varying(255),
        last_updated timestamp with time zone NOT NULL,
        last_updated_by integer,
        is_demo boolean NOT NULL DEFAULT false,
        created_at timestamp without time zone NOT NULL DEFAULT now(),
        CONSTRAINT projects_pkey PRIMARY KEY (id),
        CONSTRAINT projects_owner_fkey FOREIGN KEY (owner)
          REFERENCES public.users (id) MATCH SIMPLE
          ON UPDATE NO ACTION ON DELETE SET NULL,
        CONSTRAINT projects_last_updated_by_fkey FOREIGN KEY (last_updated_by)
          REFERENCES public.users (id) MATCH SIMPLE
          ON UPDATE NO ACTION ON DELETE SET NULL
      );`,
      `CREATE TABLE IF NOT EXISTS "${tenantHash}".vendors
      (
        id serial NOT NULL,
        order_no integer,
        vendor_name character varying(255) NOT NULL,
        vendor_provides text NOT NULL,
        assignee integer,
        website character varying(255) NOT NULL,
        vendor_contact_person character varying(255) NOT NULL,
        review_result character varying(255) NOT NULL,
        review_status enum_vendors_review_status NOT NULL,
        reviewer integer,
        risk_status enum_vendors_risk_status NOT NULL,
        review_date timestamp with time zone NOT NULL,
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
        duration integer,
        provider character varying(255),
        department character varying(255),
        status enum_trainingregistar_status,
        people integer,
        "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
        "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
        description character varying(255),
        CONSTRAINT trainingregistar_pkey PRIMARY KEY (id)
      );`
    ].map(query => sequelize.query(query, { transaction })));

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".projects_members
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
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".vendors_projects
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
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".projectrisks
    (
      id serial NOT NULL,
      project_id integer NOT NULL,
      risk_name character varying(255) NOT NULL,
      risk_owner integer,
      ai_lifecycle_phase enum_projectrisks_ai_lifecycle_phase NOT NULL,
      risk_description text NOT NULL,
      risk_category enum_projectrisks_risk_category NOT NULL,
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
      CONSTRAINT projectrisks_pkey PRIMARY KEY (id),
      CONSTRAINT projectrisks_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES "${tenantHash}".projects (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT projectrisks_risk_owner_fkey FOREIGN KEY (risk_owner)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL,
      CONSTRAINT projectrisks_risk_approval_fkey FOREIGN KEY (risk_approval)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".files
    (
      id serial NOT NULL,
      filename character varying(255) NOT NULL,
      content bytea NOT NULL,
      project_id integer NOT NULL,
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
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".projects_frameworks
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
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".assessments
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
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".projectscopes
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
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".vendorrisks
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
      CONSTRAINT vendorrisks_pkey PRIMARY KEY (id),
      CONSTRAINT vendorrisks_vendor_id_fkey FOREIGN KEY (vendor_id)
        REFERENCES "${tenantHash}".vendors (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT vendorrisks_action_owner_fkey FOREIGN KEY (action_owner)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE SET NULL
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".model_data
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
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".fairness_runs
    (
      id serial NOT NULL,
      data_id integer NOT NULL,
      metrics jsonb NOT NULL,
      CONSTRAINT fairness_runs_pkey PRIMARY KEY (id),
      CONSTRAINT fairness_runs_data_id_fkey FOREIGN KEY (data_id)
        REFERENCES "${tenantHash}".model_data (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".controlcategories_struct_eu
    (
      id serial NOT NULL,
      title text NOT NULL,
      order_no integer,
      framework_id integer NOT NULL,
      CONSTRAINT controlcategories_struct_eu_pkey PRIMARY KEY (id),
      CONSTRAINT controlcategories_struct_eu_framework_id_fkey FOREIGN KEY (framework_id)
        REFERENCES public.frameworks (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".controls_struct_eu
    (
      id serial NOT NULL,
      title text NOT NULL,
      description text NOT NULL,
      order_no integer,
      control_category_id integer NOT NULL,
      CONSTRAINT controls_struct_eu_pkey PRIMARY KEY (id),
      CONSTRAINT controls_struct_eu_control_category_id_fkey FOREIGN KEY (control_category_id)
        REFERENCES "${tenantHash}".controlcategories_struct_eu (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".subcontrols_struct_eu
    (
      id serial NOT NULL,
      title text NOT NULL,
      description text NOT NULL,
      order_no integer,
      control_id integer NOT NULL,
      CONSTRAINT subcontrols_struct_eu_pkey PRIMARY KEY (id),
      CONSTRAINT subcontrols_struct_eu_control_id_fkey FOREIGN KEY (control_id)
        REFERENCES "${tenantHash}".controls_struct_eu (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".topics_struct_eu
    (
      id serial NOT NULL,
      title text,
      order_no integer,
      framework_id integer NOT NULL,
      CONSTRAINT topics_struct_eu_pkey PRIMARY KEY (id),
      CONSTRAINT topics_struct_eu_framework_id_fkey FOREIGN KEY (framework_id)
        REFERENCES public.frameworks (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".subtopics_struct_eu
    (
      id serial NOT NULL,
      title text NOT NULL,
      order_no integer,
      topic_id integer NOT NULL,
      CONSTRAINT subtopics_struct_eu_pkey PRIMARY KEY (id),
      CONSTRAINT subtopics_struct_eu_topic_id_fkey FOREIGN KEY (topic_id)
        REFERENCES "${tenantHash}".topics_struct_eu (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".questions_struct_eu
    (
      id serial NOT NULL,
      order_no integer,
      question text NOT NULL,
      hint text NOT NULL,
      priority_level enum_questions_priority_level NOT NULL,
      answer_type character varying(255) NOT NULL,
      input_type character varying(255) NOT NULL,
      evidence_required boolean NOT NULL,
      is_required boolean NOT NULL,
      subtopic_id integer NOT NULL,
      CONSTRAINT questions_struct_eu_pkey PRIMARY KEY (id),
      CONSTRAINT questions_struct_eu_subtopic_id_fkey FOREIGN KEY (subtopic_id)
        REFERENCES "${tenantHash}".subtopics_struct_eu (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".clauses_struct_iso
    (
      id serial NOT NULL,
      title character varying(255) NOT NULL,
      clause_no integer NOT NULL,
      framework_id integer,
      CONSTRAINT clauses_struct_iso_pkey PRIMARY KEY (id),
      CONSTRAINT clauses_struct_iso_framework_id_fkey FOREIGN KEY (framework_id)
        REFERENCES public.frameworks (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".subclauses_struct_iso
    (
      id serial NOT NULL,
      title character varying(255) NOT NULL,
      order_no integer NOT NULL,
      summary text,
      questions text[],
      evidence_examples text[],
      clause_id integer,
      CONSTRAINT subclauses_struct_iso_pkey PRIMARY KEY (id),
      CONSTRAINT subclauses_struct_iso_clause_id_fkey FOREIGN KEY (clause_id)
        REFERENCES "${tenantHash}".clauses_struct_iso (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".annex_struct_iso
    (
      id serial NOT NULL,
      title character varying(255) NOT NULL,
      annex_no integer NOT NULL,
      framework_id integer,
      CONSTRAINT annex_struct_iso_pkey PRIMARY KEY (id),
      CONSTRAINT annex_struct_iso_framework_id_fkey FOREIGN KEY (framework_id)
        REFERENCES public.frameworks (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".annexcategories_struct_iso
    (
      id serial NOT NULL,
      title character varying(255) NOT NULL,
      description text,
      guidance text,
      sub_id integer,
      order_no integer NOT NULL,
      annex_id integer,
      CONSTRAINT annexcategories_struct_iso_pkey PRIMARY KEY (id),
      CONSTRAINT annexcategories_struct_iso_annex_id_fkey FOREIGN KEY (annex_id)
        REFERENCES "${tenantHash}".annex_struct_iso (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".controls_eu
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
        REFERENCES "${tenantHash}".controls_struct_eu (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT controls_eu_projects_frameworks_id_fkey FOREIGN KEY (projects_frameworks_id)
        REFERENCES "${tenantHash}".projects_frameworks (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".subcontrols_eu
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
        REFERENCES "${tenantHash}".subcontrols_struct_eu (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".answers_eu
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
        REFERENCES "${tenantHash}".questions_struct_eu (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".subclauses_iso
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
        REFERENCES "${tenantHash}".subclauses_struct_iso (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT subclauses_iso_projects_frameworks_id_fkey FOREIGN KEY (projects_frameworks_id)
        REFERENCES "${tenantHash}".projects_frameworks (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".annexcategories_iso
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
        REFERENCES "${tenantHash}".annexcategories_struct_iso (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });

    await sequelize.query(`CREATE TABLE IF NOT EXISTS "${tenantHash}".annexcategories_iso__risks
    (
      annexcategory_id integer,
      projects_risks_id integer NOT NULL,
      CONSTRAINT annexcategories_iso__risks_pkey PRIMARY KEY (projects_risks_id),
      CONSTRAINT annexcategories_iso__risks_annexcategory_id_fkey FOREIGN KEY (annexcategory_id)
        REFERENCES "${tenantHash}".annexcategories_iso (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE,
      CONSTRAINT annexcategories_iso__risks_projects_risks_id_fkey FOREIGN KEY (projects_risks_id)
        REFERENCES "${tenantHash}".projectrisks (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE CASCADE
    );`, { transaction });
  }
  catch (error) {
    throw error;
  }
}