'use strict';

const { NIST_AI_RMF_Structure } = require("../../dist/structures/NIST-AI-RMF/nist-ai-rmf.structure");

/**
 * Migration to seed NIST AI RMF structure data into public schema tables
 *
 * This migration populates the nist_ai_rmf_functions and nist_ai_rmf_categories
 * tables with the official NIST AI RMF framework structure. This data serves as
 * the template for creating tenant-specific subcategory implementations.
 *
 * The migration:
 * 1. Seeds the 4 core functions (Govern, Map, Measure, Manage)
 * 2. Seeds the 19 categories across all functions
 * 3. Establishes proper function-category relationships
 * 4. Uses framework_id = 4 for NIST AI RMF
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('[NIST AI RMF] Starting structure data seeding...');

      // Step 1: Check if functions already exist, then insert if needed
      console.log('[NIST AI RMF] Checking functions...');
      const [existingFunctions] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM public.nist_ai_rmf_functions WHERE framework_id = 4;
      `, { transaction });

      if (existingFunctions[0].count === 0) {
        console.log('[NIST AI RMF] Seeding functions...');
        await queryInterface.sequelize.query(`
          INSERT INTO public.nist_ai_rmf_functions (type, title, description, framework_id, index) VALUES
          ('Govern', 'GOVERN', 'This function establishes an AI risk management culture and policies across the organization.', 4, 1),
          ('Map', 'MAP', 'This function frames the context and scope of AI risks.', 4, 2),
          ('Measure', 'MEASURE', 'This function defines how AI risks and trustworthiness are evaluated.', 4, 3),
          ('Manage', 'MANAGE', 'This function specifies how identified risks are addressed.', 4, 4);
        `, { transaction });
      } else {
        console.log('[NIST AI RMF] Functions already exist, skipping...');
      }

      // Step 2: Get function IDs for mapping
      const [functions] = await queryInterface.sequelize.query(`
        SELECT id, type FROM public.nist_ai_rmf_functions WHERE framework_id = 4 ORDER BY index;
      `, { transaction });

      const functionMap = {};
      functions.forEach(func => {
        functionMap[func.type] = func.id;
      });

      console.log('[NIST AI RMF] Function mapping created:', functionMap);

      // Step 3: Check existing categories and seed if needed
      console.log('[NIST AI RMF] Checking categories...');
      const [existingCategories] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM public.nist_ai_rmf_categories
        WHERE function_id IN (SELECT id FROM public.nist_ai_rmf_functions WHERE framework_id = 4);
      `, { transaction });

      if (existingCategories[0].count === 0) {
        console.log('[NIST AI RMF] Seeding categories...');
        for (const func of NIST_AI_RMF_Structure.functions) {
          const functionId = functionMap[func.type];

          if (!functionId) {
            console.warn(`[NIST AI RMF] Warning: Function ID not found for type: ${func.type}`);
            continue;
          }

          for (const category of func.categories) {
            const cleanDescription = category.description ? category.description.replace(/'/g, "''") : '';

            await queryInterface.sequelize.query(`
              INSERT INTO public.nist_ai_rmf_categories (
                title, description, function_id, index, created_at
              ) VALUES (
                '${category.title}',
                '${cleanDescription}',
                ${functionId},
                ${category.index},
                NOW()
              );
            `, { transaction });
          }
        }
      } else {
        console.log('[NIST AI RMF] Categories already exist, skipping...');
      }

      await transaction.commit();

      // Verify the data was seeded correctly
      const [categoryCount] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM public.nist_ai_rmf_categories
        WHERE function_id IN (SELECT id FROM public.nist_ai_rmf_functions WHERE framework_id = 4);
      `);

      console.log(`✅ [NIST AI RMF] Structure data seeded successfully!`);
      console.log(`✅ [NIST AI RMF] Functions: 4`);
      console.log(`✅ [NIST AI RMF] Categories: ${categoryCount[0].count}`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ [NIST AI RMF] Failed to seed structure data:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('[NIST AI RMF] Rolling back structure data seeding...');

      // Delete categories first (due to foreign key constraint)
      await queryInterface.sequelize.query(`
        DELETE FROM public.nist_ai_rmf_categories
        WHERE function_id IN (
          SELECT id FROM public.nist_ai_rmf_functions WHERE framework_id = 4
        );
      `, { transaction });

      // Delete functions
      await queryInterface.sequelize.query(`
        DELETE FROM public.nist_ai_rmf_functions WHERE framework_id = 4;
      `, { transaction });

      await transaction.commit();
      console.log('✅ [NIST AI RMF] Structure data rollback completed successfully');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ [NIST AI RMF] Failed to rollback structure data:', error);
      throw error;
    }
  }
};