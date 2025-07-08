'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ai_trust_center_intro table
    await queryInterface.createTable('ai_trust_center_intro', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      intro_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      purpose_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      purpose_text: {
        type: Sequelize.STRING,
        allowNull: true
      },
      our_statement_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      our_statement_text: {
        type: Sequelize.STRING,
        allowNull: true
      },
      our_mission_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      our_mission_text: {
        type: Sequelize.STRING,
        allowNull: true
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Create ai_trust_center_compliance_badges table
    await queryInterface.createTable('ai_trust_center_compliance_badges', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      badges_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      SOC2_Type_I: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      SOC2_Type_II: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      ISO_27001: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      ISO_42001: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      CCPA: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      GDPR: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      HIPAA: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      EU_AI_Act: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Create ai_trust_center_company_info table
    await queryInterface.createTable('ai_trust_center_company_info', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      company_info_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      background_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      background_text: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      core_benefit_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      core_benefit_text: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      compliance_doc_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      compliance_doc_text: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Create ai_trust_center_terms_and_contact table
    await queryInterface.createTable('ai_trust_center_terms_and_contact', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      is_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      has_terms_of_service: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      terms_of_service: {
        type: Sequelize.STRING,
        allowNull: true
      },
      has_privacy_policy: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      privacy_policy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      has_company_email: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      company_email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      organization_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ai_trust_center_terms_and_contact');
    await queryInterface.dropTable('ai_trust_center_company_info');
    await queryInterface.dropTable('ai_trust_center_compliance_badges');
    await queryInterface.dropTable('ai_trust_center_intro');
  }
}; 