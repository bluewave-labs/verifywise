'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration to create nist_ai_rmf_subcategories tables for all tenant schemas
 *
 * This migration fixes the issue where nist_ai_rmf_subcategories tables were not
 * being created for tenant schemas, causing the application to fail when trying
 * to access NIST AI RMF subcategories for specific tenants.
 *
 * The migration:
 * 1. Creates status ENUM if it doesn't exist
 * 2. Creates nist_ai_rmf_subcategories table for each tenant
 * 3. Inserts initial subcategories based on the public.nist_ai_rmf_categories
 * 4. Adds necessary indexes and foreign key constraints
 *
 * @type {import('sequelize-cli').Migration}
 */

// Enhanced logging utility for better production visibility
const logger = {
  info: (msg) => console.log(`[MIGRATION-INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg, error) => console.error(`[MIGRATION-ERROR] ${new Date().toISOString()} - ${msg}`, error ? error.stack || error : ''),
  success: (msg) => console.log(`[MIGRATION-SUCCESS] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[MIGRATION-WARN] ${new Date().toISOString()} - ${msg}`)
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      logger.info('Starting NIST AI RMF subcategories migration for all tenants');

      // Create the status ENUM if it doesn't exist
      await createNistStatusEnumIfNeeded(queryInterface, transaction);

      // Get all organizations for tenant processing
      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction });

      if (organizations[0].length === 0) {
        logger.warn('No organizations found. Skipping tenant table creation.');
        await transaction.commit();
        return;
      }

      logger.info(`Processing ${organizations[0].length} tenant schemas`);

      // Get NIST AI RMF categories to create subcategories from
      const categories = await queryInterface.sequelize.query(`
        SELECT id, title, function_id, index
        FROM public.nist_ai_rmf_categories
        ORDER BY function_id, index;
      `, { transaction });

      if (categories[0].length === 0) {
        logger.error('No NIST AI RMF categories found. Please run the NIST AI RMF categories migration first.');
        throw new Error('NIST AI RMF categories not found. Run the categories migration first.');
      }

      logger.info(`Found ${categories[0].length} NIST AI RMF categories to create subcategories from`);

      // Process each tenant with individual error handling
      let successCount = 0;
      let errorCount = 0;

      for (let organization of organizations[0]) {
        try {
          const tenantHash = getTenantHash(organization.id);
          logger.info(`Processing tenant: ${tenantHash} (org_id: ${organization.id})`);

          await createNistSubcategoriesForTenant(queryInterface, tenantHash, categories[0], transaction);
          successCount++;

        } catch (tenantError) {
          errorCount++;
          logger.error(`Failed to process tenant for org_id ${organization.id}:`, tenantError);
          // Continue with other tenants instead of failing entire migration
        }
      }

      await transaction.commit();
      logger.success(`Migration completed. Success: ${successCount}, Errors: ${errorCount}`);

    } catch (error) {
      await transaction.rollback();
      logger.error('Migration failed and was rolled back:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      logger.info('Starting rollback of NIST AI RMF subcategories from existing tenants');

      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction });

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        logger.info(`Removing nist_ai_rmf_subcategories table from tenant: ${tenantHash}`);

        await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${tenantHash}".nist_ai_rmf_subcategories CASCADE;`, { transaction });
      }

      // Note: We do NOT drop the ENUM types here for several reasons:
      // 1. Other schemas or tables might still be using these ENUMs
      // 2. Dropping ENUMs while they're in use would cause cascade failures
      // 3. Manual intervention is required if ENUMs truly need to be removed

      await transaction.commit();
      logger.success('Successfully rolled back NIST AI RMF subcategories from all tenant schemas');
    } catch (error) {
      await transaction.rollback();
      logger.error('Rollback failed:', error);
      throw error;
    }
  }
};

/**
 * Creates the NIST AI RMF status ENUM if it doesn't exist
 */
async function createNistStatusEnumIfNeeded(queryInterface, transaction) {
  try {
    // Check if nist_ai_rmf_subcategories_status ENUM exists
    const [statusEnumExists] = await queryInterface.sequelize.query(`
      SELECT 1 FROM pg_type WHERE typname = 'enum_nist_ai_rmf_subcategories_status'
    `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

    if (!statusEnumExists) {
      logger.info('Creating enum_nist_ai_rmf_subcategories_status ENUM type');
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_nist_ai_rmf_subcategories_status AS ENUM (
          'Not started',
          'Draft',
          'In progress',
          'Awaiting review',
          'Awaiting approval',
          'Implemented',
          'Needs rework',
          'Audited'
        );
      `, { transaction });
    } else {
      logger.info('enum_nist_ai_rmf_subcategories_status already exists, skipping creation');
    }

  } catch (error) {
    logger.error('Failed to create/validate NIST AI RMF status ENUM:', error);
    throw error;
  }
}

/**
 * Creates nist_ai_rmf_subcategories table for a specific tenant
 */
async function createNistSubcategoriesForTenant(queryInterface, tenantHash, categories, transaction) {
  // Check if table already exists to avoid unnecessary work
  const [tableExists] = await queryInterface.sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = '${tenantHash}' AND table_name = 'nist_ai_rmf_subcategories'
  `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

  if (tableExists) {
    logger.info(`nist_ai_rmf_subcategories table already exists for tenant ${tenantHash}, skipping creation`);
    return;
  }

  // Create the table
  const createTableQuery = `
    CREATE TABLE "${tenantHash}".nist_ai_rmf_subcategories (
      id SERIAL PRIMARY KEY,
      index INTEGER,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      implementation_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP,
      is_demo BOOLEAN DEFAULT FALSE,
      status enum_nist_ai_rmf_subcategories_status DEFAULT 'Not started',
      auditor_feedback TEXT,
      owner INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
      reviewer INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
      approver INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
      due_date DATE,
      evidence_links JSONB DEFAULT '[]',
      tags TEXT[],
      category_id INTEGER REFERENCES public.nist_ai_rmf_categories(id) ON DELETE CASCADE
    );
  `;

  await queryInterface.sequelize.query(createTableQuery, { transaction });

  // Create indexes
  const indexQueries = [
    `CREATE INDEX "${tenantHash}_nist_ai_rmf_subcategories_category_id_idx" ON "${tenantHash}".nist_ai_rmf_subcategories (category_id);`,
    `CREATE INDEX "${tenantHash}_nist_ai_rmf_subcategories_status_idx" ON "${tenantHash}".nist_ai_rmf_subcategories (status);`,
    `CREATE INDEX "${tenantHash}_nist_ai_rmf_subcategories_owner_idx" ON "${tenantHash}".nist_ai_rmf_subcategories (owner);`,
    `CREATE INDEX "${tenantHash}_nist_ai_rmf_subcategories_created_at_idx" ON "${tenantHash}".nist_ai_rmf_subcategories (created_at);`
  ];

  for (const query of indexQueries) {
    await queryInterface.sequelize.query(query, { transaction });
  }

  // Insert initial subcategories based on categories
  // Each category becomes a subcategory for the tenant
  const insertValues = categories.map(category => {
    const cleanDescription = category.description ? category.description.replace(/'/g, "''") : '';
    return `(${category.index}, '${category.title}', '${cleanDescription}', ${category.id})`;
  }).join(', ');

  if (insertValues) {
    // Let's insert subcategories one by one to better handle any errors
    let insertedCount = 0;
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const cleanDescription = category.description ? category.description.replace(/'/g, "''") : '';

      const singleInsertQuery = `
        INSERT INTO "${tenantHash}".nist_ai_rmf_subcategories (
          index, title, description, category_id, created_at, updated_at
        ) VALUES (${category.index}, '${category.title}', '${cleanDescription}', ${category.id}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `;

      try {
        await queryInterface.sequelize.query(singleInsertQuery, { transaction });
        insertedCount++;
      } catch (singleInsertError) {
        logger.error(`Failed to insert subcategory ${category.title} for tenant ${tenantHash}:`, singleInsertError);
        logger.error(`Query was: ${singleInsertQuery}`);
        throw singleInsertError;
      }
    }

    logger.info(`Successfully inserted ${insertedCount} subcategories for tenant ${tenantHash}`);
  }

  logger.success(`Successfully created nist_ai_rmf_subcategories table for tenant: ${tenantHash} with ${categories.length} subcategories`);
}