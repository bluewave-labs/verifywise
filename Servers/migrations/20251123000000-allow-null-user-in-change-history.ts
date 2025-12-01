import { QueryInterface } from "sequelize";

/**
 * Migration to allow NULL for changed_by_user_id in change history tables
 *
 * This allows users to be deleted without losing change history.
 * When a user is deleted, their user_id in history is set to NULL,
 * and the UI shows "Deleted User" instead.
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    // Get all tenant schemas
    const tenantSchemas: any[] = await queryInterface.sequelize.query(
      `SELECT schema_name
       FROM information_schema.schemata
       WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const { schema_name } of tenantSchemas) {
      // Check if table exists in this schema
      const tableExists: any[] = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = :schema
          AND table_name = 'model_inventory_change_history'
        )`,
        {
          replacements: { schema: schema_name },
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      if (tableExists[0].exists) {
        // Drop existing foreign key constraint
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema_name}".model_inventory_change_history
           DROP CONSTRAINT IF EXISTS model_inventory_change_history_changed_by_user_id_fkey`
        );

        // Allow NULL for changed_by_user_id
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema_name}".model_inventory_change_history
           ALTER COLUMN changed_by_user_id DROP NOT NULL`
        );

        // Add foreign key with ON DELETE SET NULL
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema_name}".model_inventory_change_history
           ADD CONSTRAINT model_inventory_change_history_changed_by_user_id_fkey
           FOREIGN KEY (changed_by_user_id)
           REFERENCES public.users(id)
           ON DELETE SET NULL`
        );
      }
    }
  },

  down: async (queryInterface: QueryInterface) => {
    // Get all tenant schemas
    const tenantSchemas: any[] = await queryInterface.sequelize.query(
      `SELECT schema_name
       FROM information_schema.schemata
       WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
       AND schema_name NOT LIKE 'pg_%'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const { schema_name } of tenantSchemas) {
      // Check if table exists in this schema
      const tableExists: any[] = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = :schema
          AND table_name = 'model_inventory_change_history'
        )`,
        {
          replacements: { schema: schema_name },
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      if (tableExists[0].exists) {
        // Drop existing foreign key constraint
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema_name}".model_inventory_change_history
           DROP CONSTRAINT IF EXISTS model_inventory_change_history_changed_by_user_id_fkey`
        );

        // Set NULL values to a default user (or handle differently)
        // NOTE: This may fail if there are NULL values and no default user
        await queryInterface.sequelize.query(
          `UPDATE "${schema_name}".model_inventory_change_history
           SET changed_by_user_id = 0
           WHERE changed_by_user_id IS NULL`
        );

        // Make changed_by_user_id NOT NULL again
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema_name}".model_inventory_change_history
           ALTER COLUMN changed_by_user_id SET NOT NULL`
        );

        // Add foreign key without ON DELETE
        await queryInterface.sequelize.query(
          `ALTER TABLE "${schema_name}".model_inventory_change_history
           ADD CONSTRAINT model_inventory_change_history_changed_by_user_id_fkey
           FOREIGN KEY (changed_by_user_id)
           REFERENCES public.users(id)`
        );
      }
    }
  },
};
