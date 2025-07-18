import { ProjectRiskModel } from "../domain.layer/models/projectRisks/projectRisk.model";
import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";
import { updateProjectUpdatedByIdQuery } from "./project.utils";
import { IProjectRisk } from "../domain.layer/interfaces/I.projectRisk";

export const getAllProjectRisksQuery = async (
  projectId: number,
  tenant: string
): Promise<IProjectRisk[]> => {
  const projectRisks = await sequelize.query(
    `SELECT * FROM "${tenant}".projectrisks WHERE project_id = :project_id ORDER BY created_at DESC, id ASC`,
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: ProjectRiskModel,
    }
  );
  return projectRisks;
};

export const getProjectRiskByIdQuery = async (
  id: number,
  tenant: string
): Promise<IProjectRisk | null> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".projectrisks WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: ProjectRiskModel,
    }
  );
  return result[0];
};

export const getNonMitigatedProjectRisksQuery = async (
  projectId: number,
  tenant: string
): Promise<IProjectRisk[]> => {
  const projectRisks = await sequelize.query(
    `SELECT pr.* FROM "${tenant}".projectrisks pr RIGHT JOIN "${tenant}".annexcategories_iso__risks acr ON pr.id = acr.project_risk_id WHERE acr IS NULL;`,
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: ProjectRiskModel,
    }
  );
  return projectRisks;
};

export const createProjectRiskQuery = async (
  projectRisk: Partial<ProjectRiskModel>,
  tenant: string,
  transaction: Transaction
): Promise<ProjectRiskModel> => {
  const result = await sequelize.query(
    `INSERT INTO "${tenant}".projectrisks (
      project_id, risk_name, risk_owner, ai_lifecycle_phase, risk_description,
      risk_category, impact, assessment_mapping, controls_mapping, likelihood,
      severity, risk_level_autocalculated, review_notes, mitigation_status,
      current_risk_level, deadline, mitigation_plan, implementation_strategy,
      mitigation_evidence_document, likelihood_mitigation, risk_severity,
      final_risk_level, risk_approval, approval_status, date_of_assessment
    ) VALUES (
      :project_id, :risk_name, :risk_owner, :ai_lifecycle_phase, :risk_description,
      ARRAY[:risk_category], :impact, :assessment_mapping, :controls_mapping, :likelihood,
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
      transaction,
    }
  );
  await updateProjectUpdatedByIdQuery(
    result[0].id!,
    "projectrisks",
    tenant,
    transaction
  );
  return result[0];
};

export const updateProjectRiskByIdQuery = async (
  id: number,
  projectRisk: Partial<ProjectRiskModel>,
  tenant: string,
  transaction: Transaction
): Promise<ProjectRiskModel | null> => {
  const updateProjectRisk: Partial<Record<keyof ProjectRiskModel, any>> = {};
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
  ]
    .filter((f) => {
      if (
        projectRisk[f as keyof ProjectRiskModel] !== undefined &&
        projectRisk[f as keyof ProjectRiskModel]
      ) {
        updateProjectRisk[f as keyof ProjectRiskModel] =
          projectRisk[f as keyof ProjectRiskModel];
        return true;
      }
    })
    .map((f) => {
      if (f === "risk_category") {
        return `${f} = ARRAY[:${f}]`;
      }
      return `${f} = :${f}`;
    })
    .join(", ");

  const query = `UPDATE "${tenant}".projectrisks SET ${setClause} WHERE id = :id RETURNING *;`;

  updateProjectRisk.id = id;

  const result = await sequelize.query(query, {
    replacements: updateProjectRisk,
    mapToModel: true,
    model: ProjectRiskModel,
    // type: QueryTypes.UPDATE,
    transaction,
  });
  await updateProjectUpdatedByIdQuery(id, "projectrisks", tenant, transaction);
  return result[0];
};

export const deleteProjectRiskByIdQuery = async (
  id: number,
  tenant: string,
  transaction: Transaction
): Promise<Boolean> => {
  await updateProjectUpdatedByIdQuery(id, "projectrisks", tenant, transaction);
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".projectrisks WHERE id = :id RETURNING *`,
    {
      replacements: { id },
      mapToModel: true,
      model: ProjectRiskModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0;
};
