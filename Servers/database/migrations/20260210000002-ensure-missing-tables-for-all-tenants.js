"use strict";

/**
 * Migration: Ensure all missing tables exist for all tenants
 *
 * This migration ensures that all tables added to createNewTenant.ts exist for
 * tenants that may have been created before these tables were added.
 *
 * Tables covered:
 * - file_entity_links
 * - file_change_history
 * - notifications (with enums)
 * - entity_graph_annotations
 * - entity_graph_views
 * - entity_graph_gap_rules
 * - ai_incident_managements (with sequence)
 * - bias_fairness_evaluations
 * - mlflow_integrations
 * - mlflow_model_records
 * - evaluation_llm_api_keys
 */

const { getTenantHash } = require("../../dist/tools/getTenantHash");

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all organizations
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      if (organizations.length === 0) {
        console.log("No organizations found. Skipping migration.");
        await transaction.commit();
        return;
      }

      // Create global trigger function if it doesn't exist
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_evaluation_llm_api_keys_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `, { transaction });

      for (const org of organizations) {
        const tenantHash = getTenantHash(org.id);
        console.log(`Processing tenant: ${tenantHash}`);

        // Check if schema exists
        const [schemaExists] = await queryInterface.sequelize.query(
          `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${tenantHash}'`,
          { transaction }
        );

        if (schemaExists.length === 0) {
          console.log(`Schema ${tenantHash} does not exist, skipping...`);
          continue;
        }

        // Check if files table exists (required for file_entity_links and file_change_history)
        const [filesTableExists] = await queryInterface.sequelize.query(
          `SELECT table_name FROM information_schema.tables
           WHERE table_schema = '${tenantHash}' AND table_name = 'files'`,
          { transaction }
        );

        if (filesTableExists.length > 0) {
          // ── file_entity_links ──
          await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS "${tenantHash}".file_entity_links (
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
            );
          `, { transaction });

          await queryInterface.sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_file_entity_links_file_id ON "${tenantHash}".file_entity_links(file_id);
          `, { transaction });
          await queryInterface.sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_file_entity_links_entity ON "${tenantHash}".file_entity_links(framework_type, entity_type, entity_id);
          `, { transaction });
          await queryInterface.sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_file_entity_links_project ON "${tenantHash}".file_entity_links(project_id);
          `, { transaction });

          // ── file_change_history ──
          await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS "${tenantHash}".file_change_history (
              id SERIAL PRIMARY KEY,
              file_id INTEGER NOT NULL REFERENCES "${tenantHash}".files(id) ON DELETE CASCADE,
              action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
              field_name VARCHAR(255),
              old_value TEXT,
              new_value TEXT,
              changed_by_user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
              changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
              created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
          `, { transaction });

          await queryInterface.sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_file_change_history_file_id ON "${tenantHash}".file_change_history(file_id);
          `, { transaction });
          await queryInterface.sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_file_change_history_changed_at ON "${tenantHash}".file_change_history(changed_at DESC);
          `, { transaction });
          await queryInterface.sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_file_change_history_file_changed ON "${tenantHash}".file_change_history(file_id, changed_at DESC);
          `, { transaction });

          console.log(`  ✅ Created file_entity_links and file_change_history for ${tenantHash}`);
        }

        // ── Notifications ──
        // Create notification type enum
        await queryInterface.sequelize.query(`
          DO $$ BEGIN
            CREATE TYPE "${tenantHash}".enum_notification_type AS ENUM (
              'task_assigned', 'task_completed', 'review_requested', 'review_approved',
              'review_rejected', 'approval_requested', 'approval_approved', 'approval_rejected',
              'approval_complete', 'policy_due_soon', 'policy_overdue', 'training_assigned',
              'training_completed', 'vendor_review_due', 'file_uploaded', 'comment_added',
              'mention', 'system'
            );
          EXCEPTION WHEN duplicate_object THEN null;
          END $$;
        `, { transaction });

        // Create entity type enum for notifications
        await queryInterface.sequelize.query(`
          DO $$ BEGIN
            CREATE TYPE "${tenantHash}".enum_notification_entity_type AS ENUM (
              'project', 'task', 'policy', 'vendor', 'model', 'training',
              'file', 'use_case', 'risk', 'assessment', 'comment', 'user'
            );
          EXCEPTION WHEN duplicate_object THEN null;
          END $$;
        `, { transaction });

        await queryInterface.sequelize.query(`
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

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON "${tenantHash}".notifications(user_id);
        `, { transaction });
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON "${tenantHash}".notifications(user_id, is_read) WHERE is_read = FALSE;
        `, { transaction });
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON "${tenantHash}".notifications(created_at DESC);
        `, { transaction });
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_notifications_entity ON "${tenantHash}".notifications(entity_type, entity_id);
        `, { transaction });

        console.log(`  ✅ Created notifications table for ${tenantHash}`);

        // ── Entity Graph Tables ──
        const safeTenantName = tenantHash.replace(/[^a-z0-9]/g, "_");

        await queryInterface.sequelize.query(`
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

        await queryInterface.sequelize.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_annotations_user_entity_${safeTenantName}
          ON "${tenantHash}".entity_graph_annotations(user_id, entity_type, entity_id);
        `, { transaction });
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_annotations_user_${safeTenantName}
          ON "${tenantHash}".entity_graph_annotations(user_id, organization_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
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

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_views_user_${safeTenantName}
          ON "${tenantHash}".entity_graph_views(user_id, organization_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
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

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_gap_rules_org_${safeTenantName}
          ON "${tenantHash}".entity_graph_gap_rules(organization_id);
        `, { transaction });

        console.log(`  ✅ Created entity graph tables for ${tenantHash}`);

        // ── AI Incident Management ──
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

        await queryInterface.sequelize.query(`
          CREATE SEQUENCE IF NOT EXISTS "${tenantHash}".incident_id_seq START 1;
        `, { transaction });

        // Check if default is already set before altering
        try {
          await queryInterface.sequelize.query(`
            ALTER TABLE "${tenantHash}".ai_incident_managements
            ALTER COLUMN incident_id
            SET DEFAULT 'INC-' || nextval('"${tenantHash}".incident_id_seq');
          `, { transaction });
        } catch (e) {
          // Ignore if already set
        }

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_${tenantHash}_ai_incident_severity ON "${tenantHash}".ai_incident_managements(severity);
        `, { transaction });
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_${tenantHash}_ai_incident_status ON "${tenantHash}".ai_incident_managements(status);
        `, { transaction });
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_${tenantHash}_ai_incident_approval_status ON "${tenantHash}".ai_incident_managements(approval_status);
        `, { transaction });
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_${tenantHash}_ai_incident_created_at ON "${tenantHash}".ai_incident_managements(created_at);
        `, { transaction });

        console.log(`  ✅ Created ai_incident_managements table for ${tenantHash}`);

        // ── Bias and Fairness Evaluations ──
        await queryInterface.sequelize.query(`
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

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_${tenantHash}_bias_fairness_evaluations_status ON "${tenantHash}".bias_fairness_evaluations(status);
        `, { transaction });
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_${tenantHash}_bias_fairness_evaluations_eval_id ON "${tenantHash}".bias_fairness_evaluations(eval_id);
        `, { transaction });

        console.log(`  ✅ Created bias_fairness_evaluations table for ${tenantHash}`);

        // ── MLflow Integration Tables ──
        await queryInterface.sequelize.query(`
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

        await queryInterface.sequelize.query(`
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

        console.log(`  ✅ Created MLflow tables for ${tenantHash}`);

        // ── Evaluation LLM API Keys ──
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".evaluation_llm_api_keys (
            id SERIAL PRIMARY KEY,
            provider VARCHAR(50) NOT NULL UNIQUE,
            encrypted_api_key TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `, { transaction });

        // Create trigger if it doesn't exist
        try {
          await queryInterface.sequelize.query(`
            CREATE TRIGGER trg_${tenantHash}_update_evaluation_llm_api_keys_updated_at
            BEFORE UPDATE ON "${tenantHash}".evaluation_llm_api_keys
            FOR EACH ROW EXECUTE PROCEDURE update_evaluation_llm_api_keys_updated_at();
          `, { transaction });
        } catch (e) {
          // Trigger may already exist
        }

        console.log(`  ✅ Created evaluation_llm_api_keys table for ${tenantHash}`);
      }

      await transaction.commit();
      console.log("Migration completed successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("Migration failed:", error);
      throw error;
    }
  },

  async down(queryInterface) {
    // This migration is additive and idempotent.
    // Rolling back would potentially delete user data.
    // If rollback is needed, it should be done manually.
    console.log("Rollback not implemented for this migration to prevent data loss.");
    console.log("Tables created by this migration are safe to keep.");
  },
};
