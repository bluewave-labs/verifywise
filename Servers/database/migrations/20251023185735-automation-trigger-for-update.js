'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `INSERT INTO public.automation_triggers (key, label, event_name, description) VALUES
          ('vendor_updated', 'Vendor Updated', 'vendor.updated', 'Triggered when a vendor is updated.'),
          ('model_updated', 'Model Updated', 'model.updated', 'Triggered when a model is updated.'),
          ('project_updated', 'Project Updated', 'project.updated', 'Triggered when a project is updated.'),
          ('task_updated', 'Task Updated', 'task.updated', 'Triggered when a task is updated.'),
          ('risk_updated', 'Risk Updated', 'risk.updated', 'Triggered when a risk is updated.'),
          ('training_updated', 'Training Updated', 'training.updated', 'Triggered when a training is updated.'),
          ('policy_updated', 'Policy Updated', 'policy.updated', 'Triggered when a policy is updated.'),
          ('incident_updated', 'Incident Updated', 'incident.updated', 'Triggered when an incident is updated.');
        `,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `INSERT INTO public.automation_triggers_actions (trigger_id, action_id)
          SELECT t.id, a.id
          FROM public.automation_triggers t, public.automation_actions a
          WHERE t.key IN (
            'vendor_updated',
            'model_updated',
            'project_updated',
            'task_updated',
            'risk_updated',
            'training_updated',
            'policy_updated',
            'incident_updated'
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
          'vendor_updated',
          'model_updated',
          'project_updated',
          'task_updated',
          'risk_updated',
          'training_updated',
          'policy_updated',
          'incident_updated'
        );`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `DELETE FROM public.automation_triggers_actions WHERE trigger_id IN (
          SELECT id FROM public.automation_triggers WHERE key IN (
            'vendor_updated',
            'model_updated',
            'project_updated',
            'task_updated',
            'risk_updated',
            'training_updated',
            'policy_updated',
            'incident_updated'
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
