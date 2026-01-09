'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Create NIST AI RMF Functions table (public schema)
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS public.nist_ai_rmf_functions (
          id SERIAL PRIMARY KEY,
          type VARCHAR(50) NOT NULL UNIQUE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          framework_id INTEGER REFERENCES public.frameworks(id),
          created_at TIMESTAMP DEFAULT NOW(),
          is_demo BOOLEAN DEFAULT FALSE,
          index INTEGER
        );
      `, { transaction });

      // Create NIST AI RMF Categories table (public schema)
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS public.nist_ai_rmf_categories (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          function_id INTEGER REFERENCES public.nist_ai_rmf_functions(id) ON DELETE CASCADE,
          index INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(function_id, index)
        );
      `, { transaction });

  
      // Insert NIST AI RMF Functions
      await queryInterface.sequelize.query(`
        INSERT INTO public.nist_ai_rmf_functions (type, title, description, framework_id, index) VALUES
        ('Govern', 'GOVERN', 'This function establishes an AI risk management culture and policies across the organization.', 4, 1),
        ('Map', 'MAP', 'This function frames the context and scope of AI risks.', 4, 2),
        ('Measure', 'MEASURE', 'This function defines how AI risks and trustworthiness are evaluated.', 4, 3),
        ('Manage', 'MANAGE', 'This function specifies how identified risks are addressed.', 4, 4)
        ON CONFLICT DO NOTHING;
      `, { transaction });

      // Insert NIST AI RMF Categories based on official NIST AI RMF structure
      await queryInterface.sequelize.query(`
        INSERT INTO public.nist_ai_rmf_categories (id, title, description, function_id, index) VALUES
        -- GOVERN Categories (6 categories)
        (1, 'GOVERN', 'Policies, processes, procedures, and practices across the organization related to the mapping, measuring, and managing of AI risks are in place, transparent, and implemented effectively.', 1, 1),
        (2, 'GOVERN', 'Accountability structures are in place so that the appropriate teams and individuals are empowered, responsible, and trained for mapping, measuring, and managing AI risks.', 1, 2),
        (3, 'GOVERN', 'Workforce diversity, equity, inclusion, and accessibility processes are prioritized in the mapping, measuring, and managing of AI risks throughout the lifecycle.', 1, 3),
        (4, 'GOVERN', 'Organizational teams are committed to a culture that considers and communicates AI risk.', 1, 4),
        (5, 'GOVERN', 'Processes are in place for robust engagement with relevant AI actors.', 1, 5),
        (6, 'GOVERN', 'Policies and procedures are in place to address AI risks and benefits arising from third-party software and data and other supply chain issues.', 1, 6),

        -- MAP Categories (5 categories)
        (7, 'MAP', 'Context is established and understood.', 2, 1),
        (8, 'MAP', 'Categorization of the AI system is performed.', 2, 2),
        (9, 'MAP', 'AI capabilities, targeted usage, goals, and expected benefits and costs compared with appropriate benchmarks are understood.', 2, 3),
        (10, 'MAP', 'Risks and benefits are mapped for all components of the AI system including third-party software and data.', 2, 4),
        (11, 'MAP', 'Impacts to individuals, groups, communities, organizations, and society are characterized.', 2, 5),

        -- MEASURE Categories (4 categories)
        (12, 'MEASURE', 'Appropriate methods and metrics are identified and applied.', 3, 1),
        (13, 'MEASURE', 'AI systems are evaluated for trustworthy characteristics.', 3, 2),
        (14, 'MEASURE', 'Mechanisms for tracking identified AI risks over time are in place.', 3, 3),
        (15, 'MEASURE', 'Feedback about efficacy of measurement is gathered and assessed.', 3, 4),

        -- MANAGE Categories (4 categories)
        (16, 'MANAGE', 'AI risks based on assessments and other analytical output from the MAP and MEASURE functions are prioritized, responded to, and managed.', 4, 1),
        (17, 'MANAGE', 'Strategies to maximize AI benefits and minimize negative impacts are planned, prepared, implemented, documented, and informed by input from relevant AI actors.', 4, 2),
        (18, 'MANAGE', 'AI risks and benefits from third-party entities are managed.', 4, 3),
        (19, 'MANAGE', 'Risk treatments, including response and triage, and incident response plans, procedures and processes are documented and monitored regularly.', 4, 4)
        ON CONFLICT DO NOTHING;
      `, { transaction });

  
      await transaction.commit();
      console.log('✅ NIST AI RMF correct tables created successfully');
      console.log(`✅ Created 4 functions`);
      console.log(`✅ Created 19 categories`);
      console.log(`✅ Subcategories will be created in tenant schemas as needed`);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS public.nist_ai_rmf_categories CASCADE;', { transaction });
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS public.nist_ai_rmf_functions CASCADE;', { transaction });

      await transaction.commit();
      console.log('✅ NIST AI RMF correct tables dropped successfully');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};