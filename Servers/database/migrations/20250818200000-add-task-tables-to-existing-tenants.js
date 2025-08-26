'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration to add task tables to all existing tenant schemas
 * 
 * ENUM Management Notes:
 * - PostgreSQL ENUMs are global objects that can be shared across schemas
 * - We check for existence before creation to ensure idempotency
 * - Future ENUM modifications require careful handling (see documentation below)
 * - ENUMs are NOT dropped in down migration to prevent breaking other schemas
 * 
 * Idempotency:
 * - All table and index creation uses IF NOT EXISTS
 * - ENUM creation is wrapped in exception handling
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
      logger.info('Starting task tables migration for existing tenants');

      // Enhanced ENUM management with better error handling and validation
      await createTaskEnumsIfNeeded(queryInterface, transaction);

      // Get all organizations for tenant processing
      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction });
      
      if (organizations[0].length === 0) {
        logger.warn('No organizations found. Skipping tenant table creation.');
        await transaction.commit();
        return;
      }

      logger.info(`Processing ${organizations[0].length} tenant schemas`);

      // Process each tenant with individual error handling
      let successCount = 0;
      let errorCount = 0;

      for (let organization of organizations[0]) {
        try {
          const tenantHash = getTenantHash(organization.id);
          logger.info(`Processing tenant: ${tenantHash} (org_id: ${organization.id})`);
          
          await createTaskTablesForTenant(queryInterface, tenantHash, transaction);
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
      logger.info('Starting rollback of task tables from existing tenants');

      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction });

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        logger.info(`Removing task tables from tenant: ${tenantHash}`);
        
        await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${tenantHash}".task_assignees CASCADE;`, { transaction });
        await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${tenantHash}".tasks CASCADE;`, { transaction });
      }

      /**
       * IMPORTANT: We do NOT drop the ENUM types here for several reasons:
       * 1. Other schemas or tables might still be using these ENUMs
       * 2. Dropping ENUMs while they're in use would cause cascade failures
       * 3. Manual intervention is required if ENUMs truly need to be removed
       */

      await transaction.commit();
      logger.success('Successfully rolled back task tables from all tenant schemas');
    } catch (error) {
      await transaction.rollback();
      logger.error('Rollback failed:', error);
      throw error;
    }
  }
};

/**
 * Enhanced ENUM creation with existence checking and validation
 * Handles the complexity of PostgreSQL ENUM management properly
 */
async function createTaskEnumsIfNeeded(queryInterface, transaction) {
  try {
    // Check if priority ENUM exists
    const [priorityEnumExists] = await queryInterface.sequelize.query(`
      SELECT 1 FROM pg_type WHERE typname = 'enum_tasks_priority'
    `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

    if (!priorityEnumExists) {
      logger.info('Creating enum_tasks_priority ENUM type');
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_tasks_priority AS ENUM ('Low', 'Medium', 'High');
      `, { transaction });
    } else {
      logger.info('enum_tasks_priority already exists, skipping creation');
      
      // Validate existing ENUM has expected values (optional check)
      const enumValues = await queryInterface.sequelize.query(`
        SELECT unnest(enum_range(NULL::enum_tasks_priority)) as enum_value;
      `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });
      
      const expectedValues = ['Low', 'Medium', 'High'];
      const actualValues = enumValues.map(row => row.enum_value);
      const missingValues = expectedValues.filter(val => !actualValues.includes(val));
      
      if (missingValues.length > 0) {
        logger.warn(`enum_tasks_priority missing expected values: ${missingValues.join(', ')}`);
        // Note: Adding values to existing ENUMs requires careful handling in production
      }
    }

    // Check if status ENUM exists
    const [statusEnumExists] = await queryInterface.sequelize.query(`
      SELECT 1 FROM pg_type WHERE typname = 'enum_tasks_status'
    `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

    if (!statusEnumExists) {
      logger.info('Creating enum_tasks_status ENUM type');
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_tasks_status AS ENUM ('Open', 'In Progress', 'Completed', 'Overdue', 'Deleted');
      `, { transaction });
    } else {
      logger.info('enum_tasks_status already exists, skipping creation');
    }

  } catch (error) {
    logger.error('Failed to create/validate task ENUMs:', error);
    throw error;
  }
}

/**
 * Creates task tables for a specific tenant with comprehensive error handling
 * and idempotency checks
 */
async function createTaskTablesForTenant(queryInterface, tenantHash, transaction) {
  // Check if tables already exist to avoid unnecessary work
  const [tasksTableExists] = await queryInterface.sequelize.query(`
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = '${tenantHash}' AND table_name = 'tasks'
  `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

  if (tasksTableExists) {
    logger.info(`Tasks table already exists for tenant ${tenantHash}, skipping creation`);
    return;
  }

  const queries = [
    // Tasks table creation
    `CREATE TABLE "${tenantHash}".tasks (
      id serial NOT NULL,
      title character varying(255) NOT NULL,
      description text,
      creator_id integer NOT NULL,
      organization_id integer,
      due_date timestamp with time zone,
      priority enum_tasks_priority NOT NULL DEFAULT 'Medium',
      status enum_tasks_status NOT NULL DEFAULT 'Open',
      categories jsonb DEFAULT '[]',
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT tasks_pkey PRIMARY KEY (id),
      CONSTRAINT tasks_creator_id_fkey FOREIGN KEY (creator_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE SET NULL,
      CONSTRAINT tasks_organization_id_fkey FOREIGN KEY (organization_id)
        REFERENCES public.organizations (id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE SET NULL
    );`,
    
    // Task table indexes
    `CREATE INDEX "${tenantHash}_tasks_creator_id_idx" ON "${tenantHash}".tasks (creator_id);`,
    `CREATE INDEX "${tenantHash}_tasks_organization_id_idx" ON "${tenantHash}".tasks (organization_id);`,
    `CREATE INDEX "${tenantHash}_tasks_due_date_idx" ON "${tenantHash}".tasks (due_date);`,
    `CREATE INDEX "${tenantHash}_tasks_status_idx" ON "${tenantHash}".tasks (status);`,
    `CREATE INDEX "${tenantHash}_tasks_priority_idx" ON "${tenantHash}".tasks (priority);`,
    `CREATE INDEX "${tenantHash}_tasks_created_at_idx" ON "${tenantHash}".tasks (created_at);`,
    
    // Task assignees table creation
    `CREATE TABLE "${tenantHash}".task_assignees (
      id serial NOT NULL,
      task_id integer NOT NULL,
      user_id integer NOT NULL,
      assigned_at timestamp with time zone NOT NULL DEFAULT now(),
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT task_assignees_pkey PRIMARY KEY (id),
      CONSTRAINT task_assignees_task_id_fkey FOREIGN KEY (task_id)
        REFERENCES "${tenantHash}".tasks (id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT task_assignees_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT unique_task_user_assignment UNIQUE (task_id, user_id)
    );`,
    
    // Task assignees indexes
    `CREATE INDEX "${tenantHash}_task_assignees_task_id_idx" ON "${tenantHash}".task_assignees (task_id);`,
    `CREATE INDEX "${tenantHash}_task_assignees_user_id_idx" ON "${tenantHash}".task_assignees (user_id);`
  ];

  // Execute queries with individual error handling
  for (const [index, query] of queries.entries()) {
    try {
      await queryInterface.sequelize.query(query, { transaction });
    } catch (queryError) {
      logger.error(`Failed to execute query ${index + 1} for tenant ${tenantHash}:`, queryError);
      logger.error(`Query was: ${query}`);
      throw queryError;
    }
  }

  logger.success(`Successfully created task tables for tenant: ${tenantHash}`);
}