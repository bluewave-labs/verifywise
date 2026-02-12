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
        console.log('Organizations table does not exist yet. Skipping model_lifecycle_values creation.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Check that items table exists
        const [itemsExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = :schema
            AND table_name = 'model_lifecycle_items'
          );`,
          { transaction, type: Sequelize.QueryTypes.SELECT, replacements: { schema: tenantHash } }
        );

        if (!itemsExists.exists) {
          console.log(`Items table does not exist in schema ${tenantHash}. Skipping.`);
          continue;
        }

        // Create model_lifecycle_values table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".model_lifecycle_values (
            id SERIAL PRIMARY KEY,
            model_inventory_id INTEGER NOT NULL
              REFERENCES "${tenantHash}".model_inventories(id) ON DELETE CASCADE,
            item_id INTEGER NOT NULL
              REFERENCES "${tenantHash}".model_lifecycle_items(id) ON DELETE CASCADE,
            value_text TEXT,
            value_json JSONB,
            updated_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(model_inventory_id, item_id)
          );
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_model_lifecycle_values_model_id
          ON "${tenantHash}".model_lifecycle_values(model_inventory_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_model_lifecycle_values_item_id
          ON "${tenantHash}".model_lifecycle_values(item_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_model_lifecycle_values_model_item
          ON "${tenantHash}".model_lifecycle_values(model_inventory_id, item_id);
        `, { transaction });

        // Create model_lifecycle_item_files junction table
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "${tenantHash}".model_lifecycle_item_files (
            id SERIAL PRIMARY KEY,
            value_id INTEGER NOT NULL
              REFERENCES "${tenantHash}".model_lifecycle_values(id) ON DELETE CASCADE,
            file_id INTEGER NOT NULL
              REFERENCES "${tenantHash}".files(id) ON DELETE CASCADE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(value_id, file_id)
          );
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_model_lifecycle_item_files_value_id
          ON "${tenantHash}".model_lifecycle_item_files(value_id);
        `, { transaction });

        await queryInterface.sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_model_lifecycle_item_files_file_id
          ON "${tenantHash}".model_lifecycle_item_files(file_id);
        `, { transaction });
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

        // Drop in reverse order due to FK dependencies
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".model_lifecycle_item_files CASCADE;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".model_lifecycle_values CASCADE;
        `, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
