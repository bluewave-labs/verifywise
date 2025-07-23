'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        (tenantHash) => `ALTER TABLE "${tenantHash}".files ALTER COLUMN project_id DROP NOT NULL;`,
        (tenantHash) => `CREATE TABLE "${tenantHash}".ai_trust_center (
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
        (tenantHash) => `CREATE TABLE "${tenantHash}".ai_trust_center_intro (
          id INTEGER GENERATED ALWAYS AS (1) STORED UNIQUE PRIMARY KEY,
          purpose_visible BOOLEAN NOT NULL DEFAULT TRUE,
          purpose_text TEXT NOT NULL,
          our_statement_visible BOOLEAN NOT NULL DEFAULT TRUE,
          our_statement_text TEXT NOT NULL,
          our_mission_visible BOOLEAN NOT NULL DEFAULT TRUE,
          our_mission_text TEXT NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );`,
        (tenantHash) => `CREATE TABLE "${tenantHash}".ai_trust_center_compliance_badges (
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
        (tenantHash) => `CREATE TABLE "${tenantHash}".ai_trust_center_company_description (
          id INTEGER GENERATED ALWAYS AS (1) STORED UNIQUE PRIMARY KEY,
          background_visible BOOLEAN NOT NULL DEFAULT TRUE,
          background_text TEXT NOT NULL,
          core_benefits_visible BOOLEAN NOT NULL DEFAULT TRUE,
          core_benefits_text TEXT NOT NULL,
          compliance_doc_visible BOOLEAN NOT NULL DEFAULT TRUE,
          compliance_doc_text TEXT NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );`,
        (tenantHash) => `CREATE TABLE "${tenantHash}".ai_trust_center_terms_and_contact (
          id INTEGER GENERATED ALWAYS AS (1) STORED UNIQUE PRIMARY KEY,
          terms_visible BOOLEAN NOT NULL DEFAULT TRUE,
          terms_text TEXT NOT NULL,
          privacy_visible BOOLEAN NOT NULL DEFAULT TRUE,
          privacy_text TEXT NOT NULL,
          email_visible BOOLEAN NOT NULL DEFAULT TRUE,
          email_text TEXT NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );`,
        (tenantHash) => `CREATE TABLE "${tenantHash}".ai_trust_center_resources (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          visible BOOLEAN NOT NULL DEFAULT TRUE,
          file_id INTEGER NOT NULL REFERENCES "${tenantHash}".files(id) ON DELETE CASCADE,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );`,
        (tenantHash) => `CREATE TABLE "${tenantHash}".ai_trust_center_subprocessor (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          purpose TEXT NOT NULL,
          location VARCHAR(255) NOT NULL,
          url VARCHAR(255) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );`,
        (tenantHash) => `INSERT INTO "${tenantHash}".ai_trust_center (title) VALUES ('');`,
        (tenantHash) => `INSERT INTO "${tenantHash}".ai_trust_center_intro (purpose_text, our_statement_text, our_mission_text) VALUES ('', '', '');`,
        (tenantHash) => `INSERT INTO "${tenantHash}".ai_trust_center_company_description (background_text, core_benefits_text, compliance_doc_text) VALUES ('', '', '');`,
        (tenantHash) => `INSERT INTO "${tenantHash}".ai_trust_center_compliance_badges DEFAULT VALUES;`,
        (tenantHash) => `INSERT INTO "${tenantHash}".ai_trust_center_terms_and_contact (terms_text, privacy_text, email_text) VALUES ('', '', '');`
      ]

      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction })

      await queryInterface.sequelize.query(`ALTER TYPE enum_files_source ADD VALUE 'AI trust center group';`, { transaction })

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        const queriesWithTenant = queries.map(query => query(tenantHash));
        for (const query of queriesWithTenant) {
          await queryInterface.sequelize.query(query, { transaction });
        }
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
      const queries = [
        (tenantHash) => `DROP TABLE IF EXISTS "${tenantHash}".ai_trust_center_subprocessor;`,
        (tenantHash) => `DROP TABLE IF EXISTS "${tenantHash}".ai_trust_center_resources;`,
        (tenantHash) => `DROP TABLE IF EXISTS "${tenantHash}".ai_trust_center_terms_and_contact;`,
        (tenantHash) => `DROP TABLE IF EXISTS "${tenantHash}".ai_trust_center_company_description;`,
        (tenantHash) => `DROP TABLE IF EXISTS "${tenantHash}".ai_trust_center_compliance_badges;`,
        (tenantHash) => `DROP TABLE IF EXISTS "${tenantHash}".ai_trust_center_intro;`,
        (tenantHash) => `DROP TABLE IF EXISTS "${tenantHash}".ai_trust_center;`,
      ];

      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction });

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        const queriesWithTenant = queries.map(query => query(tenantHash));
        for (const query of queriesWithTenant) {
          await queryInterface.sequelize.query(query, { transaction });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
