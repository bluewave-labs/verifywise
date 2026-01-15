"use strict";

const { Sequelize, QueryTypes } = require("sequelize");

/**
 * Migration to add github_tokens table to all tenant schemas.
 * This table stores encrypted GitHub Personal Access Tokens for private repository scanning.
 *
 * This is a separate migration because the AI Detection tables migration was already run
 * before this feature was added.
 */
module.exports = {
  async up(queryInterface) {
    // Get all tenant schema names
    const schemas = await queryInterface.sequelize.query(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: QueryTypes.SELECT }
    );

    for (const schema of schemas) {
      const tenantHash = schema.schema_name;
      console.log(`Adding github_tokens table to schema: ${tenantHash}`);

      try {
        // Check if table already exists
        const tableExists = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'github_tokens'
          )`,
          { type: QueryTypes.SELECT }
        );

        if (tableExists[0].exists) {
          console.log(`  github_tokens table already exists in ${tenantHash}, skipping`);
          continue;
        }

        // Create github_tokens table
        await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".github_tokens (
            id SERIAL PRIMARY KEY,
            encrypted_token TEXT NOT NULL,
            token_name VARCHAR(100) DEFAULT 'GitHub Personal Access Token',
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_used_at TIMESTAMP WITH TIME ZONE
          );
        `);

        console.log(`  Created github_tokens table in ${tenantHash}`);
      } catch (error) {
        console.error(`  Error adding github_tokens to ${tenantHash}:`, error.message);
      }
    }
  },

  async down(queryInterface) {
    // Get all tenant schema names
    const schemas = await queryInterface.sequelize.query(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: QueryTypes.SELECT }
    );

    for (const schema of schemas) {
      const tenantHash = schema.schema_name;
      console.log(`Removing github_tokens table from schema: ${tenantHash}`);

      try {
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".github_tokens;
        `);

        console.log(`  Dropped github_tokens table from ${tenantHash}`);
      } catch (error) {
        console.error(`  Error removing github_tokens from ${tenantHash}:`, error.message);
      }
    }
  },
};
