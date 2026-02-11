'use strict';
const { getTenantHash } = require("../../dist/tools/getTenantHash");

const DEFAULT_PHASES = [
  {
    name: 'Registration & Inventory',
    description: 'Initial model registration, ownership assignment, and classification of the AI model.',
    display_order: 1,
    items: [
      { name: 'Model Registration Form', item_type: 'documents', is_required: true, display_order: 1, config: { maxFiles: 5, allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] } },
      { name: 'Unique Model Identifier', item_type: 'text', is_required: true, display_order: 2, config: { placeholder: 'Enter unique model identifier' } },
      { name: 'Model Ownership Record', item_type: 'people', is_required: true, display_order: 3, config: { maxPeople: 10, roles: ['Owner', 'Co-Owner', 'Steward'] } },
      { name: 'Purpose & Intended Use', item_type: 'textarea', is_required: true, display_order: 4, config: { placeholder: 'Describe the purpose and intended use of this model' } },
      { name: 'Regulatory / Risk Classification', item_type: 'classification', is_required: true, display_order: 5, config: { levels: ['Minimal', 'Low', 'Medium', 'High', 'Critical'] } },
      { name: 'Model Dependencies', item_type: 'textarea', is_required: false, display_order: 6, config: { placeholder: 'List any model dependencies or upstream/downstream systems' } },
    ],
  },
  {
    name: 'Design & Development',
    description: 'Documentation of model design, data lineage, feature engineering, and development assessments.',
    display_order: 2,
    items: [
      { name: 'Model Design Document', item_type: 'documents', is_required: true, display_order: 1, config: {} },
      { name: 'Data Lineage & Quality Assessment', item_type: 'documents', is_required: true, display_order: 2, config: {} },
      { name: 'Feature Documentation Sheet', item_type: 'documents', is_required: true, display_order: 3, config: {} },
      { name: 'Explainability Assessment (SHAP/LIME)', item_type: 'documents', is_required: true, display_order: 4, config: {} },
      { name: 'Bias & Fairness Assessment', item_type: 'documents', is_required: true, display_order: 5, config: {} },
      { name: 'Security & Adversarial Robustness Review', item_type: 'documents', is_required: false, display_order: 6, config: {} },
      { name: 'Version Control Log', item_type: 'documents', is_required: false, display_order: 7, config: {} },
    ],
  },
  {
    name: 'Validation & Testing',
    description: 'Validation test plans, performance evaluation, bias testing, and stress testing outputs.',
    display_order: 3,
    items: [
      { name: 'Validation Test Plan', item_type: 'documents', is_required: true, display_order: 1, config: {} },
      { name: 'Performance Evaluation Results', item_type: 'documents', is_required: true, display_order: 2, config: {} },
      { name: 'Bias Testing Results & Mitigation', item_type: 'documents', is_required: true, display_order: 3, config: {} },
      { name: 'Explainability Validation', item_type: 'documents', is_required: true, display_order: 4, config: {} },
      { name: 'Stress / Adversarial Test Outputs', item_type: 'documents', is_required: false, display_order: 5, config: {} },
    ],
  },
  {
    name: 'Deployment & Operational Readiness',
    description: 'Pre-deployment checklists, rollback plans, deployment records, and governance approval.',
    display_order: 4,
    items: [
      { name: 'Deployment Readiness Checklist', item_type: 'checklist', is_required: true, display_order: 1, config: { defaultItems: ['Infrastructure validated', 'Security review complete', 'Performance benchmarks met', 'Monitoring configured', 'Rollback tested'] } },
      { name: 'Rollback & Contingency Plan', item_type: 'documents', is_required: true, display_order: 2, config: {} },
      { name: 'Deployment Record', item_type: 'documents', is_required: true, display_order: 3, config: {} },
      { name: 'Versioning History Log', item_type: 'textarea', is_required: false, display_order: 4, config: { placeholder: 'Provide versioning history for this deployment' } },
      { name: 'Model Acceptance & Governance Approval', item_type: 'approval', is_required: true, display_order: 5, config: { requiredApprovers: 2 } },
    ],
  },
  {
    name: 'Monitoring & Incident Management',
    description: 'Ongoing model monitoring, drift assessment, stability reports, and incident management.',
    display_order: 5,
    items: [
      { name: 'Monitoring Plan', item_type: 'documents', is_required: true, display_order: 1, config: {} },
      { name: 'Drift Assessment Reports', item_type: 'documents', is_required: true, display_order: 2, config: {} },
      { name: 'Operational Stability Reports', item_type: 'documents', is_required: false, display_order: 3, config: {} },
      { name: 'Incident Response SOP', item_type: 'documents', is_required: true, display_order: 4, config: {} },
      { name: 'Model Incident Log', item_type: 'documents', is_required: false, display_order: 5, config: {} },
    ],
  },
  {
    name: 'Human-in-the-Loop Oversight',
    description: 'Human oversight procedures, manual review logs, escalation protocols, and ethics review.',
    display_order: 6,
    items: [
      { name: 'HITL Procedure', item_type: 'documents', is_required: true, display_order: 1, config: {} },
      { name: 'Manual Review Logs', item_type: 'documents', is_required: false, display_order: 2, config: {} },
      { name: 'Override / Escalation Log', item_type: 'documents', is_required: false, display_order: 3, config: {} },
      { name: 'Ethics Review Committee Approvals', item_type: 'approval', is_required: true, display_order: 4, config: { requiredApprovers: 3 } },
    ],
  },
];

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
        console.log('Organizations table does not exist yet. Skipping lifecycle seed.');
        await transaction.commit();
        return;
      }

      const organizations = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      for (let organization of organizations[0]) {
        const tenantHash = getTenantHash(organization.id);

        // Check that phases table exists
        const [phasesExists] = await queryInterface.sequelize.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = :schema
            AND table_name = 'model_lifecycle_phases'
          );`,
          { transaction, type: Sequelize.QueryTypes.SELECT, replacements: { schema: tenantHash } }
        );

        if (!phasesExists.exists) {
          console.log(`Phases table does not exist in schema ${tenantHash}. Skipping seed.`);
          continue;
        }

        // Check if phases already seeded (skip if so)
        const [existingPhases] = await queryInterface.sequelize.query(
          `SELECT COUNT(*) as count FROM "${tenantHash}".model_lifecycle_phases;`,
          { transaction, type: Sequelize.QueryTypes.SELECT }
        );

        if (parseInt(existingPhases.count) > 0) {
          console.log(`Phases already exist in schema ${tenantHash}. Skipping seed.`);
          continue;
        }

        for (const phase of DEFAULT_PHASES) {
          // Insert phase
          const [insertedPhase] = await queryInterface.sequelize.query(
            `INSERT INTO "${tenantHash}".model_lifecycle_phases (name, description, display_order, is_active)
             VALUES (:name, :description, :display_order, true)
             RETURNING id;`,
            {
              transaction,
              type: Sequelize.QueryTypes.SELECT,
              replacements: {
                name: phase.name,
                description: phase.description,
                display_order: phase.display_order,
              },
            }
          );

          const phaseId = insertedPhase.id;

          // Insert items for this phase
          for (const item of phase.items) {
            await queryInterface.sequelize.query(
              `INSERT INTO "${tenantHash}".model_lifecycle_items
                (phase_id, name, item_type, is_required, display_order, config, is_active)
               VALUES (:phase_id, :name, :item_type, :is_required, :display_order, :config, true);`,
              {
                transaction,
                replacements: {
                  phase_id: phaseId,
                  name: item.name,
                  item_type: item.item_type,
                  is_required: item.is_required,
                  display_order: item.display_order,
                  config: JSON.stringify(item.config),
                },
              }
            );
          }
        }

        console.log(`Seeded ${DEFAULT_PHASES.length} lifecycle phases with items in schema ${tenantHash}.`);
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

        // Delete items first (FK constraint)
        await queryInterface.sequelize.query(
          `DELETE FROM "${tenantHash}".model_lifecycle_items WHERE TRUE;`,
          { transaction }
        );

        await queryInterface.sequelize.query(
          `DELETE FROM "${tenantHash}".model_lifecycle_phases WHERE TRUE;`,
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
