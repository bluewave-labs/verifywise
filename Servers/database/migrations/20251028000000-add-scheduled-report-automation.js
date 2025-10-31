'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Insert new trigger for scheduled reports
      await queryInterface.sequelize.query(
        `INSERT INTO public.automation_triggers (key, label, event_name, description) VALUES
          ('scheduled_report', 'Scheduled Report', 'report.scheduled', 'Triggered on a schedule to generate and email reports.');
        `,
        { transaction }
      );

      // Create association between scheduled_report trigger and send_email action
      await queryInterface.sequelize.query(
        `INSERT INTO public.automation_triggers_actions (trigger_id, action_id)
          SELECT t.id, a.id
          FROM public.automation_triggers t, public.automation_actions a
          WHERE t.key = 'scheduled_report' AND a.key = 'send_email';
        `,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove the trigger-action association
      await queryInterface.sequelize.query(
        `DELETE FROM public.automation_triggers_actions
         WHERE trigger_id IN (SELECT id FROM public.automation_triggers WHERE key = 'scheduled_report');`,
        { transaction }
      );

      // Remove the trigger
      await queryInterface.sequelize.query(
        `DELETE FROM public.automation_triggers WHERE key = 'scheduled_report';`,
        { transaction }
      );

      // Note: We don't remove the params column as it may be used by other automations

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
