'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `CREATE TABLE public.automation_triggers (
          id SERIAL PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          label TEXT NOT NULL,
          event_name TEXT NOT NULL,
          description TEXT
        );`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `CREATE TABLE public.automation_actions (
          id SERIAL PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          label TEXT NOT NULL,
          description TEXT,
          default_params JSONB DEFAULT '{}'
        );`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `CREATE TABLE public.automation_triggers_actions (
          trigger_id INTEGER REFERENCES public.automation_triggers(id) ON DELETE CASCADE,
          action_id INTEGER REFERENCES public.automation_actions(id) ON DELETE CASCADE,
          PRIMARY KEY (trigger_id, action_id)
        );`,
        { transaction }
      )

      await queryInterface.sequelize.query(
        `INSERT INTO public.automation_triggers (key, label, event_name, description) VALUES
          ('vendor_added', 'Vendor Added', 'vendor.added', 'Triggered when a new vendor is added.'),
          ('model_added', 'Model Added', 'model.added', 'Triggered when a new model is added.'),
          ('vendor_review_date_approaching', 'Vendor Review Date Approaching', 'vendor.review_date_approaching', 'Triggered when a vendor review date is approaching.');
        `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `INSERT INTO public.automation_actions (key, label, description, default_params) VALUES
          ('send_email', 'Send Email', 'Sends an email to specified recipients.', '{"to": [], "subject": "Notification", "body": "This is an automated notification.", "replacements": {}}'::jsonb);
      `,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `INSERT INTO public.automation_triggers_actions (trigger_id, action_id)
          SELECT t.id, a.id
          FROM public.automation_triggers t, public.automation_actions a
          WHERE t.key = 'vendor_added' AND a.key = 'send_email'
          UNION ALL
          SELECT t.id, a.id
          FROM public.automation_triggers t, public.automation_actions a
          WHERE t.key = 'model_added' AND a.key = 'send_email'
          UNION ALL
          SELECT t.id, a.id
          FROM public.automation_triggers t, public.automation_actions a
          WHERE t.key = 'vendor_review_date_approaching' AND a.key = 'send_email';
        `,
        { transaction }
      );

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );
      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".automations (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            trigger_id INTEGER REFERENCES public.automation_triggers(id) ON DELETE RESTRICT,
            is_active BOOLEAN DEFAULT TRUE,
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW()
          );`, { transaction });

        await queryInterface.sequelize.query(`
          CREATE TABLE "${tenantHash}".automation_actions (
            id SERIAL PRIMARY KEY,
            automation_id INTEGER REFERENCES "${tenantHash}".automations(id) ON DELETE CASCADE,
            action_type_id INTEGER REFERENCES public.automation_actions(id) ON DELETE RESTRICT,
            params JSONB DEFAULT '{}',
            "order" INTEGER DEFAULT 1
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
          DROP TABLE IF EXISTS "${tenantHash}".automation_actions;
        `, { transaction });

        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS "${tenantHash}".automations;
        `, { transaction });
      }

      await queryInterface.sequelize.query(
        `DROP TABLE IF EXISTS public.automation_actions;`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `DROP TABLE IF EXISTS public.automation_triggers;`,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
