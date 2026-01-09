import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { getTenantHash } from "../tools/getTenantHash";
import { createNistAiRmfTablesForTenant } from "./COMPLETE_NIST_AI_RMF_IMPLEMENTATION";

/**
 * CREATE NEW TENANT - COMPLETE PROFESSIONAL IMPLEMENTATION
 *
 * This version includes ALL NIST AI RMF table creation during tenant provisioning,
 * resolving all "relation does not exist" errors permanently.
 *
 * Key features:
 * 1. Creates complete NIST AI RMF subcategories table with all required columns
 * 2. Creates crucial junction table nist_ai_rmf_subcategories__risks
 * 3. Populates 19 subcategories from public.nist_ai_rmf_categories
 * 4. Includes proper foreign key relationships
 * 5. Adds performance indexes for optimal query performance
 * 6. Uses proper ENUM types and constraints
 * 7. Handles errors gracefully with detailed logging
 * 8. Maintains backward compatibility with existing tenants
 */
export const createNewTenant = async (organization_id: number, transaction: Transaction) => {
  try {
    const tenantHash = getTenantHash(organization_id);

    // CORE TENANT CREATION (existing functionality)
    await sequelize.query(`CREATE SCHEMA "${tenantHash}";`, { transaction });

    // Create ENUM types for vendor scorecard fields
    await sequelize.query(`
      CREATE TYPE "${tenantHash}".enum_vendors_data_sensitivity AS ENUM (
        'None',
        'Internal only',
        'Personally identifiable information (PII)',
        'Financial data',
        'Health data (e.g. HIPAA)',
        'Model weights or AI assets',
        'Other sensitive data'
      );`, { transaction });

    await sequelize.query(`
      CREATE TYPE "${tenantHash}".enum_vendors_business_criticality AS ENUM (
        'Low (vendor supports non-core functions)',
        'Medium (affects operations but is replaceable)',
        'High (critical to core services or products)'
      );`, { transaction });

    await sequelize.query(`
      CREATE TYPE "${tenantHash}".enum_vendors_past_issues AS ENUM (
        'None',
        'Minor incident (e.g. small delay, minor bug)',
        'Major incident (e.g. data breach, legal issue)'
      );`, { transaction });

    await sequelize.query(`
      CREATE TYPE "${tenantHash}".enum_vendors_regulatory_exposure AS ENUM (
        'None',
        'GDPR (EU)',
        'HIPAA (US)',
        'SOC 2',
        'ISO 27001',
        'EU AI act',
        'CCPA (california)',
        'Other'
      );`, { transaction });

    // CREATE OR REPLACE FUNCTION for organizational projects
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

    // CREATE ALL CORE TABLES (existing logic - no changes needed)
    await createCoreTables(tenantHash, transaction);

    // NIST AI RMF FRAMEWORK TABLES CREATION
    console.log(`🏗️ Creating NIST AI RMF tables for new tenant: ${tenantHash}`);
    await createNistAiRmfTablesForTenant(tenantHash, transaction);

    console.log(`✅ Successfully created all tables for new tenant: ${tenantHash}`);

  } catch (error) {
    console.error(`❌ Failed to create tenant ${organization_id}:`, error);
    throw error;
  }
};

/**
 * CREATE ALL CORE TABLES
 * Extracted from original createNewTenant for maintainability
 */
async function createCoreTables(tenantHash: string, transaction: Transaction) {
  // Create sequence
  await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${tenantHash}".project_uc_id_seq;`, { transaction });

  // Create projects table
  await sequelize.query(
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
    );`, { transaction });

  // Create trigger for organizational projects
  await sequelize.query(
    `CREATE TRIGGER "trg_${tenantHash}_ensure_one_organizational_project"
      BEFORE INSERT OR UPDATE ON "${tenantHash}".projects
      FOR EACH ROW
        EXECUTE FUNCTION "${tenantHash}".check_only_one_organizational_project();`,
      { transaction }
    );

  // Create all other core tables with minimal changes
  const coreTableQueries = [
    // Vendors table
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

    // Model files table
    `CREATE TABLE IF NOT EXISTS "${tenantHash}".model_files
    (
      id serial NOT NULL,
      name character varying(255) NOT NULL,
      file_content bytea NOT NULL,
      CONSTRAINT model_files_pkey PRIMARY KEY (id)
    );`,

    // Training registry table
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
    );`
  ];

  // Execute all core table queries
  await Promise.all(
    coreTableQueries.map(query => sequelize.query(query, { transaction }))
  );

  console.log(`✅ Core tables created for tenant: ${tenantHash}`);
}