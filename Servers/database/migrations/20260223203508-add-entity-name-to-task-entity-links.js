'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration to add entity_name column to task_entity_links table
 * This stores the display name for the linked entity
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
      logger.info('Starting entity_name column addition to task_entity_links');

      // Get all organizations for tenant processing
      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction });

      if (organizations[0].length === 0) {
        logger.warn('No organizations found. Skipping.');
        await transaction.commit();
        return;
      }

      logger.info(`Processing ${organizations[0].length} tenant schemas`);

      let successCount = 0;
      let skipCount = 0;

      for (let organization of organizations[0]) {
        try {
          const tenantHash = getTenantHash(organization.id);

          // Check if table exists
          const [tableExists] = await queryInterface.sequelize.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = '${tenantHash}' AND table_name = 'task_entity_links'
          `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

          if (!tableExists) {
            logger.warn(`task_entity_links table does not exist for tenant ${tenantHash}, skipping`);
            skipCount++;
            continue;
          }

          // Check if column already exists
          const [columnExists] = await queryInterface.sequelize.query(`
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = '${tenantHash}'
              AND table_name = 'task_entity_links'
              AND column_name = 'entity_name'
          `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

          if (columnExists) {
            logger.info(`entity_name column already exists for tenant ${tenantHash}, skipping`);
            skipCount++;
            continue;
          }

          // Add entity_name column
          await queryInterface.sequelize.query(`
            ALTER TABLE "${tenantHash}".task_entity_links
            ADD COLUMN entity_name VARCHAR(500);
          `, { transaction });

          successCount++;
          logger.success(`Added entity_name column for tenant: ${tenantHash}`);

        } catch (tenantError) {
          logger.error(`Failed to process tenant for org_id ${organization.id}:`, tenantError);
          throw tenantError;
        }
      }

      await transaction.commit();
      logger.success(`Migration completed. Added: ${successCount}, Skipped: ${skipCount}`);

    } catch (error) {
      await transaction.rollback();
      logger.error('Migration failed and was rolled back:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      logger.info('Starting rollback of entity_name column from task_entity_links');

      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction });

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Check if column exists before trying to drop
        const [columnExists] = await queryInterface.sequelize.query(`
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${tenantHash}'
            AND table_name = 'task_entity_links'
            AND column_name = 'entity_name'
        `, { transaction, type: queryInterface.sequelize.QueryTypes.SELECT });

        if (columnExists) {
          await queryInterface.sequelize.query(`
            ALTER TABLE "${tenantHash}".task_entity_links
            DROP COLUMN entity_name;
          `, { transaction });
          logger.info(`Removed entity_name column from tenant: ${tenantHash}`);
        }
      }

      await transaction.commit();
      logger.success('Successfully rolled back entity_name column from all tenant schemas');
    } catch (error) {
      await transaction.rollback();
      logger.error('Rollback failed:', error);
      throw error;
    }
  }
};
