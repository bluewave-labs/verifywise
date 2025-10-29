'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `INSERT INTO public.automation_triggers (key, label, event_name, description) VALUES
          ('vendor_deleted', 'Vendor Deleted', 'vendor.deleted', 'Triggered when a vendor is deleted.'),
          ('model_deleted', 'Model Deleted', 'model.deleted', 'Triggered when a model is deleted.'),
          ('project_deleted', 'Project Deleted', 'project.deleted', 'Triggered when a project is deleted.'),
          ('task_deleted', 'Task Deleted', 'task.deleted', 'Triggered when a task is deleted.'),
          ('risk_deleted', 'Risk Deleted', 'risk.deleted', 'Triggered when a risk is deleted.'),
          ('training_deleted', 'Training Deleted', 'training.deleted', 'Triggered when a training is deleted.'),
          ('policy_deleted', 'Policy Deleted', 'policy.deleted', 'Triggered when a policy is deleted.'),
          ('incident_deleted', 'Incident Deleted', 'incident.deleted', 'Triggered when an incident is deleted.');
        `,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `INSERT INTO public.automation_triggers_actions (trigger_id, action_id)
          SELECT t.id, a.id
          FROM public.automation_triggers t, public.automation_actions a
          WHERE t.key IN (
            'vendor_deleted',
            'model_deleted',
            'project_deleted',
            'task_deleted',
            'risk_deleted',
            'training_deleted',
            'policy_deleted',
            'incident_deleted'
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
          'vendor_deleted',
          'model_deleted',
          'project_deleted',
          'task_deleted',
          'risk_deleted',
          'training_deleted',
          'policy_deleted',
          'incident_deleted'
        );`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `DELETE FROM public.automation_triggers_actions WHERE trigger_id IN (
          SELECT id FROM public.automation_triggers WHERE key IN (
            'vendor_deleted',
            'model_deleted',
            'project_deleted',
            'task_deleted',
            'risk_deleted',
            'training_deleted',
            'policy_deleted',
            'incident_deleted'
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
