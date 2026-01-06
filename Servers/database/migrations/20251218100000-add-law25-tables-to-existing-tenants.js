'use strict';

const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration to create Law-25 requirements tables for all existing tenant schemas
 *
 * This migration creates the table structure for requirements_law25 and
 * requirements_law25__risks in each existing tenant schema.
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
      logger.info('Starting Law-25 tables migration for all existing tenants');

      // Get all organizations for tenant processing
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

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

          await createLaw25TablesForTenant(queryInterface, tenantHash, transaction);
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
      logger.info('Starting rollback of Law-25 tables from existing tenants');

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        logger.info(`Removing Law-25 tables from tenant: ${tenantHash}`);

        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".requirements_law25__risks CASCADE;`,
          { transaction }
        );
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".requirements_law25 CASCADE;`,
          { transaction }
        );
      }

      await transaction.commit();
      logger.success('Successfully rolled back Law-25 tables from all tenant schemas');
    } catch (error) {
      await transaction.rollback();
      logger.error('Rollback failed:', error);
      throw error;
    }
  }
};

/**
 * Creates Law-25 tables for a specific tenant
 */
async function createLaw25TablesForTenant(queryInterface, tenantHash, transaction) {
  // Check if table already exists
  const [tableExists] = await queryInterface.sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = '${tenantHash}' AND table_name = 'requirements_law25'
  `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

  if (tableExists) {
    logger.info(`requirements_law25 table already exists for tenant ${tenantHash}, skipping creation`);
    return;
  }

  // Create requirements_law25 table
  const createRequirementsTable = `
    CREATE TABLE "${tenantHash}".requirements_law25 (
      id SERIAL PRIMARY KEY,
      requirement_meta_id INTEGER NOT NULL REFERENCES public.requirements_struct_law25(id) ON DELETE CASCADE,
      projects_frameworks_id INTEGER NOT NULL REFERENCES "${tenantHash}".projects_frameworks(id) ON DELETE CASCADE,
      implementation_description TEXT,
      evidence_links JSONB DEFAULT '[]',
      status enum_requirements_law25_status DEFAULT 'Not started',
      owner INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
      reviewer INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
      approver INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
      due_date DATE,
      auditor_feedback TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_demo BOOLEAN DEFAULT FALSE
    );
  `;

  await queryInterface.sequelize.query(createRequirementsTable, { transaction });

  // Create indexes for requirements_law25
  const requirementIndexes = [
    `CREATE INDEX "${tenantHash}_requirements_law25_projects_frameworks_id_idx" ON "${tenantHash}".requirements_law25 (projects_frameworks_id);`,
    `CREATE INDEX "${tenantHash}_requirements_law25_requirement_meta_id_idx" ON "${tenantHash}".requirements_law25 (requirement_meta_id);`,
    `CREATE INDEX "${tenantHash}_requirements_law25_status_idx" ON "${tenantHash}".requirements_law25 (status);`,
    `CREATE INDEX "${tenantHash}_requirements_law25_owner_idx" ON "${tenantHash}".requirements_law25 (owner);`
  ];

  for (const query of requirementIndexes) {
    await queryInterface.sequelize.query(query, { transaction });
  }

  // Create requirements_law25__risks junction table
  const createRisksTable = `
    CREATE TABLE "${tenantHash}".requirements_law25__risks (
      id SERIAL PRIMARY KEY,
      requirement_id INTEGER NOT NULL REFERENCES "${tenantHash}".requirements_law25(id) ON DELETE CASCADE,
      projects_risks_id INTEGER NOT NULL REFERENCES "${tenantHash}".risks(id) ON DELETE CASCADE,
      UNIQUE(requirement_id, projects_risks_id)
    );
  `;

  await queryInterface.sequelize.query(createRisksTable, { transaction });

  // Create indexes for junction table
  const riskIndexes = [
    `CREATE INDEX "${tenantHash}_requirements_law25__risks_requirement_id_idx" ON "${tenantHash}".requirements_law25__risks (requirement_id);`,
    `CREATE INDEX "${tenantHash}_requirements_law25__risks_projects_risks_id_idx" ON "${tenantHash}".requirements_law25__risks (projects_risks_id);`
  ];

  for (const query of riskIndexes) {
    await queryInterface.sequelize.query(query, { transaction });
  }

  logger.success(`Successfully created Law-25 tables for tenant: ${tenantHash}`);
}
