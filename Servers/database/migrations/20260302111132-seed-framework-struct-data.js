'use strict';

/**
 * Seed Framework Struct Data Migration
 *
 * Seeds the public schema struct tables with framework template data:
 * - EU AI Act: topics, subtopics, questions, control categories, controls, subcontrols
 * - ISO 42001: clauses, subclauses, annex categories
 * - ISO 27001: clauses, subclauses, annex categories, annex controls
 * - NIST AI RMF: categories, subcategories
 *
 * This data is shared across all organizations (no organization_id).
 * Each struct table references the frameworks table via framework_id.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🌱 Seeding framework struct data...');

      // Helper: Check if table has data
      const tableHasData = async (tableName) => {
        const [result] = await queryInterface.sequelize.query(
          `SELECT EXISTS (SELECT 1 FROM ${tableName} LIMIT 1) as has_data;`,
          { transaction }
        );
        return result[0].has_data;
      };

      // Helper: Add column if not exists
      const addColumnIfNotExists = async (tableName, columnName, definition) => {
        await queryInterface.sequelize.query(`
          DO $$ BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = '${tableName}' AND column_name = '${columnName}'
            ) THEN
              ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};
            END IF;
          END $$;
        `, { transaction });
      };

      // Add is_demo column to all struct tables if missing
      const structTables = [
        'topics_struct_eu', 'subtopics_struct_eu', 'questions_struct_eu',
        'controlcategories_struct_eu', 'controls_struct_eu', 'subcontrols_struct_eu',
        'clauses_struct_iso', 'subclauses_struct_iso', 'annexcategories_struct_iso',
        'clauses_struct_iso27001', 'subclauses_struct_iso27001',
        'annexcategories_struct_iso27001', 'annexcontrols_struct_iso27001',
        'nist_ai_rmf_categories_struct', 'nist_ai_rmf_subcategories_struct'
      ];

      for (const table of structTables) {
        await addColumnIfNotExists(table, 'is_demo', 'BOOLEAN DEFAULT false');
      }

      // ========================================
      // SEED FRAMEWORKS TABLE
      // ========================================
      console.log('📋 Seeding frameworks...');

      const frameworks = [
        { name: 'EU AI Act', description: 'European Union Artificial Intelligence Act' },
        { name: 'ISO 42001', description: 'ISO/IEC 42001 AI Management System' },
        { name: 'ISO 27001', description: 'ISO/IEC 27001 Information Security Management' },
        { name: 'NIST AI RMF', description: 'NIST AI Risk Management Framework' },
      ];

      for (const fw of frameworks) {
        const [existing] = await queryInterface.sequelize.query(
          `SELECT id FROM frameworks WHERE name = :name LIMIT 1`,
          { replacements: { name: fw.name }, transaction }
        );
        if (existing.length === 0) {
          await queryInterface.sequelize.query(`
            INSERT INTO frameworks (name, description, is_active, is_demo)
            VALUES (:name, :description, true, false)
          `, {
            replacements: fw,
            transaction,
          });
        }
      }

      // Get framework IDs
      const [fwRows] = await queryInterface.sequelize.query(
        `SELECT id, name FROM frameworks WHERE name IN ('EU AI Act', 'ISO 42001', 'ISO 27001', 'NIST AI RMF')`,
        { transaction }
      );
      const fwIdMap = {};
      fwRows.forEach(row => { fwIdMap[row.name] = row.id; });

      const euFrameworkId = fwIdMap['EU AI Act'];
      const iso42001FrameworkId = fwIdMap['ISO 42001'];
      const iso27001FrameworkId = fwIdMap['ISO 27001'];
      const nistFrameworkId = fwIdMap['NIST AI RMF'];

      // Check which frameworks already have struct data
      const hasEUData = await tableHasData('topics_struct_eu');
      const hasISOData = await tableHasData('clauses_struct_iso');
      const hasISO27001Data = await tableHasData('clauses_struct_iso27001');
      const hasNISTData = await tableHasData('nist_ai_rmf_categories_struct');

      // ========================================
      // EU AI ACT - TOPICS
      // ========================================
      if (hasEUData) {
        console.log('📋 EU AI Act data already exists - skipping...');
      } else if (!euFrameworkId) {
        console.log('📋 EU AI Act framework not found - skipping...');
      } else {
        console.log('📋 Seeding EU AI Act topics...');

        const topicsEU = [
          { order_no: 0, title: 'Project scope' },
          { order_no: 1, title: 'Risk management system' },
          { order_no: 2, title: 'Data governance' },
          { order_no: 3, title: 'Technical documentation' },
          { order_no: 4, title: 'Record keeping' },
          { order_no: 5, title: 'Transparency & user information' },
          { order_no: 6, title: 'Human oversight' },
          { order_no: 7, title: 'Accuracy, robustness, cyber security' },
          { order_no: 8, title: 'Conformity assessment' },
          { order_no: 9, title: 'Post-market monitoring' },
          { order_no: 10, title: 'Bias monitoring and mitigation' },
          { order_no: 11, title: 'Accountability and governance' },
          { order_no: 12, title: 'Explainability' },
          { order_no: 13, title: 'Environmental impact' },
        ];

        for (const topic of topicsEU) {
          await queryInterface.sequelize.query(`
            INSERT INTO topics_struct_eu (framework_id, title, order_no, is_demo)
            VALUES (:frameworkId, :title, :order_no, false)
            ON CONFLICT DO NOTHING
          `, {
            replacements: { frameworkId: euFrameworkId, ...topic },
            transaction,
          });
        }

        // Get topic IDs
        const [topicRows] = await queryInterface.sequelize.query(
          `SELECT id, order_no FROM topics_struct_eu WHERE framework_id = :frameworkId ORDER BY order_no`,
          { replacements: { frameworkId: euFrameworkId }, transaction }
        );
        const topicIdMap = {};
        topicRows.forEach(row => { topicIdMap[row.order_no] = row.id; });

        console.log('📋 Seeding EU AI Act subtopics...');
        const subtopicsEU = [
          { topic_order: 0, order_no: 1, title: 'General' },
          { topic_order: 0, order_no: 2, title: 'Technology details' },
          { topic_order: 1, order_no: 1, title: 'Risk management process' },
          { topic_order: 1, order_no: 2, title: 'Risk identification' },
          { topic_order: 1, order_no: 3, title: 'Risk treatment' },
          { topic_order: 2, order_no: 1, title: 'Data quality' },
          { topic_order: 2, order_no: 2, title: 'Data management' },
          { topic_order: 2, order_no: 3, title: 'Training and validation data' },
          { topic_order: 3, order_no: 1, title: 'General system description' },
          { topic_order: 3, order_no: 2, title: 'Technical specifications' },
          { topic_order: 4, order_no: 1, title: 'Logging requirements' },
          { topic_order: 4, order_no: 2, title: 'Record management' },
          { topic_order: 5, order_no: 1, title: 'User information' },
          { topic_order: 5, order_no: 2, title: 'Instructions for use' },
          { topic_order: 6, order_no: 1, title: 'Human control measures' },
          { topic_order: 6, order_no: 2, title: 'Intervention capabilities' },
          { topic_order: 7, order_no: 1, title: 'Accuracy measures' },
          { topic_order: 7, order_no: 2, title: 'Robustness measures' },
          { topic_order: 7, order_no: 3, title: 'Cybersecurity measures' },
          { topic_order: 8, order_no: 1, title: 'Conformity procedures' },
          { topic_order: 8, order_no: 2, title: 'Documentation requirements' },
          { topic_order: 9, order_no: 1, title: 'Monitoring plan' },
          { topic_order: 9, order_no: 2, title: 'Incident reporting' },
          { topic_order: 10, order_no: 1, title: 'Bias detection' },
          { topic_order: 10, order_no: 2, title: 'Bias mitigation' },
          { topic_order: 11, order_no: 1, title: 'Governance structure' },
          { topic_order: 11, order_no: 2, title: 'Responsibility assignment' },
          { topic_order: 12, order_no: 1, title: 'Model explainability' },
          { topic_order: 12, order_no: 2, title: 'Decision transparency' },
          { topic_order: 13, order_no: 1, title: 'Energy consumption' },
          { topic_order: 13, order_no: 2, title: 'Environmental assessment' },
        ];

        for (const subtopic of subtopicsEU) {
          const topicId = topicIdMap[subtopic.topic_order];
          if (topicId) {
            await queryInterface.sequelize.query(`
              INSERT INTO subtopics_struct_eu (topic_id, title, order_no, is_demo)
              VALUES (:topicId, :title, :order_no, false)
              ON CONFLICT DO NOTHING
            `, {
              replacements: { topicId, title: subtopic.title, order_no: subtopic.order_no },
              transaction,
            });
          }
        }

        console.log('📋 Seeding EU AI Act control categories...');
        const controlCategoriesEU = [
          { order_no: 1, title: 'AI literacy' },
          { order_no: 2, title: 'Transparency and provision of information to deployers' },
          { order_no: 3, title: 'Human oversight' },
          { order_no: 4, title: 'Corrective actions and duty of information' },
          { order_no: 5, title: 'Responsibilities along the AI value chain' },
          { order_no: 6, title: 'Obligations of deployers of high-risk AI systems' },
          { order_no: 7, title: 'Fundamental rights impact assessments for high-risk AI systems' },
          { order_no: 8, title: 'Transparency obligations for providers and users of certain AI systems' },
          { order_no: 9, title: 'Registration' },
          { order_no: 10, title: 'EU database for high-risk AI systems listed in Annex III' },
          { order_no: 11, title: 'Post-market monitoring by providers and post-market monitoring plan for high-risk AI systems' },
          { order_no: 12, title: 'Reporting of serious incidents' },
          { order_no: 13, title: 'General-purpose AI models' },
        ];

        for (const category of controlCategoriesEU) {
          await queryInterface.sequelize.query(`
            INSERT INTO controlcategories_struct_eu (framework_id, title, order_no, is_demo)
            VALUES (:frameworkId, :title, :order_no, false)
            ON CONFLICT DO NOTHING
          `, {
            replacements: { frameworkId: euFrameworkId, ...category },
            transaction,
          });
        }

        // Get category IDs
        const [categoryRows] = await queryInterface.sequelize.query(
          `SELECT id, order_no FROM controlcategories_struct_eu WHERE framework_id = :frameworkId ORDER BY order_no`,
          { replacements: { frameworkId: euFrameworkId }, transaction }
        );
        const categoryIdMap = {};
        categoryRows.forEach(row => { categoryIdMap[row.order_no] = row.id; });

        console.log('📋 Seeding EU AI Act controls...');
        const controlsEU = [
          { category_order: 1, order_no: 1, title: 'AI Literacy and Responsible AI Training', description: 'Develop the AI literacy of staff and others who operate or use AI systems on behalf of the organization.' },
          { category_order: 1, order_no: 2, title: 'Regulatory Training and Response Procedures', description: 'Train personnel on regulatory requirements and procedures for responding to authority requests.' },
          { category_order: 2, order_no: 1, title: 'Instructions for Use', description: 'Provide clear instructions and information for safe operation of AI systems.' },
          { category_order: 2, order_no: 2, title: 'Technical Documentation', description: 'Maintain comprehensive technical documentation for AI systems.' },
          { category_order: 3, order_no: 1, title: 'Human Control Measures', description: 'Implement measures enabling human oversight of AI systems.' },
          { category_order: 3, order_no: 2, title: 'Intervention Capabilities', description: 'Ensure ability to intervene in AI system operations.' },
          { category_order: 4, order_no: 1, title: 'Incident Response', description: 'Establish procedures for responding to AI system incidents.' },
          { category_order: 4, order_no: 2, title: 'Corrective Action Process', description: 'Implement process for taking corrective actions.' },
          { category_order: 5, order_no: 1, title: 'Value Chain Responsibilities', description: 'Define responsibilities across the AI value chain.' },
          { category_order: 6, order_no: 1, title: 'Risk Management', description: 'Implement risk management for high-risk AI systems.' },
          { category_order: 6, order_no: 2, title: 'Data Governance', description: 'Ensure proper data governance practices.' },
          { category_order: 7, order_no: 1, title: 'Impact Assessment', description: 'Conduct fundamental rights impact assessments.' },
          { category_order: 8, order_no: 1, title: 'AI System Disclosure', description: 'Disclose AI system use to affected persons.' },
          { category_order: 9, order_no: 1, title: 'EU Database Registration', description: 'Register high-risk AI systems in EU database.' },
          { category_order: 10, order_no: 1, title: 'Database Information', description: 'Maintain accurate information in EU database.' },
          { category_order: 11, order_no: 1, title: 'Monitoring Plan', description: 'Establish post-market monitoring plan.' },
          { category_order: 11, order_no: 2, title: 'Performance Monitoring', description: 'Monitor AI system performance continuously.' },
          { category_order: 12, order_no: 1, title: 'Serious Incident Reporting', description: 'Report serious incidents to authorities.' },
          { category_order: 13, order_no: 1, title: 'GPAI Transparency', description: 'Meet transparency requirements for general-purpose AI.' },
          { category_order: 13, order_no: 2, title: 'Systemic Risk Assessment', description: 'Assess systemic risks of GPAI models.' },
        ];

        for (const control of controlsEU) {
          const categoryId = categoryIdMap[control.category_order];
          if (categoryId) {
            await queryInterface.sequelize.query(`
              INSERT INTO controls_struct_eu (control_category_id, title, description, order_no, is_demo)
              VALUES (:categoryId, :title, :description, :order_no, false)
              ON CONFLICT DO NOTHING
            `, {
              replacements: { categoryId, title: control.title, description: control.description, order_no: control.order_no },
              transaction,
            });
          }
        }
      } // end EU AI Act

      // ========================================
      // ISO 42001 - CLAUSES
      // ========================================
      if (hasISOData) {
        console.log('📋 ISO 42001 data already exists - skipping...');
      } else if (!iso42001FrameworkId) {
        console.log('📋 ISO 42001 framework not found - skipping...');
      } else {
        console.log('📋 Seeding ISO 42001 clauses...');

        const clausesISO = [
          { clause_id: '4', title: 'Clause 4: Context of the Organization', order_no: 4 },
          { clause_id: '5', title: 'Clause 5: Leadership', order_no: 5 },
          { clause_id: '6', title: 'Clause 6: Planning', order_no: 6 },
          { clause_id: '7', title: 'Clause 7: Support', order_no: 7 },
          { clause_id: '8', title: 'Clause 8: Operation', order_no: 8 },
          { clause_id: '9', title: 'Clause 9: Performance Evaluation', order_no: 9 },
          { clause_id: '10', title: 'Clause 10: Improvement', order_no: 10 },
        ];

        for (const clause of clausesISO) {
          await queryInterface.sequelize.query(`
            INSERT INTO clauses_struct_iso (framework_id, clause_id, title, order_no, is_demo)
            VALUES (:frameworkId, :clause_id, :title, :order_no, false)
            ON CONFLICT DO NOTHING
          `, {
            replacements: { frameworkId: iso42001FrameworkId, ...clause },
            transaction,
          });
        }

        const [clauseRows] = await queryInterface.sequelize.query(
          `SELECT id, order_no FROM clauses_struct_iso WHERE framework_id = :frameworkId ORDER BY order_no`,
          { replacements: { frameworkId: iso42001FrameworkId }, transaction }
        );
        const clauseIdMap = {};
        clauseRows.forEach(row => { clauseIdMap[row.order_no] = row.id; });

        console.log('📋 Seeding ISO 42001 subclauses...');
        const subclausesISO = [
          { clause_order: 4, subclause_id: '4.1', title: 'Understanding the organization and its context', order_no: 1, description: 'Determine external and internal issues relevant to the AIMS.' },
          { clause_order: 4, subclause_id: '4.2', title: 'Understanding the needs and expectations of interested parties', order_no: 2, description: 'Identify interested parties and their requirements.' },
          { clause_order: 4, subclause_id: '4.3', title: 'Determining the scope of the AI Management System', order_no: 3, description: 'Define boundaries and applicability of the AIMS.' },
          { clause_order: 4, subclause_id: '4.4', title: 'AI Management System', order_no: 4, description: 'Establish, implement, maintain, and improve the AIMS.' },
          { clause_order: 5, subclause_id: '5.1', title: 'Leadership and commitment', order_no: 1, description: 'Top management shall demonstrate leadership and commitment.' },
          { clause_order: 5, subclause_id: '5.2', title: 'AI policy', order_no: 2, description: 'Establish an AI policy appropriate to the organization.' },
          { clause_order: 5, subclause_id: '5.3', title: 'Organizational roles, responsibilities and authorities', order_no: 3, description: 'Assign and communicate responsibilities and authorities.' },
          { clause_order: 6, subclause_id: '6.1', title: 'Actions to address risks and opportunities', order_no: 1, description: 'Plan actions to address risks and opportunities.' },
          { clause_order: 6, subclause_id: '6.2', title: 'AI objectives and planning to achieve them', order_no: 2, description: 'Establish AI objectives at relevant functions and levels.' },
          { clause_order: 7, subclause_id: '7.1', title: 'Resources', order_no: 1, description: 'Determine and provide resources needed for the AIMS.' },
          { clause_order: 7, subclause_id: '7.2', title: 'Competence', order_no: 2, description: 'Determine necessary competence for personnel.' },
          { clause_order: 7, subclause_id: '7.3', title: 'Awareness', order_no: 3, description: 'Ensure personnel are aware of AI policy and their contribution.' },
          { clause_order: 7, subclause_id: '7.4', title: 'Communication', order_no: 4, description: 'Determine internal and external communications.' },
          { clause_order: 7, subclause_id: '7.5', title: 'Documented information', order_no: 5, description: 'Include documented information required by the AIMS.' },
          { clause_order: 8, subclause_id: '8.1', title: 'Operational planning and control', order_no: 1, description: 'Plan, implement and control processes to meet requirements.' },
          { clause_order: 8, subclause_id: '8.2', title: 'AI risk assessment', order_no: 2, description: 'Perform AI risk assessments.' },
          { clause_order: 8, subclause_id: '8.3', title: 'AI risk treatment', order_no: 3, description: 'Implement AI risk treatment plan.' },
          { clause_order: 8, subclause_id: '8.4', title: 'AI system lifecycle', order_no: 4, description: 'Plan and control AI system lifecycle processes.' },
          { clause_order: 9, subclause_id: '9.1', title: 'Monitoring, measurement, analysis and evaluation', order_no: 1, description: 'Determine what needs to be monitored and measured.' },
          { clause_order: 9, subclause_id: '9.2', title: 'Internal audit', order_no: 2, description: 'Conduct internal audits at planned intervals.' },
          { clause_order: 9, subclause_id: '9.3', title: 'Management review', order_no: 3, description: 'Review the AIMS at planned intervals.' },
          { clause_order: 10, subclause_id: '10.1', title: 'Nonconformity and corrective action', order_no: 1, description: 'React to nonconformities and take action.' },
          { clause_order: 10, subclause_id: '10.2', title: 'Continual improvement', order_no: 2, description: 'Continually improve the AIMS.' },
        ];

        for (const subclause of subclausesISO) {
          const clauseId = clauseIdMap[subclause.clause_order];
          if (clauseId) {
            await queryInterface.sequelize.query(`
              INSERT INTO subclauses_struct_iso (clause_id, subclause_id, title, description, order_no, is_demo)
              VALUES (:clauseId, :subclause_id, :title, :description, :order_no, false)
              ON CONFLICT DO NOTHING
            `, {
              replacements: { clauseId, subclause_id: subclause.subclause_id, title: subclause.title, description: subclause.description, order_no: subclause.order_no },
              transaction,
            });
          }
        }

        console.log('📋 Seeding ISO 42001 annex categories...');
        const annexCategoriesISO = [
          { annex_id: 'A.5', title: 'A.5 Organizational policies and governance', order_no: 5 },
          { annex_id: 'A.6', title: 'A.6 Internal organization', order_no: 6 },
          { annex_id: 'A.7', title: 'A.7 Resources for AI systems', order_no: 7 },
          { annex_id: 'A.8', title: 'A.8 AI system lifecycle', order_no: 8 },
          { annex_id: 'A.9', title: 'A.9 Data for AI systems', order_no: 9 },
          { annex_id: 'A.10', title: 'A.10 Information and communication technology (ICT)', order_no: 10 },
          { annex_id: 'A.11', title: 'A.11 Third party relationships', order_no: 11 },
        ];

        for (const annex of annexCategoriesISO) {
          await queryInterface.sequelize.query(`
            INSERT INTO annexcategories_struct_iso (framework_id, annex_id, title, order_no, is_demo)
            VALUES (:frameworkId, :annex_id, :title, :order_no, false)
            ON CONFLICT DO NOTHING
          `, {
            replacements: { frameworkId: iso42001FrameworkId, ...annex },
            transaction,
          });
        }
      } // end ISO 42001

      // ========================================
      // ISO 27001 - CLAUSES
      // ========================================
      if (hasISO27001Data) {
        console.log('📋 ISO 27001 data already exists - skipping...');
      } else if (!iso27001FrameworkId) {
        console.log('📋 ISO 27001 framework not found - skipping...');
      } else {
        console.log('📋 Seeding ISO 27001 clauses...');

        const clausesISO27001 = [
          { clause_id: '4', title: 'Context of the organization', order_no: 4 },
          { clause_id: '5', title: 'Leadership', order_no: 5 },
          { clause_id: '6', title: 'Planning', order_no: 6 },
          { clause_id: '7', title: 'Support', order_no: 7 },
          { clause_id: '8', title: 'Operation', order_no: 8 },
          { clause_id: '9', title: 'Performance evaluation', order_no: 9 },
          { clause_id: '10', title: 'Improvement', order_no: 10 },
        ];

        for (const clause of clausesISO27001) {
          await queryInterface.sequelize.query(`
            INSERT INTO clauses_struct_iso27001 (framework_id, clause_id, title, order_no, is_demo)
            VALUES (:frameworkId, :clause_id, :title, :order_no, false)
            ON CONFLICT DO NOTHING
          `, {
            replacements: { frameworkId: iso27001FrameworkId, ...clause },
            transaction,
          });
        }

        const [clauseRows27001] = await queryInterface.sequelize.query(
          `SELECT id, order_no FROM clauses_struct_iso27001 WHERE framework_id = :frameworkId ORDER BY order_no`,
          { replacements: { frameworkId: iso27001FrameworkId }, transaction }
        );
        const clauseIdMap27001 = {};
        clauseRows27001.forEach(row => { clauseIdMap27001[row.order_no] = row.id; });

        console.log('📋 Seeding ISO 27001 subclauses...');
        const subclausesISO27001 = [
          { clause_order: 4, subclause_id: '4.1', title: 'Understanding the organization and its context', order_no: 1, description: 'Identify internal and external issues affecting ISMS.' },
          { clause_order: 4, subclause_id: '4.2', title: 'Understanding the needs and expectations of interested parties', order_no: 2, description: 'List stakeholders and their requirements.' },
          { clause_order: 4, subclause_id: '4.3', title: 'Determining the scope of the ISMS', order_no: 3, description: 'Define ISMS boundaries and applicability.' },
          { clause_order: 4, subclause_id: '4.4', title: 'Information Security Management System', order_no: 4, description: 'Create and maintain ISMS structure.' },
          { clause_order: 5, subclause_id: '5.1', title: 'Leadership and commitment', order_no: 1, description: 'Ensure leadership supports ISMS initiatives.' },
          { clause_order: 5, subclause_id: '5.2', title: 'Information security policy', order_no: 2, description: 'Create approved security policy.' },
          { clause_order: 5, subclause_id: '5.3', title: 'Organizational roles, responsibilities, and authorities', order_no: 3, description: 'Define security responsibilities.' },
          { clause_order: 6, subclause_id: '6.1.2', title: 'Information security risk assessment', order_no: 1, description: 'Identify and assess security risks.' },
          { clause_order: 6, subclause_id: '6.1.3', title: 'Information security risk treatment', order_no: 2, description: 'Develop risk treatment plans.' },
          { clause_order: 6, subclause_id: '6.2', title: 'Information security objectives', order_no: 3, description: 'Define measurable security goals.' },
          { clause_order: 7, subclause_id: '7.1', title: 'Resources', order_no: 1, description: 'Allocate ISMS resources.' },
          { clause_order: 7, subclause_id: '7.2', title: 'Competence', order_no: 2, description: 'Ensure staff competency.' },
          { clause_order: 7, subclause_id: '7.3', title: 'Awareness', order_no: 3, description: 'Security awareness training.' },
          { clause_order: 7, subclause_id: '7.4', title: 'Communication', order_no: 4, description: 'Security communications plan.' },
          { clause_order: 7, subclause_id: '7.5', title: 'Documented information', order_no: 5, description: 'Document control procedures.' },
          { clause_order: 8, subclause_id: '8.1', title: 'Operational planning and control', order_no: 1, description: 'Plan and manage daily operations.' },
          { clause_order: 8, subclause_id: '8.2', title: 'Risk assessment during operations', order_no: 2, description: 'Assess risks for changes.' },
          { clause_order: 8, subclause_id: '8.3', title: 'Risk treatment during operations', order_no: 3, description: 'Implement risk treatments.' },
          { clause_order: 9, subclause_id: '9.1', title: 'Monitoring, measurement, analysis, and evaluation', order_no: 1, description: 'Track ISMS performance.' },
          { clause_order: 9, subclause_id: '9.2', title: 'Internal audit', order_no: 2, description: 'Conduct internal audits.' },
          { clause_order: 9, subclause_id: '9.3', title: 'Management review', order_no: 3, description: 'Leadership reviews ISMS.' },
          { clause_order: 10, subclause_id: '10.1', title: 'Nonconformity and corrective action', order_no: 1, description: 'Fix problems and prevent recurrence.' },
          { clause_order: 10, subclause_id: '10.2', title: 'Continual improvement', order_no: 2, description: 'Ongoing ISMS improvement.' },
        ];

        for (const subclause of subclausesISO27001) {
          const clauseId = clauseIdMap27001[subclause.clause_order];
          if (clauseId) {
            await queryInterface.sequelize.query(`
              INSERT INTO subclauses_struct_iso27001 (clause_id, subclause_id, title, description, order_no, is_demo)
              VALUES (:clauseId, :subclause_id, :title, :description, :order_no, false)
              ON CONFLICT DO NOTHING
            `, {
              replacements: { clauseId, subclause_id: subclause.subclause_id, title: subclause.title, description: subclause.description, order_no: subclause.order_no },
              transaction,
            });
          }
        }

        console.log('📋 Seeding ISO 27001 annex categories...');
        const annexCategoriesISO27001 = [
          { annex_id: 'A.5', title: 'Organizational controls', order_no: 5 },
          { annex_id: 'A.6', title: 'People controls', order_no: 6 },
          { annex_id: 'A.7', title: 'Physical controls', order_no: 7 },
          { annex_id: 'A.8', title: 'Technological controls', order_no: 8 },
        ];

        for (const annex of annexCategoriesISO27001) {
          await queryInterface.sequelize.query(`
            INSERT INTO annexcategories_struct_iso27001 (framework_id, annex_id, title, order_no, is_demo)
            VALUES (:frameworkId, :annex_id, :title, :order_no, false)
            ON CONFLICT DO NOTHING
          `, {
            replacements: { frameworkId: iso27001FrameworkId, ...annex },
            transaction,
          });
        }
      } // end ISO 27001

      // ========================================
      // NIST AI RMF - CATEGORIES & SUBCATEGORIES (Struct tables)
      // ========================================
      if (hasNISTData) {
        console.log('📋 NIST AI RMF data already exists - skipping...');
      } else if (!nistFrameworkId) {
        console.log('📋 NIST AI RMF framework not found - skipping...');
      } else {
        console.log('📋 Seeding NIST AI RMF categories (struct)...');

        const categoriesNIST = [
          { function: 'GOVERN', category_id: 1, description: 'Policies, processes, procedures, and practices across the organization.', order_no: 1 },
          { function: 'GOVERN', category_id: 2, description: 'Accountability structures are in place.', order_no: 2 },
          { function: 'GOVERN', category_id: 3, description: 'Workforce diversity, equity, inclusion processes.', order_no: 3 },
          { function: 'GOVERN', category_id: 4, description: 'Organizational teams are committed to AI risk culture.', order_no: 4 },
          { function: 'GOVERN', category_id: 5, description: 'Processes for robust engagement with AI actors.', order_no: 5 },
          { function: 'GOVERN', category_id: 6, description: 'Policies for third-party software and data.', order_no: 6 },
          { function: 'MAP', category_id: 1, description: 'Context is established and understood.', order_no: 1 },
          { function: 'MAP', category_id: 2, description: 'Categorization of the AI system is performed.', order_no: 2 },
          { function: 'MAP', category_id: 3, description: 'AI capabilities, usage, goals, and benefits are understood.', order_no: 3 },
          { function: 'MAP', category_id: 4, description: 'Risks and benefits mapped for all components.', order_no: 4 },
          { function: 'MAP', category_id: 5, description: 'Impacts to individuals and communities characterized.', order_no: 5 },
          { function: 'MEASURE', category_id: 1, description: 'Appropriate methods and metrics identified.', order_no: 1 },
          { function: 'MEASURE', category_id: 2, description: 'AI systems evaluated for trustworthy characteristics.', order_no: 2 },
          { function: 'MEASURE', category_id: 3, description: 'Mechanisms for tracking AI risks over time.', order_no: 3 },
          { function: 'MEASURE', category_id: 4, description: 'Feedback about measurement efficacy gathered.', order_no: 4 },
          { function: 'MANAGE', category_id: 1, description: 'AI risks prioritized, responded to, and managed.', order_no: 1 },
          { function: 'MANAGE', category_id: 2, description: 'Strategies to maximize benefits and minimize impacts.', order_no: 2 },
          { function: 'MANAGE', category_id: 3, description: 'AI risks from third-party entities managed.', order_no: 3 },
          { function: 'MANAGE', category_id: 4, description: 'Risk treatments and incident response documented.', order_no: 4 },
        ];

        for (const category of categoriesNIST) {
          await queryInterface.sequelize.query(`
            INSERT INTO nist_ai_rmf_categories_struct (framework_id, function, category_id, description, order_no, is_demo)
            VALUES (:frameworkId, :function, :category_id, :description, :order_no, false)
            ON CONFLICT (function, category_id) DO NOTHING
          `, {
            replacements: { frameworkId: nistFrameworkId, ...category },
            transaction,
          });
        }

        const [nistCategoryRows] = await queryInterface.sequelize.query(
          `SELECT id, function, category_id FROM nist_ai_rmf_categories_struct WHERE framework_id = :frameworkId ORDER BY function, category_id`,
          { replacements: { frameworkId: nistFrameworkId }, transaction }
        );
        const nistCategoryMap = {};
        nistCategoryRows.forEach(row => { nistCategoryMap[`${row.function}-${row.category_id}`] = row.id; });

        console.log('📋 Seeding NIST AI RMF subcategories...');
        const subcategoriesNIST = [
          { function: 'GOVERN', category_id: 1, subcategory_id: 1.1, description: 'Legal and regulatory requirements are identified.', order_no: 1 },
          { function: 'GOVERN', category_id: 1, subcategory_id: 1.2, description: 'Trustworthy AI policies are established.', order_no: 2 },
          { function: 'GOVERN', category_id: 1, subcategory_id: 1.3, description: 'Processes for governance and oversight exist.', order_no: 3 },
          { function: 'GOVERN', category_id: 1, subcategory_id: 1.4, description: 'AI risk management process integrated.', order_no: 4 },
          { function: 'GOVERN', category_id: 1, subcategory_id: 1.5, description: 'Ongoing monitoring processes established.', order_no: 5 },
          { function: 'GOVERN', category_id: 1, subcategory_id: 1.6, description: 'Mechanisms for feedback and appeals.', order_no: 6 },
          { function: 'GOVERN', category_id: 2, subcategory_id: 2.1, description: 'Roles and responsibilities defined.', order_no: 1 },
          { function: 'GOVERN', category_id: 2, subcategory_id: 2.2, description: 'Training provided to personnel.', order_no: 2 },
          { function: 'GOVERN', category_id: 2, subcategory_id: 2.3, description: 'Executive leadership commitment.', order_no: 3 },
          { function: 'GOVERN', category_id: 3, subcategory_id: 3.1, description: 'Decision-making diversity ensured.', order_no: 1 },
          { function: 'GOVERN', category_id: 3, subcategory_id: 3.2, description: 'Accessibility considerations integrated.', order_no: 2 },
          { function: 'GOVERN', category_id: 4, subcategory_id: 4.1, description: 'AI risk culture fostered.', order_no: 1 },
          { function: 'GOVERN', category_id: 4, subcategory_id: 4.2, description: 'AI risk communication practiced.', order_no: 2 },
          { function: 'GOVERN', category_id: 4, subcategory_id: 4.3, description: 'AI risk management incentives aligned.', order_no: 3 },
          { function: 'GOVERN', category_id: 5, subcategory_id: 5.1, description: 'Engagement with AI actors and stakeholders.', order_no: 1 },
          { function: 'GOVERN', category_id: 5, subcategory_id: 5.2, description: 'Feedback mechanisms for stakeholders.', order_no: 2 },
          { function: 'GOVERN', category_id: 6, subcategory_id: 6.1, description: 'Third-party AI policies defined.', order_no: 1 },
          { function: 'GOVERN', category_id: 6, subcategory_id: 6.2, description: 'Third-party AI risks assessed.', order_no: 2 },
          { function: 'MAP', category_id: 1, subcategory_id: 1.1, description: 'Intended purpose defined.', order_no: 1 },
          { function: 'MAP', category_id: 1, subcategory_id: 1.2, description: 'Interdisciplinary team engaged.', order_no: 2 },
          { function: 'MAP', category_id: 1, subcategory_id: 1.3, description: 'Context and environment documented.', order_no: 3 },
          { function: 'MAP', category_id: 1, subcategory_id: 1.4, description: 'Assumptions and limitations identified.', order_no: 4 },
          { function: 'MAP', category_id: 1, subcategory_id: 1.5, description: 'Impacts of AI system analyzed.', order_no: 5 },
          { function: 'MAP', category_id: 1, subcategory_id: 1.6, description: 'System requirements defined.', order_no: 6 },
          { function: 'MAP', category_id: 2, subcategory_id: 2.1, description: 'AI system categorized.', order_no: 1 },
          { function: 'MAP', category_id: 2, subcategory_id: 2.2, description: 'Information on data practices obtained.', order_no: 2 },
          { function: 'MAP', category_id: 2, subcategory_id: 2.3, description: 'Scientific integrity considered.', order_no: 3 },
          { function: 'MAP', category_id: 3, subcategory_id: 3.1, description: 'Potential benefits identified.', order_no: 1 },
          { function: 'MAP', category_id: 3, subcategory_id: 3.2, description: 'Potential costs and harms identified.', order_no: 2 },
          { function: 'MAP', category_id: 3, subcategory_id: 3.3, description: 'AI actor tasks identified.', order_no: 3 },
          { function: 'MAP', category_id: 3, subcategory_id: 3.4, description: 'Human-AI interaction considerations.', order_no: 4 },
          { function: 'MAP', category_id: 4, subcategory_id: 4.1, description: 'Impacts to individuals mapped.', order_no: 1 },
          { function: 'MAP', category_id: 4, subcategory_id: 4.2, description: 'Internal and societal risks mapped.', order_no: 2 },
          { function: 'MAP', category_id: 5, subcategory_id: 5.1, description: 'Likelihood and impact of harms.', order_no: 1 },
          { function: 'MAP', category_id: 5, subcategory_id: 5.2, description: 'Stakeholder input on risk tolerances.', order_no: 2 },
          { function: 'MEASURE', category_id: 1, subcategory_id: 1.1, description: 'Methods and metrics established.', order_no: 1 },
          { function: 'MEASURE', category_id: 1, subcategory_id: 1.2, description: 'Appropriateness of metrics assessed.', order_no: 2 },
          { function: 'MEASURE', category_id: 1, subcategory_id: 1.3, description: 'Internal experts consulted.', order_no: 3 },
          { function: 'MEASURE', category_id: 2, subcategory_id: 2.1, description: 'Test sets and metrics used.', order_no: 1 },
          { function: 'MEASURE', category_id: 2, subcategory_id: 2.2, description: 'Computational bias evaluated.', order_no: 2 },
          { function: 'MEASURE', category_id: 2, subcategory_id: 2.3, description: 'Transparency and documentation assessed.', order_no: 3 },
          { function: 'MEASURE', category_id: 2, subcategory_id: 2.4, description: 'Privacy risks assessed.', order_no: 4 },
          { function: 'MEASURE', category_id: 2, subcategory_id: 2.5, description: 'Environmental impacts evaluated.', order_no: 5 },
          { function: 'MEASURE', category_id: 2, subcategory_id: 2.6, description: 'Safety evaluated for intended use.', order_no: 6 },
          { function: 'MEASURE', category_id: 2, subcategory_id: 2.7, description: 'Security evaluated.', order_no: 7 },
          { function: 'MEASURE', category_id: 2, subcategory_id: 2.8, description: 'Resilience evaluated.', order_no: 8 },
          { function: 'MEASURE', category_id: 2, subcategory_id: 2.9, description: 'Human-AI teaming evaluated.', order_no: 9 },
          { function: 'MEASURE', category_id: 3, subcategory_id: 3.1, description: 'Approaches to track risks implemented.', order_no: 1 },
          { function: 'MEASURE', category_id: 3, subcategory_id: 3.2, description: 'Risk tracking maintained.', order_no: 2 },
          { function: 'MEASURE', category_id: 3, subcategory_id: 3.3, description: 'Feedback integrated into risk measures.', order_no: 3 },
          { function: 'MEASURE', category_id: 4, subcategory_id: 4.1, description: 'Measurement approaches evaluated.', order_no: 1 },
          { function: 'MEASURE', category_id: 4, subcategory_id: 4.2, description: 'Measurement results compared.', order_no: 2 },
          { function: 'MEASURE', category_id: 4, subcategory_id: 4.3, description: 'Measurement approaches updated.', order_no: 3 },
          { function: 'MANAGE', category_id: 1, subcategory_id: 1.1, description: 'Risk treatment options identified.', order_no: 1 },
          { function: 'MANAGE', category_id: 1, subcategory_id: 1.2, description: 'AI risk tolerances determined.', order_no: 2 },
          { function: 'MANAGE', category_id: 1, subcategory_id: 1.3, description: 'Highest priority risks addressed.', order_no: 3 },
          { function: 'MANAGE', category_id: 1, subcategory_id: 1.4, description: 'Negative impacts managed.', order_no: 4 },
          { function: 'MANAGE', category_id: 2, subcategory_id: 2.1, description: 'Resources allocated for risk management.', order_no: 1 },
          { function: 'MANAGE', category_id: 2, subcategory_id: 2.2, description: 'Mechanisms for sustained value.', order_no: 2 },
          { function: 'MANAGE', category_id: 2, subcategory_id: 2.3, description: 'Procedures for responding to issues.', order_no: 3 },
          { function: 'MANAGE', category_id: 2, subcategory_id: 2.4, description: 'Mechanisms for decommissioning AI systems.', order_no: 4 },
          { function: 'MANAGE', category_id: 3, subcategory_id: 3.1, description: 'Third-party AI risks managed.', order_no: 1 },
          { function: 'MANAGE', category_id: 3, subcategory_id: 3.2, description: 'Third-party risk information shared.', order_no: 2 },
          { function: 'MANAGE', category_id: 4, subcategory_id: 4.1, description: 'Post-deployment monitoring.', order_no: 1 },
          { function: 'MANAGE', category_id: 4, subcategory_id: 4.2, description: 'AI incidents documented.', order_no: 2 },
          { function: 'MANAGE', category_id: 4, subcategory_id: 4.3, description: 'AI incidents communicated.', order_no: 3 },
        ];

        for (const subcategory of subcategoriesNIST) {
          const categoryStructId = nistCategoryMap[`${subcategory.function}-${subcategory.category_id}`];
          if (categoryStructId) {
            await queryInterface.sequelize.query(`
              INSERT INTO nist_ai_rmf_subcategories_struct (category_struct_id, function, subcategory_id, description, order_no, is_demo)
              VALUES (:categoryStructId, :function, :subcategory_id, :description, :order_no, false)
              ON CONFLICT (function, subcategory_id) DO NOTHING
            `, {
              replacements: { categoryStructId, function: subcategory.function, subcategory_id: subcategory.subcategory_id, description: subcategory.description, order_no: subcategory.order_no },
              transaction,
            });
          }
        }
      } // end NIST

      await transaction.commit();
      console.log('✅ Framework struct data seeded successfully!');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Seeding failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔄 Rolling back framework struct data...');

      // Delete data in reverse dependency order
      await queryInterface.sequelize.query(`DELETE FROM nist_ai_rmf_subcategories_struct;`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM nist_ai_rmf_categories_struct;`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM annexcontrols_struct_iso27001;`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM annexcategories_struct_iso27001;`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM subclauses_struct_iso27001;`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM clauses_struct_iso27001;`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM annexcategories_struct_iso;`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM subclauses_struct_iso;`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM clauses_struct_iso;`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM subcontrols_struct_eu;`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM controls_struct_eu;`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM controlcategories_struct_eu;`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM questions_struct_eu;`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM subtopics_struct_eu;`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM topics_struct_eu;`, { transaction });

      await transaction.commit();
      console.log('✅ Rollback completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
