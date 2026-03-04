'use strict';

/**
 * Public Schema Tables Migration (Idempotent)
 *
 * Works for BOTH fresh installations AND existing databases.
 * Every operation is idempotent - safe to run multiple times.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 Ensuring public schema tables exist...');

    // Helper to add column if not exists
    const addColumnIfNotExists = async (table, column, definition) => {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = '${table}' AND column_name = '${column}'
          ) THEN
            ALTER TABLE ${table} ADD COLUMN ${column} ${definition};
          END IF;
        END $$;
      `);
    };

    // Helper to add constraint if not exists
    const addConstraintIfNotExists = async (table, constraintName, definition) => {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = '${constraintName}'
          ) THEN
            ALTER TABLE ${table} ADD CONSTRAINT ${constraintName} ${definition};
          END IF;
        END $$;
      `);
    };

    // ========================================
    // ORGANIZATIONS
    // ========================================
    console.log('📋 Ensuring organizations table...');

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        logo TEXT,
        tenant_id VARCHAR(20) UNIQUE,
        onboarding_status VARCHAR(50) DEFAULT 'pending',
        subscription_id INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await addColumnIfNotExists('organizations', 'logo', 'TEXT');
    await addColumnIfNotExists('organizations', 'tenant_id', 'VARCHAR(20) UNIQUE');
    await addColumnIfNotExists('organizations', 'onboarding_status', "VARCHAR(50) DEFAULT 'pending'");
    await addColumnIfNotExists('organizations', 'subscription_id', 'INTEGER');
    await addColumnIfNotExists('organizations', 'updated_at', 'TIMESTAMP DEFAULT NOW()');

    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_organizations_tenant_id ON organizations(tenant_id);`);

    // NOTE: roles table is created by 20260226234300-base-enums-and-roles.js
    // Do not create or modify it here

    // ========================================
    // USERS
    // ========================================
    console.log('📋 Ensuring users table...');

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        surname VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255),
        role INTEGER REFERENCES roles(id),
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        profile_photo TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_login TIMESTAMP,
        is_demo BOOLEAN DEFAULT false
      );
    `);

    await addColumnIfNotExists('users', 'surname', 'VARCHAR(255)');
    await addColumnIfNotExists('users', 'profile_photo', 'TEXT');
    await addColumnIfNotExists('users', 'last_login', 'TIMESTAMP');
    await addColumnIfNotExists('users', 'is_demo', 'BOOLEAN DEFAULT false');

    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);`);

    // ========================================
    // TIERS & SUBSCRIPTIONS
    // ========================================
    console.log('📋 Ensuring tiers and subscriptions tables...');

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS tiers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price_monthly DECIMAL(10, 2),
        price_yearly DECIMAL(10, 2),
        features JSONB DEFAULT '[]',
        max_users INTEGER,
        max_projects INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Ensure name column can hold values and has unique constraint
    await queryInterface.sequelize.query(`ALTER TABLE tiers ALTER COLUMN name TYPE VARCHAR(255);`);

    // Drop legacy check constraint that may block new tier names
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE tiers DROP CONSTRAINT IF EXISTS tiers_name_check;
      EXCEPTION WHEN undefined_object THEN null;
      END $$;
    `);

    await addColumnIfNotExists('tiers', 'description', 'TEXT');
    await addColumnIfNotExists('tiers', 'price_monthly', 'DECIMAL(10, 2)');
    await addColumnIfNotExists('tiers', 'price_yearly', 'DECIMAL(10, 2)');
    await addColumnIfNotExists('tiers', 'features', "JSONB DEFAULT '[]'");
    await addColumnIfNotExists('tiers', 'max_users', 'INTEGER');
    await addColumnIfNotExists('tiers', 'max_projects', 'INTEGER');
    await addColumnIfNotExists('tiers', 'is_active', 'BOOLEAN DEFAULT true');
    await addConstraintIfNotExists('tiers', 'tiers_name_unique', 'UNIQUE (name)');

    // Insert default tiers (now constraint exists)
    await queryInterface.sequelize.query(`
      INSERT INTO tiers (name, description, features, max_users, max_projects) VALUES
        ('Free', 'Free tier with limited features', '["basic_compliance"]', 3, 1),
        ('Professional', 'Professional tier for small teams', '["basic_compliance", "advanced_reporting", "integrations"]', 10, 5),
        ('Enterprise', 'Enterprise tier with all features', '["basic_compliance", "advanced_reporting", "integrations", "sso", "audit_logs", "custom_frameworks"]', NULL, NULL)
      ON CONFLICT (name) DO NOTHING;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        tier_id INTEGER REFERENCES tiers(id),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        start_date TIMESTAMP NOT NULL DEFAULT NOW(),
        end_date TIMESTAMP,
        billing_cycle VARCHAR(20) DEFAULT 'monthly',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS subscription_history (
        id SERIAL PRIMARY KEY,
        subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        old_tier_id INTEGER REFERENCES tiers(id),
        new_tier_id INTEGER REFERENCES tiers(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Add FK from organizations to subscriptions
    await addConstraintIfNotExists('organizations', 'fk_organizations_subscription',
      'FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL');

    // ========================================
    // FRAMEWORKS
    // ========================================
    console.log('📋 Ensuring frameworks table...');

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS frameworks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        version VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        is_demo BOOLEAN DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await addColumnIfNotExists('frameworks', 'description', 'TEXT');
    await addColumnIfNotExists('frameworks', 'version', 'VARCHAR(50)');
    await addColumnIfNotExists('frameworks', 'is_active', 'BOOLEAN DEFAULT true');
    await addColumnIfNotExists('frameworks', 'is_demo', 'BOOLEAN DEFAULT false');
    await addColumnIfNotExists('frameworks', 'created_at', 'TIMESTAMP DEFAULT NOW()');

    await queryInterface.sequelize.query(`
      INSERT INTO frameworks (id, name, description, version) VALUES
        (1, 'EU AI Act', 'European Union Artificial Intelligence Act', '1.0'),
        (2, 'ISO 42001', 'AI Management System Standard', '2023'),
        (3, 'ISO 27001', 'Information Security Management', '2022'),
        (4, 'NIST AI RMF', 'NIST AI Risk Management Framework', '1.0')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Reset sequence to max id
    await queryInterface.sequelize.query(`
      SELECT setval('frameworks_id_seq', COALESCE((SELECT MAX(id) FROM frameworks), 1));
    `);

    // ========================================
    // EU AI ACT STRUCTURE TABLES
    // ========================================
    console.log('📋 Ensuring EU AI Act structure tables...');

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS topics_struct_eu (
        id SERIAL PRIMARY KEY,
        framework_id INTEGER NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        order_no INTEGER,
        is_demo BOOLEAN DEFAULT false
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS subtopics_struct_eu (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER REFERENCES topics_struct_eu(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        order_no INTEGER,
        is_demo BOOLEAN DEFAULT false
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS questions_struct_eu (
        id SERIAL PRIMARY KEY,
        subtopic_id INTEGER REFERENCES subtopics_struct_eu(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        hint TEXT,
        priority_level VARCHAR(50),
        answer_type VARCHAR(50) DEFAULT 'Long text',
        input_type VARCHAR(50),
        dropdown_options TEXT[],
        is_demo BOOLEAN DEFAULT false
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS controlcategories_struct_eu (
        id SERIAL PRIMARY KEY,
        framework_id INTEGER NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        order_no INTEGER,
        is_demo BOOLEAN DEFAULT false
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS controls_struct_eu (
        id SERIAL PRIMARY KEY,
        control_category_id INTEGER REFERENCES controlcategories_struct_eu(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        order_no INTEGER,
        is_demo BOOLEAN DEFAULT false
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS subcontrols_struct_eu (
        id SERIAL PRIMARY KEY,
        control_id INTEGER REFERENCES controls_struct_eu(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        order_no INTEGER,
        is_demo BOOLEAN DEFAULT false
      );
    `);

    // ========================================
    // ISO 42001 STRUCTURE TABLES
    // ========================================
    console.log('📋 Ensuring ISO 42001 structure tables...');

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS clauses_struct_iso (
        id SERIAL PRIMARY KEY,
        framework_id INTEGER NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
        clause_id VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        order_no INTEGER,
        is_demo BOOLEAN DEFAULT false
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS subclauses_struct_iso (
        id SERIAL PRIMARY KEY,
        clause_id INTEGER REFERENCES clauses_struct_iso(id) ON DELETE CASCADE,
        subclause_id VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        guidance TEXT,
        order_no INTEGER,
        is_demo BOOLEAN DEFAULT false
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS annexcategories_struct_iso (
        id SERIAL PRIMARY KEY,
        framework_id INTEGER NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
        annex_id VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        order_no INTEGER,
        is_demo BOOLEAN DEFAULT false
      );
    `);

    // ========================================
    // ISO 27001 STRUCTURE TABLES
    // ========================================
    console.log('📋 Ensuring ISO 27001 structure tables...');

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS clauses_struct_iso27001 (
        id SERIAL PRIMARY KEY,
        framework_id INTEGER NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
        clause_id VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        order_no INTEGER,
        is_demo BOOLEAN DEFAULT false
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS subclauses_struct_iso27001 (
        id SERIAL PRIMARY KEY,
        clause_id INTEGER REFERENCES clauses_struct_iso27001(id) ON DELETE CASCADE,
        subclause_id VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        guidance TEXT,
        order_no INTEGER,
        is_demo BOOLEAN DEFAULT false
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS annexcategories_struct_iso27001 (
        id SERIAL PRIMARY KEY,
        framework_id INTEGER NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
        annex_id VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        order_no INTEGER,
        is_demo BOOLEAN DEFAULT false
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS annexcontrols_struct_iso27001 (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES annexcategories_struct_iso27001(id) ON DELETE CASCADE,
        control_id VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        guidance TEXT,
        order_no INTEGER,
        is_demo BOOLEAN DEFAULT false
      );
    `);

    // ========================================
    // FILES AND FILE LINKS
    // ========================================
    console.log('📋 Ensuring files tables...');

    // Drop and recreate to ensure correct schema
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS file_entity_links CASCADE`);
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS files CASCADE`);

    await queryInterface.sequelize.query(`
      CREATE TABLE files (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        content BYTEA,
        project_id INTEGER,
        uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        uploaded_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
        is_demo BOOLEAN NOT NULL DEFAULT false,
        source VARCHAR(255),
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

    await queryInterface.sequelize.query(`CREATE INDEX idx_files_org ON files(organization_id);`);
    await queryInterface.sequelize.query(`CREATE INDEX idx_files_project ON files(project_id);`);

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

    await queryInterface.sequelize.query(`CREATE INDEX idx_file_entity_links_org ON file_entity_links(organization_id);`);
    await queryInterface.sequelize.query(`CREATE INDEX idx_file_entity_links_file ON file_entity_links(file_id);`);

    // ========================================
    // NIST AI RMF STRUCTURE TABLES
    // ========================================
    console.log('📋 Ensuring NIST AI RMF structure tables...');

    // nist_ai_rmf_categories_struct - static category data
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS nist_ai_rmf_categories_struct (
        id SERIAL PRIMARY KEY,
        framework_id INTEGER NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
        function VARCHAR(20) NOT NULL,
        category_id INTEGER NOT NULL,
        description TEXT,
        order_no INTEGER,
        is_demo BOOLEAN DEFAULT false,
        UNIQUE(function, category_id)
      );
    `);

    // nist_ai_rmf_subcategories_struct - static subcategory data
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS nist_ai_rmf_subcategories_struct (
        id SERIAL PRIMARY KEY,
        category_struct_id INTEGER NOT NULL REFERENCES nist_ai_rmf_categories_struct(id) ON DELETE CASCADE,
        function VARCHAR(20) NOT NULL,
        subcategory_id DECIMAL(4,1) NOT NULL,
        description TEXT,
        order_no INTEGER,
        is_demo BOOLEAN DEFAULT false,
        UNIQUE(function, subcategory_id)
      );
    `);

    // ========================================
    // NIST AI RMF IMPLEMENTATION TABLES
    // ========================================
    console.log('📋 Ensuring NIST AI RMF implementation tables...');

    // nist_ai_rmf_subcategories - per-project implementation records
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS nist_ai_rmf_subcategories (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        implementation_description TEXT,
        status VARCHAR(50) DEFAULT 'Not started',
        owner INTEGER REFERENCES users(id) ON DELETE SET NULL,
        reviewer INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approver INTEGER REFERENCES users(id) ON DELETE SET NULL,
        due_date DATE,
        auditor_feedback TEXT,
        subcategory_meta_id INTEGER REFERENCES nist_ai_rmf_subcategories_struct(id) ON DELETE CASCADE,
        projects_frameworks_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        is_demo BOOLEAN DEFAULT FALSE
      );
    `);

    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_nist_subcat_org ON nist_ai_rmf_subcategories(organization_id);`);
    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_nist_subcat_meta ON nist_ai_rmf_subcategories(subcategory_meta_id);`);
    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_nist_subcat_pf ON nist_ai_rmf_subcategories(projects_frameworks_id);`);

    // nist_ai_rmf_subcategories__risks - risk linking
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS nist_ai_rmf_subcategories__risks (
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        nist_ai_rmf_subcategory_id INTEGER NOT NULL REFERENCES nist_ai_rmf_subcategories(id) ON DELETE CASCADE,
        projects_risks_id INTEGER NOT NULL,
        PRIMARY KEY (nist_ai_rmf_subcategory_id, projects_risks_id)
      );
    `);

    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_nist_risks_org ON nist_ai_rmf_subcategories__risks(organization_id);`);

    // ========================================
    // CUSTOM FRAMEWORK TABLES (for plugins)
    // ========================================
    console.log('📋 Ensuring custom framework tables...');

    // ---- Struct tables (shared, no organization_id) ----

    // custom_framework_definitions - one row per plugin_key
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS custom_framework_definitions (
        id SERIAL PRIMARY KEY,
        plugin_key VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        version VARCHAR(50) DEFAULT '1.0.0',
        is_organizational BOOLEAN DEFAULT FALSE,
        hierarchy_type VARCHAR(50) NOT NULL DEFAULT 'two_level',
        level_1_name VARCHAR(100) NOT NULL DEFAULT 'Category',
        level_2_name VARCHAR(100) NOT NULL DEFAULT 'Control',
        level_3_name VARCHAR(100),
        file_source VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cfd_plugin_key ON custom_framework_definitions(plugin_key);`);

    // custom_framework_level1_struct
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS custom_framework_level1_struct (
        id SERIAL PRIMARY KEY,
        definition_id INTEGER NOT NULL REFERENCES custom_framework_definitions(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        order_no INTEGER NOT NULL DEFAULT 1,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cfl1s_definition ON custom_framework_level1_struct(definition_id);`);

    // custom_framework_level2_struct
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS custom_framework_level2_struct (
        id SERIAL PRIMARY KEY,
        level1_id INTEGER NOT NULL REFERENCES custom_framework_level1_struct(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        order_no INTEGER NOT NULL DEFAULT 1,
        summary TEXT,
        questions TEXT[],
        evidence_examples TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cfl2s_level1 ON custom_framework_level2_struct(level1_id);`);

    // custom_framework_level3_struct
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS custom_framework_level3_struct (
        id SERIAL PRIMARY KEY,
        level2_id INTEGER NOT NULL REFERENCES custom_framework_level2_struct(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        order_no INTEGER NOT NULL DEFAULT 1,
        summary TEXT,
        questions TEXT[],
        evidence_examples TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cfl3s_level2 ON custom_framework_level3_struct(level2_id);`);

    // ---- Per-org tables ----

    // custom_frameworks - per-org record with definition_id FK
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS custom_frameworks (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        definition_id INTEGER REFERENCES custom_framework_definitions(id),
        plugin_key VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        version VARCHAR(50) DEFAULT '1.0.0',
        is_organizational BOOLEAN DEFAULT FALSE,
        hierarchy_type VARCHAR(50) NOT NULL DEFAULT 'two_level',
        level_1_name VARCHAR(100) NOT NULL DEFAULT 'Category',
        level_2_name VARCHAR(100) NOT NULL DEFAULT 'Control',
        level_3_name VARCHAR(100),
        file_source VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cf_org_id ON custom_frameworks(organization_id);`);
    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cf_plugin_key ON custom_frameworks(plugin_key);`);
    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cf_definition_id ON custom_frameworks(definition_id);`);

    // custom_framework_projects - project-framework association
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS custom_framework_projects (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        framework_id INTEGER NOT NULL REFERENCES custom_frameworks(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(organization_id, framework_id, project_id)
      );
    `);

    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cf_projects_org ON custom_framework_projects(organization_id);`);

    // custom_framework_level2_impl - level 2 implementation records (FK to struct)
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS custom_framework_level2_impl (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        level2_id INTEGER NOT NULL REFERENCES custom_framework_level2_struct(id) ON DELETE CASCADE,
        project_framework_id INTEGER NOT NULL REFERENCES custom_framework_projects(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'Not started',
        owner INTEGER,
        reviewer INTEGER,
        approver INTEGER,
        due_date DATE,
        implementation_details TEXT,
        evidence_links JSONB DEFAULT '[]',
        feedback_links JSONB DEFAULT '[]',
        auditor_feedback TEXT,
        is_demo BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cf_level2_impl_org ON custom_framework_level2_impl(organization_id);`);
    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cf_level2_impl_l2 ON custom_framework_level2_impl(level2_id);`);
    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cf_level2_impl_pf ON custom_framework_level2_impl(project_framework_id);`);

    // custom_framework_level3_impl - level 3 implementation records (FK to struct)
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS custom_framework_level3_impl (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        level3_id INTEGER NOT NULL REFERENCES custom_framework_level3_struct(id) ON DELETE CASCADE,
        level2_impl_id INTEGER NOT NULL REFERENCES custom_framework_level2_impl(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'Not started',
        owner INTEGER,
        reviewer INTEGER,
        approver INTEGER,
        due_date DATE,
        implementation_details TEXT,
        evidence_links JSONB DEFAULT '[]',
        feedback_links JSONB DEFAULT '[]',
        auditor_feedback TEXT,
        is_demo BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cf_level3_impl_org ON custom_framework_level3_impl(organization_id);`);
    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cf_level3_impl_l3 ON custom_framework_level3_impl(level3_id);`);
    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cf_level3_impl_l2impl ON custom_framework_level3_impl(level2_impl_id);`);

    // custom_framework_level2_risks - risk linking for level 2
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS custom_framework_level2_risks (
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        level2_impl_id INTEGER NOT NULL REFERENCES custom_framework_level2_impl(id) ON DELETE CASCADE,
        risk_id INTEGER NOT NULL,
        PRIMARY KEY (level2_impl_id, risk_id)
      );
    `);

    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cf_l2_risks_org ON custom_framework_level2_risks(organization_id);`);

    // custom_framework_level3_risks - risk linking for level 3
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS custom_framework_level3_risks (
        organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        level3_impl_id INTEGER NOT NULL REFERENCES custom_framework_level3_impl(id) ON DELETE CASCADE,
        risk_id INTEGER NOT NULL,
        PRIMARY KEY (level3_impl_id, risk_id)
      );
    `);

    await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cf_l3_risks_org ON custom_framework_level3_risks(organization_id);`);

    // ========================================
    // AUTOMATION DEFINITIONS
    // ========================================
    console.log('📋 Ensuring automation definition tables...');

    // Note: Existing schema uses 'key' column instead of 'name'
    const [triggersExists] = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'automation_triggers'
      ) as exists;
    `);

    if (!triggersExists[0].exists) {
      // Fresh install - create with new schema
      await queryInterface.sequelize.query(`
        CREATE TABLE automation_triggers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          entity_type VARCHAR(100),
          trigger_type VARCHAR(100) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      await queryInterface.sequelize.query(`
        INSERT INTO automation_triggers (name, description, entity_type, trigger_type) VALUES
          ('vendor_review_due', 'Triggered when vendor review date approaches', 'vendor', 'scheduled'),
          ('policy_due_soon', 'Triggered when policy review date approaches', 'policy', 'scheduled'),
          ('risk_created', 'Triggered when a new risk is created', 'risk', 'entity_created'),
          ('risk_updated', 'Triggered when a risk is updated', 'risk', 'entity_updated'),
          ('model_deployed', 'Triggered when a model is deployed', 'model', 'entity_updated'),
          ('task_overdue', 'Triggered when a task becomes overdue', 'task', 'scheduled'),
          ('vendor_created', 'Triggered when a new vendor is created', 'vendor', 'entity_created'),
          ('project_created', 'Triggered when a new project is created', 'project', 'entity_created'),
          ('scheduled_report', 'Triggered on a schedule for report generation', 'report', 'scheduled')
        ON CONFLICT DO NOTHING;
      `);
    }

    const [actionsExists] = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'automation_actions'
      ) as exists;
    `);

    if (!actionsExists[0].exists) {
      await queryInterface.sequelize.query(`
        CREATE TABLE automation_actions (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          action_type VARCHAR(100) NOT NULL,
          required_params JSONB DEFAULT '[]',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      await queryInterface.sequelize.query(`
        INSERT INTO automation_actions (name, description, action_type, required_params) VALUES
          ('send_email', 'Send email notification', 'notification', '["to", "subject", "template"]'),
          ('send_slack_message', 'Send Slack message', 'notification', '["webhook_id", "message"]'),
          ('create_task', 'Create a new task', 'entity_action', '["title", "description"]'),
          ('update_status', 'Update entity status', 'entity_action', '["status"]'),
          ('send_in_app_notification', 'Send in-app notification', 'notification', '["user_ids", "message"]'),
          ('generate_report', 'Generate a report', 'report', '["report_type", "format"]')
        ON CONFLICT DO NOTHING;
      `);
    }

    // ========================================
    // MIGRATION STATUS TABLE
    // ========================================
    console.log('📋 Ensuring migration_status table...');

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS migration_status (
        id SERIAL PRIMARY KEY,
        migration_key VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        organizations_migrated INTEGER DEFAULT 0,
        organizations_total INTEGER DEFAULT 0,
        current_organization_id INTEGER,
        current_table VARCHAR(100),
        error_message TEXT,
        validation_report JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_migration_status_key ON migration_status(migration_key);
    `);

    // ========================================
    // HELPER FUNCTION FOR TIMESTAMPS
    // ========================================
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_evaluation_llm_api_keys_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Public schema tables ready!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back public schema tables...');

    // NOTE: roles table is NOT included - it's managed by 20260226234300-base-enums-and-roles.js
    // Tables in reverse dependency order
    const tables = [
      'migration_status',
      'automation_actions',
      'automation_triggers',
      // Custom framework tables (reverse dependency order)
      'custom_framework_level3_risks',
      'custom_framework_level2_risks',
      'custom_framework_level3_impl',
      'custom_framework_level2_impl',
      'custom_framework_projects',
      'custom_frameworks',
      // Struct tables (shared)
      'custom_framework_level3_struct',
      'custom_framework_level2_struct',
      'custom_framework_level1_struct',
      'custom_framework_definitions',
      // File tables (reverse order)
      'file_entity_links',
      'files',
      // NIST implementation tables
      'nist_ai_rmf_subcategories__risks',
      'nist_ai_rmf_subcategories',
      // NIST struct tables
      'nist_ai_rmf_subcategories_struct',
      'nist_ai_rmf_categories_struct',
      // ISO 27001 struct tables
      'annexcontrols_struct_iso27001',
      'annexcategories_struct_iso27001',
      'subclauses_struct_iso27001',
      'clauses_struct_iso27001',
      // ISO 42001 struct tables
      'annexcategories_struct_iso',
      'subclauses_struct_iso',
      'clauses_struct_iso',
      // EU AI Act struct tables
      'subcontrols_struct_eu',
      'controls_struct_eu',
      'controlcategories_struct_eu',
      'questions_struct_eu',
      'subtopics_struct_eu',
      'topics_struct_eu',
      // Core tables
      'frameworks',
      'subscription_history',
      'subscriptions',
      'tiers',
      'users',
      'organizations',
    ];

    for (const table of tables) {
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
    }

    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS update_evaluation_llm_api_keys_updated_at();
    `);

    console.log('✅ Rollback completed!');
  }
};
