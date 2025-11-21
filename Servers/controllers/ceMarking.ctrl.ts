import { Request, Response } from 'express';
import { sequelize } from "../database/db";
import { QueryTypes } from 'sequelize';
import { countSubControlsEUByProjectId, countAnswersEUByProjectId } from '../utils/eu.utils';

// Default conformity steps - will be created for each new CE Marking record
const DEFAULT_CONFORMITY_STEPS = [
  { step_number: 1, step_name: "Confirm high risk classification" },
  { step_number: 2, step_name: "Complete EU AI Act checklist" },
  { step_number: 3, step_name: "Compile technical documentation file" },
  { step_number: 4, step_name: "Internal review and sign off" },
  { step_number: 5, step_name: "Notified body review" },
  { step_number: 6, step_name: "Sign declaration of conformity" },
  { step_number: 7, step_name: "Register in EU database" },
];

/**
 * Get CE Marking data for a project
 * Creates default record if none exists
 */
export const getCEMarking = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).userId;
    const tenantId = (req as any).tenantId;

    // Check if CE Marking record exists
    let ceMarkingResult = await sequelize.query(
      `SELECT * FROM "${tenantId}".ce_markings WHERE project_id = :projectId`,
      {
        replacements: { projectId },
        type: QueryTypes.SELECT
      }
    );

    let ceMarking: any = ceMarkingResult[0];

    // If no record exists, create one with defaults
    if (!ceMarking) {
      // Create CE Marking record
      const createResult = await sequelize.query(
        `INSERT INTO "${tenantId}".ce_markings (
          project_id,
          is_high_risk_ai_system,
          role_in_product,
          annex_iii_category,
          declaration_status,
          registration_status,
          created_by,
          updated_by
        ) VALUES (:projectId, false, 'standalone', 'annex_iii_5', 'draft', 'not_registered', :userId, :userId)
        RETURNING *`,
        {
          replacements: { projectId, userId },
          type: QueryTypes.INSERT
        }
      );

      ceMarking = (createResult as any[])[0][0];

      // Create default conformity steps
      for (const step of DEFAULT_CONFORMITY_STEPS) {
        await sequelize.query(
          `INSERT INTO "${tenantId}".ce_marking_conformity_steps (
            ce_marking_id,
            step_number,
            step_name,
            status
          ) VALUES (:ceMarkingId, :stepNumber, :stepName, 'Not started')`,
          {
            replacements: {
              ceMarkingId: ceMarking.id,
              stepNumber: step.step_number,
              stepName: step.step_name
            },
            type: QueryTypes.INSERT
          }
        );
      }

      // Log creation to audit trail
      await sequelize.query(
        `INSERT INTO "${tenantId}".ce_marking_audit_trail (
          ce_marking_id,
          field_name,
          old_value,
          new_value,
          changed_by,
          change_type
        ) VALUES (:ceMarkingId, 'record', NULL, 'created', :userId, 'create')`,
        {
          replacements: { ceMarkingId: ceMarking.id, userId },
          type: QueryTypes.INSERT
        }
      );
    }

    // Get conformity steps
    const conformitySteps = await sequelize.query(
      `SELECT * FROM "${tenantId}".ce_marking_conformity_steps
       WHERE ce_marking_id = :ceMarkingId
       ORDER BY step_number`,
      {
        replacements: { ceMarkingId: ceMarking.id },
        type: QueryTypes.SELECT
      }
    );

    // Get linked policies
    const linkedPolicies = await sequelize.query(
      `SELECT policy_id FROM "${tenantId}".ce_marking_policies
       WHERE ce_marking_id = :ceMarkingId`,
      {
        replacements: { ceMarkingId: ceMarking.id },
        type: QueryTypes.SELECT
      }
    );

    // Get linked evidences
    const linkedEvidences = await sequelize.query(
      `SELECT file_id FROM "${tenantId}".ce_marking_evidences
       WHERE ce_marking_id = :ceMarkingId`,
      {
        replacements: { ceMarkingId: ceMarking.id },
        type: QueryTypes.SELECT
      }
    );

    // Calculate completed steps count
    const completedStepsCount = (conformitySteps as any[]).filter(
      step => step.status === 'Completed' || step.status === 'Not needed'
    ).length;

    // Calculate EU AI Act controls completion
    let controlsCompleted = 0;
    let controlsTotal = 0;
    let assessmentsCompleted = 0;
    let assessmentsTotal = 0;

    try {
      // Get the EU AI Act framework ID (projects_frameworks.id) for this project
      // EU AI Act has framework_id = 1
      const frameworkResult = await sequelize.query(
        `SELECT id FROM "${tenantId}".projects_frameworks
         WHERE project_id = :projectId AND framework_id = 1`,
        {
          replacements: { projectId },
          type: QueryTypes.SELECT
        }
      );

      if (frameworkResult.length > 0) {
        const projectFrameworkId = (frameworkResult[0] as any).id;

        // Use the same utility functions as the Overview tab
        // Count compliance/controls (subcontrols_eu)
        const { totalSubcontrols, doneSubcontrols } =
          await countSubControlsEUByProjectId(projectFrameworkId, tenantId);

        controlsTotal = parseInt(totalSubcontrols) || 0;
        controlsCompleted = parseInt(doneSubcontrols) || 0;

        // Count assessments (answers_eu)
        const { totalAssessments, answeredAssessments } =
          await countAnswersEUByProjectId(projectFrameworkId, tenantId);

        assessmentsTotal = parseInt(totalAssessments) || 0;
        assessmentsCompleted = parseInt(answeredAssessments) || 0;
      }
    } catch (error) {
      console.error('Error calculating EU AI Act completion:', error);
      // Continue with zeros if calculation fails
    }

    // Format response to match frontend interface
    const response = {
      // Core data
      isHighRiskAISystem: ceMarking.is_high_risk_ai_system,
      roleInProduct: ceMarking.role_in_product,
      annexIIICategory: ceMarking.annex_iii_category,
      intendedPurpose: ceMarking.intended_purpose || "",

      // EU AI Act completion
      controlsCompleted,
      controlsTotal,
      assessmentsCompleted,
      assessmentsTotal,

      // Conformity steps
      conformitySteps: (conformitySteps as any[]).map(step => ({
        id: step.id,
        step: step.step_name,
        description: step.description,
        status: step.status,
        owner: step.owner,
        dueDate: step.due_date,
        completedDate: step.completed_date
      })),
      completedStepsCount,
      totalStepsCount: conformitySteps.length,

      // Declaration
      declarationStatus: ceMarking.declaration_status,
      signedOn: ceMarking.signed_on,
      signatory: ceMarking.signatory,
      declarationDocument: ceMarking.declaration_document,

      // Registration
      registrationStatus: ceMarking.registration_status,
      euRegistrationId: ceMarking.eu_registration_id,
      registrationDate: ceMarking.registration_date,
      euRecordUrl: ceMarking.eu_record_url,

      // Policies and evidence
      policiesLinked: linkedPolicies.length,
      evidenceLinked: linkedEvidences.length,
      linkedPolicies: (linkedPolicies as any[]).map(p => p.policy_id),
      linkedEvidences: (linkedEvidences as any[]).map(e => e.file_id),

      // Incidents
      totalIncidents: ceMarking.total_incidents || 0,
      aiActReportableIncidents: ceMarking.ai_act_reportable_incidents || 0,
      lastIncident: ceMarking.last_incident
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getCEMarking:', error);
    res.status(500).json({ error: 'Failed to get CE Marking data' });
  }
};

/**
 * Update CE Marking data for a project
 */
export const updateCEMarking = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).userId;
    const tenantId = (req as any).tenantId;
    const updates = req.body;

    // Get existing CE Marking record
    const existingResult = await sequelize.query(
      `SELECT * FROM "${tenantId}".ce_markings WHERE project_id = :projectId`,
      {
        replacements: { projectId },
        type: QueryTypes.SELECT
      }
    );

    if (!existingResult[0]) {
      return res.status(404).json({ error: 'CE Marking record not found' });
    }

    const existing: any = existingResult[0];
    const auditEntries: any[] = [];

    // Build update query for main CE Marking table
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Map frontend fields to database columns
    const fieldMapping: Record<string, string> = {
      isHighRiskAISystem: 'is_high_risk_ai_system',
      roleInProduct: 'role_in_product',
      annexIIICategory: 'annex_iii_category',
      intendedPurpose: 'intended_purpose',
      controlsCompleted: 'controls_completed',
      controlsTotal: 'controls_total',
      assessmentsCompleted: 'assessments_completed',
      assessmentsTotal: 'assessments_total',
      declarationStatus: 'declaration_status',
      signedOn: 'signed_on',
      signatory: 'signatory',
      declarationDocument: 'declaration_document',
      registrationStatus: 'registration_status',
      euRegistrationId: 'eu_registration_id',
      registrationDate: 'registration_date',
      euRecordUrl: 'eu_record_url',
      policiesLinked: 'policies_linked',
      evidenceLinked: 'evidence_linked',
      totalIncidents: 'total_incidents',
      aiActReportableIncidents: 'ai_act_reportable_incidents',
      lastIncident: 'last_incident'
    };

    // Process main fields
    for (const [frontendField, dbField] of Object.entries(fieldMapping)) {
      if (updates.hasOwnProperty(frontendField)) {
        const newValue = updates[frontendField];
        const oldValue = existing[dbField];

        // Track changes for audit
        if (oldValue !== newValue) {
          updateFields.push(dbField);
          updateValues.push(newValue);

          auditEntries.push({
            field: dbField,
            oldValue: oldValue?.toString() || null,
            newValue: newValue?.toString() || null
          });
        }
      }
    }

    // Update main record if there are changes
    if (updateFields.length > 0) {
      // Build the SET clause and replacements properly
      const replacements: any = { projectId, userId };
      const setClauseParts: string[] = [];

      // Process regular fields
      updateFields.forEach((field, index) => {
        const paramName = `v${index}`;
        replacements[paramName] = updateValues[index];
        setClauseParts.push(`${field} = :${paramName}`);
      });

      // Add system fields
      setClauseParts.push('updated_at = NOW()');
      setClauseParts.push('updated_by = :userId');

      await sequelize.query(
        `UPDATE "${tenantId}".ce_markings
         SET ${setClauseParts.join(', ')}
         WHERE project_id = :projectId`,
        {
          replacements,
          type: QueryTypes.UPDATE
        }
      );

      // Create audit trail entries
      for (const entry of auditEntries) {
        await sequelize.query(
          `INSERT INTO "${tenantId}".ce_marking_audit_trail (
            ce_marking_id,
            field_name,
            old_value,
            new_value,
            changed_by,
            change_type
          ) VALUES (:ceMarkingId, :field, :oldValue, :newValue, :userId, 'update')`,
          {
            replacements: {
              ceMarkingId: existing.id,
              field: entry.field,
              oldValue: entry.oldValue,
              newValue: entry.newValue,
              userId
            },
            type: QueryTypes.INSERT
          }
        );
      }
    }

    // Handle linked policies updates
    if (updates.linkedPolicies && Array.isArray(updates.linkedPolicies)) {
      // Remove existing linked policies
      await sequelize.query(
        `DELETE FROM "${tenantId}".ce_marking_policies WHERE ce_marking_id = :ceMarkingId`,
        {
          replacements: { ceMarkingId: existing.id },
          type: QueryTypes.DELETE
        }
      );

      // Add new linked policies
      for (const policyId of updates.linkedPolicies) {
        await sequelize.query(
          `INSERT INTO "${tenantId}".ce_marking_policies (ce_marking_id, policy_id, linked_by, linked_at)
           VALUES (:ceMarkingId, :policyId, :userId, NOW())`,
          {
            replacements: { ceMarkingId: existing.id, policyId, userId },
            type: QueryTypes.INSERT
          }
        );
      }

      // Audit trail for policies change
      await sequelize.query(
        `INSERT INTO "${tenantId}".ce_marking_audit_trail (
          ce_marking_id, field_name, old_value, new_value, changed_by, change_type
        ) VALUES (:ceMarkingId, 'linked_policies', :oldValue, :newValue, :userId, 'update')`,
        {
          replacements: {
            ceMarkingId: existing.id,
            oldValue: existing.policies_linked?.toString() || '0',
            newValue: updates.linkedPolicies.length.toString(),
            userId
          },
          type: QueryTypes.INSERT
        }
      );
    }

    // Handle linked evidence updates
    if (updates.linkedEvidences && Array.isArray(updates.linkedEvidences)) {
      // Remove existing linked evidence
      await sequelize.query(
        `DELETE FROM "${tenantId}".ce_marking_evidences WHERE ce_marking_id = :ceMarkingId`,
        {
          replacements: { ceMarkingId: existing.id },
          type: QueryTypes.DELETE
        }
      );

      // Add new linked evidence
      for (const fileId of updates.linkedEvidences) {
        await sequelize.query(
          `INSERT INTO "${tenantId}".ce_marking_evidences (ce_marking_id, file_id, linked_by, linked_at)
           VALUES (:ceMarkingId, :fileId, :userId, NOW())`,
          {
            replacements: { ceMarkingId: existing.id, fileId, userId },
            type: QueryTypes.INSERT
          }
        );
      }

      // Audit trail for evidence change
      await sequelize.query(
        `INSERT INTO "${tenantId}".ce_marking_audit_trail (
          ce_marking_id, field_name, old_value, new_value, changed_by, change_type
        ) VALUES (:ceMarkingId, 'linked_evidence', :oldValue, :newValue, :userId, 'update')`,
        {
          replacements: {
            ceMarkingId: existing.id,
            oldValue: existing.evidence_linked?.toString() || '0',
            newValue: updates.linkedEvidences.length.toString(),
            userId
          },
          type: QueryTypes.INSERT
        }
      );
    }

    // Handle conformity steps updates
    if (updates.conformitySteps && Array.isArray(updates.conformitySteps)) {
      for (const step of updates.conformitySteps) {
        if (step.id) {
          // Get existing step
          const existingStepResult = await sequelize.query(
            `SELECT * FROM "${tenantId}".ce_marking_conformity_steps WHERE id = :stepId`,
            {
              replacements: { stepId: step.id },
              type: QueryTypes.SELECT
            }
          );

          const existingStep: any = existingStepResult[0];
          if (existingStep) {
            const stepUpdates: string[] = [];
            const stepValues: any[] = [];

            // Check each field for changes
            const stepFields = ['description', 'status', 'owner', 'dueDate', 'completedDate'];
            const stepFieldMapping: Record<string, string> = {
              description: 'description',
              status: 'status',
              owner: 'owner',
              dueDate: 'due_date',
              completedDate: 'completed_date'
            };

            for (const field of stepFields) {
              if (step.hasOwnProperty(field)) {
                const dbField = stepFieldMapping[field];
                const newValue = step[field];
                const oldValue = existingStep[dbField];

                if (oldValue !== newValue) {
                  stepUpdates.push(dbField);
                  stepValues.push(newValue);

                  // Audit trail for step changes
                  await sequelize.query(
                    `INSERT INTO "${tenantId}".ce_marking_audit_trail (
                      ce_marking_id,
                      field_name,
                      old_value,
                      new_value,
                      changed_by,
                      change_type
                    ) VALUES (:ceMarkingId, :fieldName, :oldValue, :newValue, :userId, 'update')`,
                    {
                      replacements: {
                        ceMarkingId: existing.id,
                        fieldName: `step_${existingStep.step_number}_${dbField}`,
                        oldValue: oldValue?.toString() || null,
                        newValue: newValue?.toString() || null,
                        userId
                      },
                      type: QueryTypes.INSERT
                    }
                  );
                }
              }
            }

            // Auto-populate completed_date when status changes to Completed
            if (step.status === 'Completed' && existingStep.status !== 'Completed' && !step.completedDate) {
              stepUpdates.push('completed_date');
              stepValues.push(new Date().toISOString().split('T')[0]);
            }

            // Update step if there are changes
            if (stepUpdates.length > 0) {
              // Build the SET clause and replacements properly for steps
              const stepReplacements: any = { stepId: step.id };
              const stepSetClauseParts: string[] = [];

              // Process step fields
              stepUpdates.forEach((field, index) => {
                const paramName = `sv${index}`;
                stepReplacements[paramName] = stepValues[index];
                stepSetClauseParts.push(`${field} = :${paramName}`);
              });

              // Add updated_at field
              stepSetClauseParts.push('updated_at = NOW()');

              await sequelize.query(
                `UPDATE "${tenantId}".ce_marking_conformity_steps
                 SET ${stepSetClauseParts.join(', ')}
                 WHERE id = :stepId`,
                {
                  replacements: stepReplacements,
                  type: QueryTypes.UPDATE
                }
              );
            }
          }
        }
      }
    }

    // Return updated data
    await getCEMarking(req, res);
  } catch (error) {
    console.error('Error in updateCEMarking:', error);
    res.status(500).json({ error: 'Failed to update CE Marking data' });
  }
};