'use strict';

/**
 * Migration: Add 'Custom' provider to enum_llm_keys_provider and custom_headers column.
 *
 * ALTER TYPE ... ADD VALUE cannot run inside a transaction in PostgreSQL,
 * so the ENUM change is done first outside any transaction, then the column
 * addition loops all tenants inside its own transaction.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Add 'Custom' to the ENUM (must be outside a transaction)
    await queryInterface.sequelize.query(
      `ALTER TYPE enum_llm_keys_provider ADD VALUE IF NOT EXISTS 'Custom';`
    );

    // Step 2: Add custom_headers JSONB column to all tenant schemas
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".llm_keys
           ADD COLUMN IF NOT EXISTS custom_headers JSONB DEFAULT NULL;`,
          { transaction }
        );

        console.log(`Added custom_headers column to ${tenantHash}.llm_keys`);
      }

      await transaction.commit();
      console.log('Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL does not support removing values from an ENUM type.
    // The 'Custom' value will remain in the ENUM but can be ignored.

    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        await queryInterface.sequelize.query(
          `ALTER TABLE "${tenantHash}".llm_keys
           DROP COLUMN IF EXISTS custom_headers;`,
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
