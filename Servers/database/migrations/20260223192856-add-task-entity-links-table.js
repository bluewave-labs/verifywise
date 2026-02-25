'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration to add task_entity_links table to all existing tenant schemas
 *
 * This table links tasks to various entities:
 * - vendor: Links to vendors table
 * - model: Links to model_inventories table
 * - policy: Links to policy_manager table
 * - nist_subcategory: Links to nist_ai_rmf_subcategories table
 * - iso42001_subclause: Links to subclauses_iso table
 * - iso42001_annexcategory: Links to annexcategories_iso table
 * - iso27001_subclause: Links to subclauses_iso27001 table
 * - iso27001_annexcontrol: Links to annexcontrols_iso27001 table
 * - eu_control: Links to controls_eu table
 * - eu_subcontrol: Links to subcontrols_eu table
 *
 * @type {import('sequelize-cli').Migration}
 */

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
      logger.info('Starting task_entity_links table migration for existing tenants');

      // Create ENUM type for entity_type
      await createEntityTypeEnumIfNeeded(queryInterface, transaction);

      // Get all organizations for tenant processing
      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction });

      if (organizations[0].length === 0) {
        logger.warn('No organizations found. Skipping tenant table creation.');
        await transaction.commit();
        return;
      }

      logger.info(`Processing ${organizations[0].length} tenant schemas`);

      let successCount = 0;
      let errorCount = 0;

      for (let organization of organizations[0]) {
        try {
          const tenantHash = getTenantHash(organization.id);
          logger.info(`Processing tenant: ${tenantHash} (org_id: ${organization.id})`);

          await createTaskEntityLinksForTenant(queryInterface, tenantHash, transaction);
          successCount++;

        } catch (tenantError) {
          errorCount++;
          logger.error(`Failed to process tenant for org_id ${organization.id}:`, tenantError);
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
      logger.info('Starting rollback of task_entity_links table from existing tenants');

      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction });

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        logger.info(`Removing task_entity_links table from tenant: ${tenantHash}`);

        await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${tenantHash}".task_entity_links CASCADE;`, { transaction });
      }

      await transaction.commit();
      logger.success('Successfully rolled back task_entity_links table from all tenant schemas');
    } catch (error) {
      await transaction.rollback();
      logger.error('Rollback failed:', error);
      throw error;
    }
  }
};

/**
 * Create ENUM type for entity_type if it doesn't exist
 */
async function createEntityTypeEnumIfNeeded(queryInterface, transaction) {
  try {
    const [enumExists] = await queryInterface.sequelize.query(`
      SELECT 1 FROM pg_type WHERE typname = 'enum_task_entity_links_entity_type'
    `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

    if (!enumExists) {
      logger.info('Creating enum_task_entity_links_entity_type ENUM type');
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_task_entity_links_entity_type AS ENUM (
          'vendor',
          'model',
          'policy',
          'nist_subcategory',
          'iso42001_subclause',
          'iso42001_annexcategory',
          'iso27001_subclause',
          'iso27001_annexcontrol',
          'eu_control',
          'eu_subcontrol'
        );
      `, { transaction });
    } else {
      logger.info('enum_task_entity_links_entity_type already exists, skipping creation');
    }
  } catch (error) {
    logger.error('Failed to create entity_type ENUM:', error);
    throw error;
  }
}

/**
 * Creates task_entity_links table for a specific tenant
 */
async function createTaskEntityLinksForTenant(queryInterface, tenantHash, transaction) {
  // Check if table already exists
  const [tableExists] = await queryInterface.sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = '${tenantHash}' AND table_name = 'task_entity_links'
  `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

  if (tableExists) {
    logger.info(`task_entity_links table already exists for tenant ${tenantHash}, skipping creation`);
    return;
  }

  // Check if tasks table exists for this tenant
  const [tasksTableExists] = await queryInterface.sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = '${tenantHash}' AND table_name = 'tasks'
  `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

  if (!tasksTableExists) {
    logger.warn(`tasks table does not exist for tenant ${tenantHash}, skipping task_entity_links creation`);
    return;
  }

  const queries = [
    // Task entity links table creation
    `CREATE TABLE "${tenantHash}".task_entity_links (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL,
      entity_id INTEGER NOT NULL,
      entity_type enum_task_entity_links_entity_type NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      CONSTRAINT task_entity_links_task_id_fkey FOREIGN KEY (task_id)
        REFERENCES "${tenantHash}".tasks (id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT unique_task_entity_link UNIQUE (task_id, entity_id, entity_type)
    );`,

    // Indexes for efficient querying
    `CREATE INDEX "${tenantHash}_task_entity_links_task_id_idx" ON "${tenantHash}".task_entity_links (task_id);`,
    `CREATE INDEX "${tenantHash}_task_entity_links_entity_type_idx" ON "${tenantHash}".task_entity_links (entity_type);`,
    `CREATE INDEX "${tenantHash}_task_entity_links_entity_id_entity_type_idx" ON "${tenantHash}".task_entity_links (entity_id, entity_type);`
  ];

  for (const [index, query] of queries.entries()) {
    try {
      await queryInterface.sequelize.query(query, { transaction });
    } catch (queryError) {
      logger.error(`Failed to execute query ${index + 1} for tenant ${tenantHash}:`, queryError);
      logger.error(`Query was: ${query}`);
      throw queryError;
    }
  }

  logger.success(`Successfully created task_entity_links table for tenant: ${tenantHash}`);
}
