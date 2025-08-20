'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Create task ENUM types if they don't exist
      await queryInterface.sequelize.query(`DO $$ BEGIN
        CREATE TYPE enum_tasks_priority AS ENUM ('Low', 'Medium', 'High');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`, { transaction });
      
      await queryInterface.sequelize.query(`DO $$ BEGIN
        CREATE TYPE enum_tasks_status AS ENUM ('Open', 'In Progress', 'Completed', 'Overdue', 'Deleted');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`, { transaction });

      const queries = [
        (tenantHash) => `CREATE TABLE IF NOT EXISTS "${tenantHash}".tasks
        (
          id serial NOT NULL,
          title character varying(255) NOT NULL,
          description text,
          creator_id integer NOT NULL,
          due_date timestamp with time zone,
          priority enum_tasks_priority NOT NULL DEFAULT 'Medium',
          status enum_tasks_status NOT NULL DEFAULT 'Open',
          categories jsonb DEFAULT '[]',
          created_at timestamp with time zone NOT NULL DEFAULT now(),
          updated_at timestamp with time zone NOT NULL DEFAULT now(),
          CONSTRAINT tasks_pkey PRIMARY KEY (id),
          CONSTRAINT tasks_creator_id_fkey FOREIGN KEY (creator_id)
            REFERENCES public.users (id) MATCH SIMPLE
            ON UPDATE CASCADE ON DELETE CASCADE
        );`,
        (tenantHash) => `CREATE INDEX IF NOT EXISTS "${tenantHash}_tasks_creator_id_idx" ON "${tenantHash}".tasks (creator_id);`,
        (tenantHash) => `CREATE INDEX IF NOT EXISTS "${tenantHash}_tasks_due_date_idx" ON "${tenantHash}".tasks (due_date);`,
        (tenantHash) => `CREATE INDEX IF NOT EXISTS "${tenantHash}_tasks_status_idx" ON "${tenantHash}".tasks (status);`,
        (tenantHash) => `CREATE INDEX IF NOT EXISTS "${tenantHash}_tasks_priority_idx" ON "${tenantHash}".tasks (priority);`,
        (tenantHash) => `CREATE INDEX IF NOT EXISTS "${tenantHash}_tasks_created_at_idx" ON "${tenantHash}".tasks (created_at);`,
        (tenantHash) => `CREATE TABLE IF NOT EXISTS "${tenantHash}".task_assignees
        (
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
        (tenantHash) => `CREATE INDEX IF NOT EXISTS "${tenantHash}_task_assignees_task_id_idx" ON "${tenantHash}".task_assignees (task_id);`,
        (tenantHash) => `CREATE INDEX IF NOT EXISTS "${tenantHash}_task_assignees_user_id_idx" ON "${tenantHash}".task_assignees (user_id);`
      ];

      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction });

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        console.log(`Adding task tables to tenant schema: ${tenantHash}`);
        
        const queriesWithTenant = queries.map(query => query(tenantHash));
        for (const query of queriesWithTenant) {
          await queryInterface.sequelize.query(query, { transaction });
        }
      }

      await transaction.commit();
      console.log(`✅ Successfully added task tables to all existing tenant schemas`);
    } catch (error) {
      await transaction.rollback();
      console.error(`❌ Failed to add task tables to existing tenant schemas:`, error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const queries = [
        (tenantHash) => `DROP TABLE IF EXISTS "${tenantHash}".task_assignees CASCADE;`,
        (tenantHash) => `DROP TABLE IF EXISTS "${tenantHash}".tasks CASCADE;`
      ];

      const organizations = await queryInterface.sequelize.query(`SELECT id FROM organizations;`, { transaction });

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        const queriesWithTenant = queries.map(query => query(tenantHash));
        for (const query of queriesWithTenant) {
          await queryInterface.sequelize.query(query, { transaction });
        }
      }

      // Note: We don't drop the ENUM types as they might be used by other schemas
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};