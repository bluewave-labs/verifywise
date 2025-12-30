'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".api_tokens (
            id SERIAL PRIMARY KEY,
            token TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ,
            created_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL
          );
        `, { transaction });
      }

      // Check if pg_cron extension is available
      const [extensions] = await queryInterface.sequelize.query(
        `SELECT * FROM pg_available_extensions WHERE name = 'pg_cron';`,
        { transaction }
      );
      if (extensions.length > 0) {
        // Enable pg_cron extension (only needs to be done once)
        await queryInterface.sequelize.query(
          `CREATE EXTENSION IF NOT EXISTS pg_cron;`,
          { transaction }
        );

        // Schedule cleanup job for all tenant schemas (runs every hour)
        await queryInterface.sequelize.query(`
          SELECT cron.schedule(
            'delete-expired-api-tokens',
            '0 * * * *',
            $$
            DO $body$
            DECLARE
              tenant_schema TEXT;
            BEGIN
              FOR tenant_schema IN 
                SELECT schema_name 
                FROM information_schema.schemata 
                WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
                  AND schema_name NOT LIKE 'pg_%'
              LOOP
                IF EXISTS (
                  SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = tenant_schema 
                  AND table_name = 'api_tokens'
                ) THEN
                  EXECUTE format('DELETE FROM %I.api_tokens WHERE expires_at < NOW()', tenant_schema);
                END IF;
              END LOOP;
            END $body$;
            $$
          );`, { transaction });
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
      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".api_tokens;
        `, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
