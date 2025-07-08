"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, create a demo organization if it doesn't exist
    await queryInterface.bulkInsert('organizations', [
      {
        id: 1,
        name: 'Demo Organization',
        logo: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {
      ignoreDuplicates: true
    });

    // Insert demo data for ai_trust_center_intro
    await queryInterface.bulkInsert('ai_trust_center_intro', [
      {
        intro_visible: true,
        purpose_visible: true,
        purpose_text: 'Our Trust Center demonstrates our commitment to responsible AI practices and data privacy. We believe in transparency, ethical AI development, and building trust with our customers through clear communication about our AI governance practices.',
        our_statement_visible: true,
        our_statement_text: 'We are committed to ethical AI development and transparent data practices. Our AI solutions are designed with privacy, security, and fairness at their core, ensuring that we build trust with our customers while delivering innovative technology.',
        our_mission_visible: true,
        our_mission_text: 'To build trust through responsible AI innovation and transparent governance. We strive to be the gold standard in AI ethics and compliance, ensuring our technology serves humanity while protecting individual rights and privacy.',
        organization_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Insert demo data for ai_trust_center_compliance_badges
    await queryInterface.bulkInsert('ai_trust_center_compliance_badges', [
      {
        badges_visible: true,
        SOC2_Type_I: true,
        SOC2_Type_II: true,
        ISO_27001: true,
        ISO_42001: true,
        CCPA: true,
        GDPR: true,
        HIPAA: true,
        EU_AI_Act: true,
        organization_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Insert demo data for ai_trust_center_company_info
    await queryInterface.bulkInsert('ai_trust_center_company_info', [
      {
        company_info_visible: true,
        background_visible: true,
        background_text: 'We are a leading AI company focused on ethical and responsible AI development. Our team of experts combines deep technical knowledge with a strong commitment to AI governance, ensuring that our solutions not only deliver exceptional results but also maintain the highest standards of privacy and security.',
        core_benefit_visible: true,
        core_benefit_text: 'Our AI solutions provide enhanced security, efficiency, and customer support while maintaining the highest ethical standards. We offer comprehensive AI governance tools, automated compliance monitoring, and transparent reporting capabilities that help organizations build trust with their stakeholders.',
        compliance_doc_visible: true,
        compliance_doc_text: 'Access our comprehensive compliance documentation and certifications. Our compliance vault contains detailed audit reports, technical documentation, and governance frameworks that demonstrate our unwavering commitment to AI governance best practices.',
        organization_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Insert demo data for ai_trust_center_terms_and_contact
    await queryInterface.bulkInsert('ai_trust_center_terms_and_contact', [
      {
        is_visible: true,
        has_terms_of_service: true,
        terms_of_service: 'https://example.com/terms-of-service',
        has_privacy_policy: true,
        privacy_policy: 'https://example.com/privacy-policy',
        has_company_email: true,
        company_email: 'privacy@example.com',
        organization_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    // Remove demo data
    await queryInterface.bulkDelete('ai_trust_center_terms_and_contact', { organization_id: 1 }, {});
    await queryInterface.bulkDelete('ai_trust_center_company_info', { organization_id: 1 }, {});
    await queryInterface.bulkDelete('ai_trust_center_compliance_badges', { organization_id: 1 }, {});
    await queryInterface.bulkDelete('ai_trust_center_intro', { organization_id: 1 }, {});
    await queryInterface.bulkDelete('organizations', { id: 1 }, {});
  }
}; 