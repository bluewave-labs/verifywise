import { ProjectRiskModel } from "../domain.layer/models/projectRisks/projectRisk.model";
import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";
import { updateProjectUpdatedByIdQuery } from "./project.utils";
import { IProjectRisk } from "../domain.layer/interfaces/I.projectRisk";

type Mitigation = { id: number, meta_id: number, parent_id: number, sup_id: string, title: string, sub_id: number }

export const getAllProjectRisksQuery = async (
  projectId: number,
  tenant: string
): Promise<IProjectRisk[]> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".projectrisks WHERE project_id = :project_id ORDER BY created_at DESC, id ASC`,
    { replacements: { project_id: projectId } }
  ) as [IProjectRisk[], number];
  const projectRisks = result[0]
  for (let risk of projectRisks) {
    (risk as any).subClauses = [];
    (risk as any).annexCategories = [];
    (risk as any).controls = [];

    const attachedSubClauses = await sequelize.query(
      `SELECT
        scr.subclause_id AS id, sc.subclause_meta_id AS meta_id, csi.clause_no AS sup_id, scs.title, scs.order_no AS sub_id, csi.id AS parent_id
      FROM "${tenant}".subclauses_iso__risks scr JOIN "${tenant}".subclauses_iso sc ON scr.subclause_id = sc.id
      JOIN public.subclauses_struct_iso scs ON scs.id = sc.subclause_meta_id
      JOIN public.clauses_struct_iso csi ON csi.id = scs.clause_id
      WHERE projects_risks_id = :riskId`,
      { replacements: { riskId: risk.id } }
    ) as [Mitigation[], number];
    if (attachedSubClauses[0].length > 0) {
      (risk as any).subClauses = attachedSubClauses[0];
    }

    const attachedAnnexCategories = await sequelize.query(
      `SELECT
       acr.annexcategory_id AS id, ac.annexcategory_meta_id AS meta_id, asi.annex_no AS sup_id, acs.sub_id AS sub_id, acs.title, asi.id AS parent_id
      FROM "${tenant}".annexcategories_iso__risks acr JOIN "${tenant}".annexcategories_iso ac ON acr.annexcategory_id = ac.id
      JOIN public.annexcategories_struct_iso acs ON acs.id = ac.annexcategory_meta_id
      JOIN public.annex_struct_iso asi ON asi.id = acs.annex_id
      WHERE projects_risks_id = :riskId`,
      { replacements: { riskId: risk.id } }
    ) as [Mitigation[], number];
    if (attachedAnnexCategories[0].length > 0) {
      (risk as any).annexCategories = attachedAnnexCategories[0];
    }

    const attachedControls = await sequelize.query(
      `SELECT cr.control_id AS id, ac.control_meta_id AS meta_id, ccs.id AS sup_id, cse.id AS sub_id, cse.title, cse.id AS parent_id
      FROM "${tenant}".controls_eu__risks cr JOIN "${tenant}".controls_eu ac ON cr.control_id = ac.id
      JOIN public.controls_struct_eu cse ON cse.id = ac.control_meta_id
      JOIN public.controlcategories_struct_eu ccs ON ccs.id = cse.control_category_id
      WHERE projects_risks_id = :riskId`,
      { replacements: { riskId: risk.id } }
    ) as [Mitigation[], number];
    if (attachedControls[0].length > 0) {
      (risk as any).controls = attachedControls[0];
    }

    const attachedAssessments = await sequelize.query(
      `SELECT ans.id AS id, ans.question_id AS meta_id, ts.id AS sup_id, sts.id AS sub_id, 
        ts.title || '. ' || sts.title || '. ' || qse.question AS title, 
        qse.id AS parent_id
      FROM "${tenant}".answers_eu__risks aur JOIN "${tenant}".answers_eu ans ON aur.answer_id = ans.id
      JOIN public.questions_struct_eu qse ON qse.id = ans.question_id
      JOIN public.subtopics_struct_eu sts ON sts.id = qse.subtopic_id
      JOIN public.topics_struct_eu ts ON ts.id = sts.topic_id
      WHERE projects_risks_id = :riskId`,
      { replacements: { riskId: risk.id } }
    ) as [Mitigation[], number];
    if (attachedAssessments[0].length > 0) {
      (risk as any).assessments = attachedAssessments[0];
    }
  }
  return projectRisks;
};

export const getProjectRiskByIdQuery = async (
  id: number,
  tenant: string
): Promise<IProjectRisk | null> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".projectrisks WHERE id = :id`,
    { replacements: { id } }
  ) as [IProjectRisk[], number];
  const projectRisk = result[0][0];
  if (!projectRisk) return null;

  (projectRisk as any).subClauses = [];
  (projectRisk as any).annexCategories = [];
  (projectRisk as any).controls = [];
  (projectRisk as any).assessments = [];

  const attachedSubClauses = await sequelize.query(
    `SELECT
        scr.subclause_id AS id, sc.subclause_meta_id AS meta_id, csi.clause_no AS sup_id, scs.title, scs.order_no AS sub_id, csi.id AS parent_id
      FROM "${tenant}".subclauses_iso__risks scr JOIN "${tenant}".subclauses_iso sc ON scr.subclause_id = sc.id
      JOIN public.subclauses_struct_iso scs ON scs.id = sc.subclause_meta_id
      JOIN public.clauses_struct_iso csi ON csi.id = scs.clause_id
      WHERE projects_risks_id = :riskId`,
    { replacements: { riskId: projectRisk.id } }
  ) as [Mitigation[], number];
  if (attachedSubClauses[0].length > 0) {
    (projectRisk as any).subClauses = attachedSubClauses[0];
  }

  const attachedAnnexCategories = await sequelize.query(
    `SELECT
       acr.annexcategory_id AS id, ac.annexcategory_meta_id AS meta_id, asi.annex_no AS sup_id, acs.sub_id AS sub_id, acs.title, asi.id AS parent_id
      FROM "${tenant}".annexcategories_iso__risks acr JOIN "${tenant}".annexcategories_iso ac ON acr.annexcategory_id = ac.id
      JOIN public.annexcategories_struct_iso acs ON acs.id = ac.annexcategory_meta_id
      JOIN public.annex_struct_iso asi ON asi.id = acs.annex_id
      WHERE projects_risks_id = :riskId`,
    { replacements: { riskId: projectRisk.id } }
  ) as [Mitigation[], number];
  if (attachedAnnexCategories[0].length > 0) {
    (projectRisk as any).annexCategories = attachedAnnexCategories[0];
  }

  const attachedControls = await sequelize.query(
    `SELECT cr.control_id AS id, ac.control_meta_id AS meta_id, ccs.id AS sup_id, cse.id AS sub_id, cse.title, cse.id AS parent_id
      FROM "${tenant}".controls_eu__risks cr JOIN "${tenant}".controls_eu ac ON cr.control_id = ac.id
      JOIN public.controls_struct_eu cse ON cse.id = ac.control_meta_id
      JOIN public.controlcategories_struct_eu ccs ON ccs.id = cse.control_category_id
      WHERE projects_risks_id = :riskId`,
    { replacements: { riskId: projectRisk.id } }
  ) as [Mitigation[], number];
  if (attachedControls[0].length > 0) {
    (projectRisk as any).controls = attachedControls[0];
  }

  const attachedAssessments = await sequelize.query(
    `SELECT ans.id AS id, ans.question_id AS meta_id, ts.id AS sup_id, sts.id AS sub_id, 
        ts.title || '. ' || sts.title || '. ' || qse.question AS title, 
        qse.id AS parent_id
      FROM "${tenant}".answers_eu__risks aur JOIN "${tenant}".answers_eu ans ON aur.answer_id = ans.id
      JOIN public.questions_struct_eu qse ON qse.id = ans.question_id
      JOIN public.subtopics_struct_eu sts ON sts.id = qse.subtopic_id
      JOIN public.topics_struct_eu ts ON ts.id = sts.topic_id
      WHERE projects_risks_id = :riskId`,
    { replacements: { riskId: projectRisk.id } }
  ) as [Mitigation[], number];
  if (attachedAssessments[0].length > 0) {
    (projectRisk as any).assessments = attachedAssessments[0];
  }

  return projectRisk;
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
