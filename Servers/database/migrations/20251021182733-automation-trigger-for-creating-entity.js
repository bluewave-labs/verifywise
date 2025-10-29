'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `INSERT INTO public.automation_triggers (key, label, event_name, description) VALUES
          ('project_added', 'Project Added', 'project.added', 'Triggered when a new project is added.'),
          ('task_added', 'Task Added', 'task.added', 'Triggered when a new task is added.'),
          ('risk_added', 'Risk Added', 'risk.added', 'Triggered when a new risk is added.'),
          ('training_added', 'Training Added', 'training.added', 'Triggered when a new training is added.'),
          ('policy_added', 'Policy Added', 'policy.added', 'Triggered when a new policy is added.'),
          ('incident_added', 'Incident Added', 'incident.added', 'Triggered when a new incident is added.');
        `,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `INSERT INTO public.automation_triggers_actions (trigger_id, action_id)
          SELECT t.id, a.id
          FROM public.automation_triggers t, public.automation_actions a
          WHERE t.key IN (
            'project_added',
            'task_added',
            'risk_added',
            'training_added',
            'policy_added',
            'incident_added'
          ) AND a.key = 'send_email';
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
      await queryInterface.sequelize.query(
        `DELETE FROM public.automation_triggers WHERE key IN (
          'project_added',
          'task_added',
          'risk_added',
          'training_added',
          'policy_added',
          'incident_added'
        );`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `DELETE FROM public.automation_triggers_actions WHERE trigger_id IN (
          SELECT id FROM public.automation_triggers WHERE key IN (
            'project_added',
            'task_added',
            'risk_added',
            'training_added',
            'policy_added',
            'incident_added'
          )
        );`,
        { transaction }
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
