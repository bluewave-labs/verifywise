'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration: Create EU AI Act Article 50 Compliance Tables
 *
 * Creates tables for:
 * - c2pa_manifests: C2PA Content Credentials manifest storage
 * - provenance_chains: Content provenance tracking
 * - robustness_test_results: Watermark robustness testing
 * - detection_confidence_log: Detection audit log
 *
 * Also updates watermark_jobs with new fields for compliance tracking.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        // ========================================================================
        // Table: c2pa_manifests
        // Stores C2PA Content Credentials manifest metadata
        // ========================================================================
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".c2pa_manifests (
            id SERIAL PRIMARY KEY,
            watermark_job_id INTEGER NOT NULL REFERENCES "${tenantHash}".watermark_jobs(id),

            -- Manifest Identification
            manifest_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
            instance_id VARCHAR(255) NOT NULL,

            -- Content Binding
            content_hash VARCHAR(128) NOT NULL,
            hash_algorithm VARCHAR(32) NOT NULL DEFAULT 'sha256',

            -- Claim Generator Info
            generator_name VARCHAR(255) NOT NULL DEFAULT 'VerifyWise',
            generator_version VARCHAR(50) NOT NULL,

            -- Digital Source Type (EU AI Act requirement)
            digital_source_type VARCHAR(255) NOT NULL
              DEFAULT 'http://c2pa.org/digitalsourcetype/trainedAlgorithmicData',

            -- AI-Specific Metadata
            ai_model_id INTEGER NULL,
            ai_model_name VARCHAR(255),
            ai_model_version VARCHAR(50),
            ai_provider VARCHAR(255),
            generation_prompt_hash VARCHAR(128),
            generation_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            -- Signature Information
            signature_algorithm VARCHAR(50) NOT NULL DEFAULT 'ES256',
            certificate_chain JSONB,
            signature_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            signature_valid BOOLEAN NOT NULL DEFAULT true,

            -- Training/Mining Assertions
            allow_training BOOLEAN NOT NULL DEFAULT false,
            allow_mining BOOLEAN NOT NULL DEFAULT false,

            -- Raw Manifest Data
            manifest_cbor BYTEA,
            manifest_json JSONB,

            -- Metadata
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT unique_watermark_manifest UNIQUE (watermark_job_id)
          );
        `, { transaction });

        // Indexes for c2pa_manifests
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_c2pa_manifests_manifest_id
          ON "${tenantHash}".c2pa_manifests(manifest_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_c2pa_manifests_content_hash
          ON "${tenantHash}".c2pa_manifests(content_hash);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_c2pa_manifests_ai_model_id
          ON "${tenantHash}".c2pa_manifests(ai_model_id);
        `, { transaction });

        // ========================================================================
        // Table: provenance_chains
        // Tracks content provenance for full audit trail
        // ========================================================================
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".provenance_chains (
            id SERIAL PRIMARY KEY,

            -- Chain Identification
            chain_id UUID NOT NULL DEFAULT gen_random_uuid(),
            asset_hash VARCHAR(128) NOT NULL,

            -- Chain Links
            parent_chain_id UUID,
            depth INTEGER NOT NULL DEFAULT 0,

            -- Source Information
            source_type VARCHAR(50) NOT NULL,
            source_manifest_id UUID,

            -- Actor Information
            actor_type VARCHAR(50) NOT NULL,
            actor_identifier VARCHAR(255),
            actor_organization VARCHAR(255),

            -- Action Details
            action_type VARCHAR(50) NOT NULL,
            action_description TEXT,
            action_parameters JSONB,
            action_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            -- Ingredient References
            ingredients JSONB,

            -- Verification Status
            verification_status VARCHAR(50) NOT NULL DEFAULT 'unverified',
            last_verified_at TIMESTAMPTZ,
            verification_notes TEXT,

            -- Metadata
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT unique_chain_asset UNIQUE (chain_id, asset_hash)
          );
        `, { transaction });

        // Indexes for provenance_chains
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_provenance_chains_chain_id
          ON "${tenantHash}".provenance_chains(chain_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_provenance_chains_asset_hash
          ON "${tenantHash}".provenance_chains(asset_hash);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_provenance_chains_parent_chain_id
          ON "${tenantHash}".provenance_chains(parent_chain_id);
        `, { transaction });

        // ========================================================================
        // Table: robustness_test_results
        // Stores watermark robustness testing results
        // ========================================================================
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".robustness_test_results (
            id SERIAL PRIMARY KEY,
            watermark_job_id INTEGER NOT NULL REFERENCES "${tenantHash}".watermark_jobs(id),

            -- Test Configuration
            test_suite_id UUID NOT NULL DEFAULT gen_random_uuid(),
            test_name VARCHAR(100) NOT NULL,
            test_category VARCHAR(50) NOT NULL,

            -- Transformation Parameters
            transformation_type VARCHAR(50) NOT NULL,
            transformation_params JSONB NOT NULL,

            -- Detection Results
            watermark_detected BOOLEAN NOT NULL,
            detection_confidence FLOAT NOT NULL,
            bit_accuracy FLOAT,

            -- Image Quality Metrics
            psnr FLOAT,
            ssim FLOAT,

            -- C2PA Manifest Survival
            manifest_intact BOOLEAN,
            manifest_verifiable BOOLEAN,

            -- Timing
            processing_time_ms INTEGER,

            -- Pass/Fail Status
            passed BOOLEAN NOT NULL,
            failure_reason TEXT,

            -- Metadata
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT unique_test_per_job UNIQUE (watermark_job_id, test_name)
          );
        `, { transaction });

        // Indexes for robustness_test_results
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_robustness_test_job_id
          ON "${tenantHash}".robustness_test_results(watermark_job_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_robustness_test_suite_id
          ON "${tenantHash}".robustness_test_results(test_suite_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_robustness_test_passed
          ON "${tenantHash}".robustness_test_results(passed);
        `, { transaction });

        // ========================================================================
        // Table: detection_confidence_log
        // Audit log for detection operations
        // ========================================================================
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".detection_confidence_log (
            id SERIAL PRIMARY KEY,
            watermark_job_id INTEGER NOT NULL REFERENCES "${tenantHash}".watermark_jobs(id),

            -- Detection Input
            input_hash VARCHAR(128) NOT NULL,
            input_file_name VARCHAR(255),
            input_file_type VARCHAR(50),
            input_file_size BIGINT,

            -- Watermark Detection
            watermark_detected BOOLEAN NOT NULL,
            watermark_confidence FLOAT NOT NULL,
            watermark_threshold_used FLOAT NOT NULL DEFAULT 0.5,

            -- Confidence Classification
            confidence_level VARCHAR(20) NOT NULL,

            -- C2PA Verification
            c2pa_manifest_found BOOLEAN NOT NULL DEFAULT false,
            c2pa_signature_valid BOOLEAN,
            c2pa_chain_verified BOOLEAN,
            c2pa_digital_source_type VARCHAR(255),

            -- Combined Assessment
            ai_generated_assessment VARCHAR(50) NOT NULL,
            assessment_reasoning TEXT,

            -- Metadata
            detection_method VARCHAR(50) NOT NULL DEFAULT 'watermark',
            processing_time_ms INTEGER,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            detected_by_user_id INTEGER
          );
        `, { transaction });

        // Indexes for detection_confidence_log
        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_detection_log_job_id
          ON "${tenantHash}".detection_confidence_log(watermark_job_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_detection_log_confidence_level
          ON "${tenantHash}".detection_confidence_log(confidence_level);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_detection_log_assessment
          ON "${tenantHash}".detection_confidence_log(ai_generated_assessment);
        `, { transaction });

        // ========================================================================
        // Update watermark_jobs with Article 50 compliance fields
        // ========================================================================
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".watermark_jobs
          ADD COLUMN IF NOT EXISTS c2pa_manifest_id UUID,
          ADD COLUMN IF NOT EXISTS provenance_chain_id UUID,
          ADD COLUMN IF NOT EXISTS robustness_test_suite_id UUID,
          ADD COLUMN IF NOT EXISTS eu_ai_act_compliant BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS compliance_report JSONB;
        `, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let org of organizations[0]) {
        const tenantHash = getTenantHash(org.id);

        // Remove added columns from watermark_jobs
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".watermark_jobs
          DROP COLUMN IF EXISTS c2pa_manifest_id,
          DROP COLUMN IF EXISTS provenance_chain_id,
          DROP COLUMN IF EXISTS robustness_test_suite_id,
          DROP COLUMN IF EXISTS eu_ai_act_compliant,
          DROP COLUMN IF EXISTS compliance_report;
        `, { transaction });

        // Drop tables in reverse order
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".detection_confidence_log;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".robustness_test_results;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".provenance_chains;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".c2pa_manifests;
        `, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
