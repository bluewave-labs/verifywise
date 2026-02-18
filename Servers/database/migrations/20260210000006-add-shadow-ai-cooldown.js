'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'organizations'
        );`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      if (!tableExists[0].exists) {
        console.log('Organizations table does not exist yet. Skipping shadow AI cooldown migration.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Check schema exists
        const [schemaExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = :schema);`,
          { transaction, type: Sequelize.QueryTypes.SELECT, replacements: { schema: tenantHash } }
        );

        if (!schemaExists.exists) {
          console.log(`Schema ${tenantHash} does not exist. Skipping.`);
          continue;
        }

        // Add cooldown_minutes column to shadow_ai_rules
        const [colExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = :schema
            AND table_name = 'shadow_ai_rules'
            AND column_name = 'cooldown_minutes'
          );`,
          { transaction, type: Sequelize.QueryTypes.SELECT, replacements: { schema: tenantHash } }
        );

        if (!colExists.exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".shadow_ai_rules
             ADD COLUMN cooldown_minutes INTEGER DEFAULT 1440;`,
            { transaction }
          );
        }

        // Add index on shadow_ai_alert_history(rule_id, fired_at) for cooldown lookups
        await queryInterface.sequelize.query(
          `CREATE INDEX IF NOT EXISTS idx_shadow_alert_history_cooldown
           ON "${tenantHash}".shadow_ai_alert_history(rule_id, fired_at);`,
          { transaction }
        );

        console.log(`Added cooldown_minutes column and alert history index for tenant: ${tenantHash}`);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'organizations'
        );`,
        { transaction, type: Sequelize.QueryTypes.SELECT }
      );

      if (!tableExists[0].exists) {
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        const [schemaExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = :schema);`,
          { transaction, type: Sequelize.QueryTypes.SELECT, replacements: { schema: tenantHash } }
        );

        if (!schemaExists.exists) continue;

        await queryInterface.sequelize.query(
          `DROP INDEX IF EXISTS "${tenantHash}".idx_shadow_alert_history_cooldown;`,
          { transaction }
        );

        const [colExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = :schema
            AND table_name = 'shadow_ai_rules'
            AND column_name = 'cooldown_minutes'
          );`,
          { transaction, type: Sequelize.QueryTypes.SELECT, replacements: { schema: tenantHash } }
        );

        if (colExists.exists) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".shadow_ai_rules DROP COLUMN cooldown_minutes;`,
            { transaction }
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
