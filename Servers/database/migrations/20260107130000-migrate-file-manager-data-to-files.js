'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/**
 * Migration to move data from file_manager table to unified files table.
 *
 * This migration:
 * 1. Copies all records from file_manager to files table
 * 2. Updates file_access_logs to reference new file IDs
 * 3. Drops the file_manager table
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Fetch all organizations
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Check if file_manager table exists
        const [tableExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = '${tenantHash}'
            AND table_name = 'file_manager'
          );`,
          { transaction }
        );

        if (!tableExists[0].exists) {
          console.log(`Skipping tenant ${tenantHash}: file_manager table does not exist`);

          // Still need to update file_access_logs FK if it references file_manager
          // Drop any existing FK constraint and recreate pointing to files
          const [fkExists] = await queryInterface.sequelize.query(
            `SELECT EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE table_schema = '${tenantHash}'
              AND table_name = 'file_access_logs'
              AND constraint_type = 'FOREIGN KEY'
              AND constraint_name LIKE '%file_id%'
            );`,
            { transaction }
          );

          if (fkExists[0].exists) {
            // Get the actual constraint name
            const [constraints] = await queryInterface.sequelize.query(
              `SELECT constraint_name FROM information_schema.table_constraints
               WHERE table_schema = '${tenantHash}'
               AND table_name = 'file_access_logs'
               AND constraint_type = 'FOREIGN KEY'
               AND constraint_name LIKE '%file_id%';`,
              { transaction }
            );

            for (const constraint of constraints) {
              await queryInterface.sequelize.query(
                `ALTER TABLE "${tenantHash}".file_access_logs
                 DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}";`,
                { transaction }
              );
            }

            // Add new FK constraint referencing files table
            await queryInterface.sequelize.query(
              `ALTER TABLE "${tenantHash}".file_access_logs
               ADD CONSTRAINT file_access_logs_file_id_fkey
               FOREIGN KEY (file_id) REFERENCES "${tenantHash}".files(id) ON DELETE CASCADE;`,
              { transaction }
            );
          }

          continue;
        }

        // Check if there's any data to migrate
        const [fileCount] = await queryInterface.sequelize.query(
          `SELECT COUNT(*) as count FROM "${tenantHash}".file_manager;`,
          { transaction }
        );

        const count = parseInt(fileCount[0].count);
        console.log(`Tenant ${tenantHash}: ${count} files to migrate`);

        if (count > 0) {
          // Create temporary mapping table to track old_id -> new_id
          await queryInterface.sequelize.query(
            `DROP TABLE IF EXISTS pg_temp.file_id_mapping_${tenantHash.replace(/[^a-z0-9]/gi, '_')};`,
            { transaction }
          );

          await queryInterface.sequelize.query(
            `CREATE TEMP TABLE file_id_mapping_${tenantHash.replace(/[^a-z0-9]/gi, '_')} (
              old_id INTEGER PRIMARY KEY,
              new_id INTEGER
            );`,
            { transaction }
          );

          const tempTableName = `file_id_mapping_${tenantHash.replace(/[^a-z0-9]/gi, '_')}`;

          // Insert file_manager data into files table and capture new IDs
          // We use a CTE to insert and return both old and new IDs
          await queryInterface.sequelize.query(
            `WITH inserted AS (
              INSERT INTO "${tenantHash}".files (
                filename,
                content,
                project_id,
                uploaded_by,
                uploaded_time,
                is_demo,
                source,
                type,
                size,
                file_path,
                org_id,
                model_id
              )
              SELECT
                fm.filename,
                fm.content,
                NULL as project_id,
                fm.uploaded_by,
                fm.upload_date as uploaded_time,
                fm.is_demo,
                CASE
                  WHEN fm.source = 'file_manager' THEN 'File Manager'::enum_files_source
                  WHEN fm.source = 'policy_editor' THEN 'policy_editor'::enum_files_source
                  WHEN fm.source IS NULL THEN 'File Manager'::enum_files_source
                  ELSE 'File Manager'::enum_files_source
                END as source,
                fm.mimetype as type,
                fm.size,
                fm.file_path,
                fm.org_id,
                fm.model_id
              FROM "${tenantHash}".file_manager fm
              ORDER BY fm.id
              RETURNING id
            ),
            old_ids AS (
              SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
              FROM "${tenantHash}".file_manager
            ),
            new_ids AS (
              SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn
              FROM inserted
            )
            INSERT INTO ${tempTableName} (old_id, new_id)
            SELECT o.id, n.id
            FROM old_ids o
            JOIN new_ids n ON o.rn = n.rn;`,
            { transaction }
          );

          // Check if file_access_logs has any records referencing file_manager
          const [accessLogCount] = await queryInterface.sequelize.query(
            `SELECT COUNT(*) as count FROM "${tenantHash}".file_access_logs;`,
            { transaction }
          );

          if (parseInt(accessLogCount[0].count) > 0) {
            // Drop any existing FK constraint
            const [constraints] = await queryInterface.sequelize.query(
              `SELECT constraint_name FROM information_schema.table_constraints
               WHERE table_schema = '${tenantHash}'
               AND table_name = 'file_access_logs'
               AND constraint_type = 'FOREIGN KEY';`,
              { transaction }
            );

            for (const constraint of constraints) {
              await queryInterface.sequelize.query(
                `ALTER TABLE "${tenantHash}".file_access_logs
                 DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}";`,
                { transaction }
              );
            }

            // Update file_access_logs to reference new file IDs
            await queryInterface.sequelize.query(
              `UPDATE "${tenantHash}".file_access_logs fal
               SET file_id = m.new_id
               FROM ${tempTableName} m
               WHERE fal.file_id = m.old_id;`,
              { transaction }
            );
          } else {
            // Drop any existing FK constraint even if no records
            const [constraints] = await queryInterface.sequelize.query(
              `SELECT constraint_name FROM information_schema.table_constraints
               WHERE table_schema = '${tenantHash}'
               AND table_name = 'file_access_logs'
               AND constraint_type = 'FOREIGN KEY';`,
              { transaction }
            );

            for (const constraint of constraints) {
              await queryInterface.sequelize.query(
                `ALTER TABLE "${tenantHash}".file_access_logs
                 DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}";`,
                { transaction }
              );
            }
          }

          // Add new FK constraint referencing files table
          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".file_access_logs
             ADD CONSTRAINT file_access_logs_file_id_fkey
             FOREIGN KEY (file_id) REFERENCES "${tenantHash}".files(id) ON DELETE CASCADE;`,
            { transaction }
          );

          // Drop temporary mapping table
          await queryInterface.sequelize.query(
            `DROP TABLE IF EXISTS ${tempTableName};`,
            { transaction }
          );

          console.log(`Successfully migrated ${count} files for tenant ${tenantHash}`);
        } else {
          // No data but still update FK constraint
          const [constraints] = await queryInterface.sequelize.query(
            `SELECT constraint_name FROM information_schema.table_constraints
             WHERE table_schema = '${tenantHash}'
             AND table_name = 'file_access_logs'
             AND constraint_type = 'FOREIGN KEY';`,
            { transaction }
          );

          for (const constraint of constraints) {
            await queryInterface.sequelize.query(
              `ALTER TABLE "${tenantHash}".file_access_logs
               DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}";`,
              { transaction }
            );
          }

          await queryInterface.sequelize.query(
            `ALTER TABLE "${tenantHash}".file_access_logs
             ADD CONSTRAINT file_access_logs_file_id_fkey
             FOREIGN KEY (file_id) REFERENCES "${tenantHash}".files(id) ON DELETE CASCADE;`,
            { transaction }
          );
        }

        // Drop the file_manager table
        await queryInterface.sequelize.query(
          `DROP TABLE IF EXISTS "${tenantHash}".file_manager CASCADE;`,
          { transaction }
        );

        console.log(`Dropped file_manager table for tenant ${tenantHash}`);
      }

      // Drop the enum_file_manager_source type if it exists (no longer needed)
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS public.enum_file_manager_source;`,
        { transaction }
      );

      await transaction.commit();
      console.log('Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // This migration is not easily reversible because:
    // 1. file_manager table has been dropped
    // 2. New file IDs have been assigned
    // 3. file_access_logs now reference files table
    //
    // To reverse, you would need to:
    // 1. Recreate file_manager table
    // 2. Copy data back from files where project_id IS NULL
    // 3. Update file_access_logs references
    //
    // This is left as a manual process if needed.
    console.warn('This migration cannot be automatically reversed.');
    console.warn('To restore file_manager table, use a database backup.');
  }
};
