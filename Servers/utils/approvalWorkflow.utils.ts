import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { ApprovalWorkflowModel } from "../domain.layer/models/approvalWorkflow/approvalWorkflow.model";
import { ApprovalWorkflowStepModel } from "../domain.layer/models/approvalWorkflow/approvalWorkflowStep.model";
import { ApprovalStepApproversModel } from "../domain.layer/models/approvalWorkflow/approvalStepApprovers.model";
import { EntityType } from "../domain.layer/enums/approval-workflow.enum";

/**
 * Get all approval workflows for a tenant
 */
export const getAllApprovalWorkflowsQuery = async (
  tenantId: string,
  transaction?: Transaction
): Promise<ApprovalWorkflowModel[]> => {
  const workflows = await sequelize.query(
    `SELECT * FROM "${tenantId}".approval_workflows WHERE is_active = true ORDER BY created_at DESC`,
    {
      mapToModel: true,
      model: ApprovalWorkflowModel,
      transaction,
    }
  );

  // Load steps for each workflow
  for (const workflow of workflows) {
    const steps = await getWorkflowStepsQuery(workflow.id!, tenantId, transaction);
    workflow.setDataValue('steps', steps);
  }

  return workflows;
};

/**
 * Get approval workflow by ID
 */
export const getApprovalWorkflowByIdQuery = async (
  workflowId: number,
  tenantId: string,
  transaction?: Transaction
): Promise<ApprovalWorkflowModel | null> => {
  console.log(`getApprovalWorkflowByIdQuery called for workflow ${workflowId}, transaction:`, !!transaction);

  const workflows = await sequelize.query(
    `SELECT * FROM "${tenantId}".approval_workflows WHERE id = :workflowId`,
    {
      replacements: { workflowId },
      mapToModel: true,
      model: ApprovalWorkflowModel,
      transaction,
    }
  );

  if (!workflows || workflows.length === 0) {
    console.log(`No workflow found with ID ${workflowId}`);
    return null;
  }

  const workflow = workflows[0];
  console.log(`Workflow fetched, ID: ${(workflow as any).id}`);

  // Load steps
  const steps = await getWorkflowStepsQuery(workflowId, tenantId, transaction);
  console.log(`Steps loaded: ${steps.length} steps`);

  // Set steps on workflow instance
  workflow.setDataValue('steps', steps);
  console.log(`After setDataValue, workflow.steps:`, (workflow as any).steps);
  console.log(`After setDataValue, workflow.get('steps'):`, workflow.get('steps'));
  console.log(`After setDataValue, workflow.toJSON():`, JSON.stringify(workflow.toJSON(), null, 2));

  return workflow;
};

/**
 * Get workflow steps with approvers
 */
export const getWorkflowStepsQuery = async (
  workflowId: number,
  tenantId: string,
  transaction?: Transaction
): Promise<ApprovalWorkflowStepModel[]> => {
  console.log(`getWorkflowStepsQuery called for workflow ${workflowId}`);

  const steps = await sequelize.query(
    `SELECT * FROM "${tenantId}".approval_workflow_steps
     WHERE workflow_id = :workflowId
     ORDER BY step_number ASC`,
    {
      replacements: { workflowId },
      mapToModel: true,
      model: ApprovalWorkflowStepModel,
      transaction,
    }
  );

  console.log(`Found ${steps.length} steps for workflow ${workflowId}`);

  // Load approvers for each step
  for (const step of steps) {
    const approvers = await sequelize.query(
      `SELECT * FROM "${tenantId}".approval_step_approvers WHERE workflow_step_id = :stepId`,
      {
        replacements: { stepId: step.id },
        mapToModel: true,
        model: ApprovalStepApproversModel,
        transaction,
      }
    );
    console.log(`  Step ${step.step_number}: ${approvers.length} approvers`);
    step.setDataValue('approvers', approvers);
  }

  console.log(`Returning ${steps.length} steps with approvers loaded`);
  return steps;
};

/**
 * Create new approval workflow
 */
export const createApprovalWorkflowQuery = async (
  workflowData: {
    workflow_title: string;
    entity_type: EntityType;
    description?: string;
    created_by: number;
    steps: Array<{
      step_name: string;
      description?: string;
      approver_ids: number[];
      requires_all_approvers: boolean;
    }>;
  },
  tenantId: string,
  transaction: Transaction
): Promise<ApprovalWorkflowModel> => {
  // Create workflow
  const [workflow] = await sequelize.query(
    `INSERT INTO "${tenantId}".approval_workflows
     (workflow_title, entity_type, description, created_by, is_active, created_at, updated_at)
     VALUES (:workflow_title, :entity_type, :description, :created_by, true, NOW(), NOW())
     RETURNING *`,
    {
      replacements: {
        workflow_title: workflowData.workflow_title,
        entity_type: workflowData.entity_type,
        description: workflowData.description || null,
        created_by: workflowData.created_by,
      },
      mapToModel: true,
      model: ApprovalWorkflowModel,
      transaction,
    }
  );

  // Create steps
  for (let i = 0; i < workflowData.steps.length; i++) {
    const stepData = workflowData.steps[i];

    const [step] = await sequelize.query(
      `INSERT INTO "${tenantId}".approval_workflow_steps
       (workflow_id, step_number, step_name, description, requires_all_approvers, created_at)
       VALUES (:workflow_id, :step_number, :step_name, :description, :requires_all_approvers, NOW())
       RETURNING *`,
      {
        replacements: {
          workflow_id: (workflow as any).id,
          step_number: i + 1,
          step_name: stepData.step_name,
          description: stepData.description || null,
          requires_all_approvers: stepData.requires_all_approvers,
        },
        mapToModel: true,
        model: ApprovalWorkflowStepModel,
        transaction,
      }
    );

    // Create approvers for this step
    for (const approverId of stepData.approver_ids) {
      await sequelize.query(
        `INSERT INTO "${tenantId}".approval_step_approvers
         (workflow_step_id, approver_id, created_at)
         VALUES (:workflow_step_id, :approver_id, NOW())`,
        {
          replacements: {
            workflow_step_id: (step as any).id,
            approver_id: approverId,
          },
          transaction,
        }
      );
    }
  }

  // Fetch and return the complete workflow with steps
  const createdWorkflow = await getApprovalWorkflowByIdQuery((workflow as any).id, tenantId, transaction);

  if (!createdWorkflow) {
    throw new Error("Failed to retrieve created workflow");
  }

  return createdWorkflow;
};

/**
 * Update approval workflow
 */
export const updateApprovalWorkflowQuery = async (
  workflowId: number,
  workflowData: {
    workflow_title?: string;
    description?: string;
    steps?: Array<{
      step_name: string;
      description?: string;
      approver_ids: number[];
      requires_all_approvers: boolean;
    }>;
  },
  tenantId: string,
  transaction: Transaction
): Promise<ApprovalWorkflowModel | null> => {
  // Update workflow
  await sequelize.query(
    `UPDATE "${tenantId}".approval_workflows
     SET workflow_title = COALESCE(:workflow_title, workflow_title),
         description = COALESCE(:description, description),
         updated_at = NOW()
     WHERE id = :workflowId`,
    {
      replacements: {
        workflowId,
        workflow_title: workflowData.workflow_title || null,
        description: workflowData.description || null,
      },
      transaction,
    }
  );

  // If steps are provided, delete old steps and create new ones
  if (workflowData.steps) {
    // Delete old approvers
    await sequelize.query(
      `DELETE FROM "${tenantId}".approval_step_approvers
       WHERE workflow_step_id IN (
         SELECT id FROM "${tenantId}".approval_workflow_steps WHERE workflow_id = :workflowId
       )`,
      {
        replacements: { workflowId },
        transaction,
      }
    );

    // Delete old steps
    await sequelize.query(
      `DELETE FROM "${tenantId}".approval_workflow_steps WHERE workflow_id = :workflowId`,
      {
        replacements: { workflowId },
        transaction,
      }
    );

    // Create new steps
    for (let i = 0; i < workflowData.steps.length; i++) {
      const stepData = workflowData.steps[i];

      const [step] = await sequelize.query(
        `INSERT INTO "${tenantId}".approval_workflow_steps
         (workflow_id, step_number, step_name, description, requires_all_approvers, created_at)
         VALUES (:workflow_id, :step_number, :step_name, :description, :requires_all_approvers, NOW())
         RETURNING *`,
        {
          replacements: {
            workflow_id: workflowId,
            step_number: i + 1,
            step_name: stepData.step_name,
            description: stepData.description || null,
            requires_all_approvers: stepData.requires_all_approvers,
          },
          mapToModel: true,
          model: ApprovalWorkflowStepModel,
          transaction,
        }
      );

      // Create approvers for this step
      for (const approverId of stepData.approver_ids) {
        await sequelize.query(
          `INSERT INTO "${tenantId}".approval_step_approvers
           (workflow_step_id, approver_id, created_at)
           VALUES (:workflow_step_id, :approver_id, NOW())`,
          {
            replacements: {
              workflow_step_id: (step as any).id,
              approver_id: approverId,
            },
            transaction,
          }
        );
      }
    }
  }

  return await getApprovalWorkflowByIdQuery(workflowId, tenantId, transaction);
};

/**
 * Delete (soft delete) approval workflow
 */
export const deleteApprovalWorkflowQuery = async (
  workflowId: number,
  tenantId: string,
  transaction: Transaction
): Promise<void> => {
  await sequelize.query(
    `UPDATE "${tenantId}".approval_workflows
     SET is_active = false, updated_at = NOW()
     WHERE id = :workflowId`,
    {
      replacements: { workflowId },
      transaction,
    }
  );
};
