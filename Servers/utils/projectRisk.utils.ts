import { ProjectRisk, ProjectRiskModel } from "../models/projectRisk.model";
import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";
import { updateProjectUpdatedByIdQuery } from "./project.utils";

export const getAllProjectRisksQuery = async (
  projectId: number
): Promise<ProjectRisk[]> => {
  const projectRisks = await sequelize.query(
    "SELECT * FROM projectrisks WHERE project_id = :project_id ORDER BY created_at DESC, id ASC",
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: ProjectRiskModel
    }
  );
  return projectRisks;
};

export const getProjectRiskByIdQuery = async (
  id: number
): Promise<ProjectRisk | null> => {
  const result = await sequelize.query("SELECT * FROM projectrisks WHERE id = :id",
    {
      replacements: { id },
      mapToModel: true,
      model: ProjectRiskModel
    }
  );
  return result[0];
};

export const createProjectRiskQuery = async (projectRisk: Partial<ProjectRisk>): Promise<ProjectRisk> => {
  const result = await sequelize.query(
    `INSERT INTO projectrisks (
      project_id, risk_name, risk_owner, ai_lifecycle_phase, risk_description,
      risk_category, impact, assessment_mapping, controls_mapping, likelihood,
      severity, risk_level_autocalculated, review_notes, mitigation_status,
      current_risk_level, deadline, mitigation_plan, implementation_strategy,
      mitigation_evidence_document, likelihood_mitigation, risk_severity,
      final_risk_level, risk_approval, approval_status, date_of_assessment
    ) VALUES (
      :project_id, :risk_name, :risk_owner, :ai_lifecycle_phase, :risk_description,
      :risk_category, :impact, :assessment_mapping, :controls_mapping, :likelihood,
      :severity, :risk_level_autocalculated, :review_notes, :mitigation_status,
      :current_risk_level, :deadline, :mitigation_plan, :implementation_strategy,
      :mitigation_evidence_document, :likelihood_mitigation, :risk_severity,
      :final_risk_level, :risk_approval, :approval_status, :date_of_assessment
    ) RETURNING *`,
    {
      replacements: {
        project_id: projectRisk.project_id,
        risk_name: projectRisk.risk_name,
        risk_owner: projectRisk.risk_owner,
        ai_lifecycle_phase: projectRisk.ai_lifecycle_phase,
        risk_description: projectRisk.risk_description,
        risk_category: projectRisk.risk_category,
        impact: projectRisk.impact,
        assessment_mapping: projectRisk.assessment_mapping,
        controls_mapping: projectRisk.controls_mapping,
        likelihood: projectRisk.likelihood,
        severity: projectRisk.severity,
        risk_level_autocalculated: projectRisk.risk_level_autocalculated,
        review_notes: projectRisk.review_notes,
        mitigation_status: projectRisk.mitigation_status,
        current_risk_level: projectRisk.current_risk_level,
        deadline: projectRisk.deadline,
        mitigation_plan: projectRisk.mitigation_plan,
        implementation_strategy: projectRisk.implementation_strategy,
        mitigation_evidence_document: projectRisk.mitigation_evidence_document,
        likelihood_mitigation: projectRisk.likelihood_mitigation,
        risk_severity: projectRisk.risk_severity,
        final_risk_level: projectRisk.final_risk_level,
        risk_approval: projectRisk.risk_approval,
        approval_status: projectRisk.approval_status,
        date_of_assessment: projectRisk.date_of_assessment,
      },
      mapToModel: true,
      model: ProjectRiskModel,
      // type: QueryTypes.INSERT
    }
  );
  await updateProjectUpdatedByIdQuery(result[0].id!, "projectrisks");
  return result[0];
};

export const updateProjectRiskByIdQuery = async (
  id: number,
  projectRisk: Partial<ProjectRisk>
): Promise<ProjectRisk | null> => {
  const updateProjectRisk: Partial<Record<keyof ProjectRisk, any>> = {};
  const setClause = [
    "project_id",
    "risk_name",
    "risk_owner",
    "ai_lifecycle_phase",
    "risk_description",
    "risk_category",
    "impact",
    "assessment_mapping",
    "controls_mapping",
    "likelihood",
    "severity",
    "risk_level_autocalculated",
    "review_notes",
    "mitigation_status",
    "current_risk_level",
    "deadline",
    "mitigation_plan",
    "implementation_strategy",
    "mitigation_evidence_document",
    "likelihood_mitigation",
    "risk_severity",
    "final_risk_level",
    "risk_approval",
    "approval_status",
    "date_of_assessment",
  ].filter(f => {
    if (projectRisk[f as keyof ProjectRisk] !== undefined) {
      updateProjectRisk[f as keyof ProjectRisk] = projectRisk[f as keyof ProjectRisk]
      return true
    }
  }).map(f => `${f} = :${f}`).join(", ");

  const query = `UPDATE projectrisks SET ${setClause} WHERE id = :id RETURNING *;`;

  updateProjectRisk.id = id;

  const result = await sequelize.query(query, {
    replacements: updateProjectRisk,
    mapToModel: true,
    model: ProjectRiskModel,
    // type: QueryTypes.UPDATE,
  });
  await updateProjectUpdatedByIdQuery(id, "projectrisks");
  return result[0];
};

export const deleteProjectRiskByIdQuery = async (
  id: number
): Promise<Boolean> => {
  const result = await sequelize.query(
    "DELETE FROM projectrisks WHERE id = :id RETURNING *",
    {
      replacements: { id },
      mapToModel: true,
      model: ProjectRiskModel,
      type: QueryTypes.DELETE,
    }
  );
  await updateProjectUpdatedByIdQuery(id, "projectrisks");
  return result.length > 0;
};
