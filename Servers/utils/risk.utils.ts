import { RiskModel } from "../domain.layer/models/risks/risk.model";
import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";
import { updateProjectUpdatedByIdQuery } from "./project.utils";
import { IRisk } from "../domain.layer/interfaces/I.risk";
import { IProjectFrameworks } from "../domain.layer/interfaces/i.projectFramework";

type Mitigation = { id: number, meta_id: number, parent_id: number, sup_id: string, title: string, sub_id: number, project_id: number };

export const getAllRisksQuery = async (
  tenant: string
): Promise<IRisk[]> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".risks ORDER BY created_at DESC, id ASC`,
  ) as [IRisk[], number];
  const projectRisks = result[0]

  for (let risk of projectRisks) {
    (risk as any).projects = [];
    (risk as any).frameworks = [];
    (risk as any).subClauses = [];
    (risk as any).annexCategories = [];
    (risk as any).controls = [];
    (risk as any).assessments = [];
    (risk as any).subClauses_27001 = [];
    (risk as any).annexControls_27001 = [];

    const attachedProjects = await sequelize.query(
      `SELECT project_id FROM "${tenant}".projects_risks WHERE risk_id = :riskId`,
      { replacements: { riskId: risk.id } }
    ) as [{ project_id: number }[], number];
    if (attachedProjects[0].length > 0) {
      (risk as any).projects = attachedProjects[0].map(p => p.project_id);
    }

    const attachedFrameworks = await sequelize.query(
      `SELECT framework_id FROM "${tenant}".frameworks_risks WHERE risk_id = :riskId`,
      { replacements: { riskId: risk.id } }
    ) as [{ framework_id: number }[], number];
    if (attachedFrameworks[0].length > 0) {
      (risk as any).frameworks = attachedFrameworks[0].map(f => f.framework_id);
    }

    const attachedSubClauses = await sequelize.query(
      `SELECT
        scr.subclause_id AS id, sc.subclause_meta_id AS meta_id, csi.clause_no AS sup_id, scs.title, scs.order_no AS sub_id, csi.id AS parent_id, pf.project_id AS project_id
      FROM "${tenant}".subclauses_iso__risks scr JOIN "${tenant}".subclauses_iso sc ON scr.subclause_id = sc.id
      JOIN public.subclauses_struct_iso scs ON scs.id = sc.subclause_meta_id
      JOIN public.clauses_struct_iso csi ON csi.id = scs.clause_id
      JOIN "${tenant}".projects_frameworks pf ON pf.framework_id = csi.framework_id
      WHERE projects_risks_id = :riskId`,
      { replacements: { riskId: risk.id } }
    ) as [Mitigation[], number];
    if (attachedSubClauses[0].length > 0) {
      (risk as any).subClauses = attachedSubClauses[0];
    }

    const attachedAnnexCategories = await sequelize.query(
      `SELECT
       acr.annexcategory_id AS id, ac.annexcategory_meta_id AS meta_id, asi.annex_no AS sup_id, acs.sub_id AS sub_id, acs.title, asi.id AS parent_id, pf.project_id AS project_id
      FROM "${tenant}".annexcategories_iso__risks acr JOIN "${tenant}".annexcategories_iso ac ON acr.annexcategory_id = ac.id
      JOIN public.annexcategories_struct_iso acs ON acs.id = ac.annexcategory_meta_id
      JOIN public.annex_struct_iso asi ON asi.id = acs.annex_id
      JOIN "${tenant}".projects_frameworks pf ON pf.framework_id = asi.framework_id
      WHERE projects_risks_id = :riskId`,
      { replacements: { riskId: risk.id } }
    ) as [Mitigation[], number];
    if (attachedAnnexCategories[0].length > 0) {
      (risk as any).annexCategories = attachedAnnexCategories[0];
    }

    const attachedControls = await sequelize.query(
      `SELECT cr.control_id AS id, ac.control_meta_id AS meta_id, ccs.id AS sup_id, cse.id AS sub_id, cse.title, cse.id AS parent_id, pf.project_id AS project_id
      FROM "${tenant}".controls_eu__risks cr JOIN "${tenant}".controls_eu ac ON cr.control_id = ac.id
      JOIN public.controls_struct_eu cse ON cse.id = ac.control_meta_id
      JOIN public.controlcategories_struct_eu ccs ON ccs.id = cse.control_category_id
      JOIN "${tenant}".projects_frameworks pf ON pf.framework_id = ccs.framework_id
      WHERE projects_risks_id = :riskId`,
      { replacements: { riskId: risk.id } }
    ) as [Mitigation[], number];
    if (attachedControls[0].length > 0) {
      (risk as any).controls = attachedControls[0];
    }

    const attachedAssessments = await sequelize.query(
      `SELECT ans.id AS id, ans.question_id AS meta_id, ts.id AS sup_id, sts.id AS sub_id, 
        ts.title || '. ' || sts.title || '. ' || qse.question AS title, 
        qse.id AS parent_id, pf.project_id AS project_id
      FROM "${tenant}".answers_eu__risks aur JOIN "${tenant}".answers_eu ans ON aur.answer_id = ans.id
      JOIN public.questions_struct_eu qse ON qse.id = ans.question_id
      JOIN public.subtopics_struct_eu sts ON sts.id = qse.subtopic_id
      JOIN public.topics_struct_eu ts ON ts.id = sts.topic_id
      JOIN "${tenant}".projects_frameworks pf ON pf.framework_id = ts.framework_id
      WHERE projects_risks_id = :riskId`,
      { replacements: { riskId: risk.id } }
    ) as [Mitigation[], number];
    if (attachedAssessments[0].length > 0) {
      (risk as any).assessments = attachedAssessments[0];
    }

    const attachedAnnexControls_27001 = await sequelize.query(
      `SELECT acr.annexcontrol_id AS id, ac.annexcontrol_meta_id AS meta_id, ccs.id AS sup_id, cse.id AS sub_id, cse.title, cse.id AS parent_id, pf.project_id AS project_id
      FROM "${tenant}".annexcontrols_iso27001__risks acr JOIN "${tenant}".annexcontrols_iso27001 ac ON acr.annexcontrol_id = ac.id
      JOIN public.annexcontrols_struct_iso27001 cse ON cse.id = ac.annexcontrol_meta_id
      JOIN public.annex_struct_iso27001 ccs ON ccs.id = cse.annex_id
      JOIN "${tenant}".projects_frameworks pf ON pf.framework_id = ccs.framework_id
      WHERE projects_risks_id = :riskId`,
      { replacements: { riskId: risk.id } }
    ) as [Mitigation[], number];
    if (attachedAnnexControls_27001[0].length > 0) {
      (risk as any).annexControls_27001 = attachedAnnexControls_27001[0];
    }

    const attachedSubClauses_27001 = await sequelize.query(
      `SELECT
        scr.subclause_id AS id, sc.subclause_meta_id AS meta_id, csi.arrangement AS sup_id, scs.title, scs.order_no AS sub_id, csi.id AS parent_id, pf.project_id AS project_id
      FROM "${tenant}".subclauses_iso27001__risks scr JOIN "${tenant}".subclauses_iso27001 sc ON scr.subclause_id = sc.id
      JOIN public.subclauses_struct_iso27001 scs ON scs.id = sc.subclause_meta_id
      JOIN public.clauses_struct_iso27001 csi ON csi.id = scs.clause_id
      JOIN "${tenant}".projects_frameworks pf ON pf.framework_id = csi.framework_id
      WHERE projects_risks_id = :riskId`,
      { replacements: { riskId: risk.id } }
    ) as [Mitigation[], number];
    if (attachedSubClauses_27001[0].length > 0) {
      (risk as any).subClauses_27001 = attachedSubClauses_27001[0];
    }
  }
  return projectRisks;
};

export const getRisksByProjectQuery = async (
  projectId: number,
  tenant: string
): Promise<IRisk[] | null> => {
  const result = await sequelize.query(
    `SELECT
      r.*,
      COALESCE(
        JSON_AGG(DISTINCT p.id) FILTER (WHERE p.id IS NOT NULL),
        '[]'
      ) as projects,
      COALESCE(
        JSON_AGG(DISTINCT f.id) FILTER (WHERE f.id IS NOT NULL),
        '[]'
      ) as frameworks
    FROM "${tenant}".risks r
      INNER JOIN "${tenant}".projects_risks pr_filter ON r.id = pr_filter.risk_id AND pr_filter.project_id = :projectId
      LEFT JOIN "${tenant}".projects_risks pr ON r.id = pr.risk_id
      LEFT JOIN "${tenant}".projects p ON pr.project_id = p.id
      LEFT JOIN "${tenant}".frameworks_risks fr ON r.id = fr.risk_id
      LEFT JOIN public.frameworks f ON fr.framework_id = f.id
      GROUP BY r.id
      ORDER BY r.created_at DESC, r.id ASC`,
    { replacements: { projectId } }
  ) as [IRisk[], number];
  return result[0];
};

export const getRisksByFrameworkQuery = async (
  frameworkId: number,
  tenant: string
): Promise<IRisk[] | null> => {
  const result = await sequelize.query(
    `SELECT
      r.*,
      COALESCE(
        JSON_AGG(DISTINCT p.id) FILTER (WHERE p.id IS NOT NULL),
        '[]'
      ) AS projects,
      COALESCE(
        JSON_AGG(DISTINCT f.id) FILTER (WHERE f.id IS NOT NULL),
        '[]'
      ) AS frameworks
    FROM "${tenant}".risks r
    INNER JOIN "${tenant}".frameworks_risks fr_filter ON r.id = fr_filter.risk_id AND fr_filter.framework_id = :frameworkId
    LEFT JOIN "${tenant}".projects_risks pr ON r.id = pr.risk_id
    LEFT JOIN "${tenant}".projects p ON pr.project_id = p.id
    LEFT JOIN "${tenant}".frameworks_risks fr ON r.id = fr.risk_id
    LEFT JOIN public.frameworks f ON fr.framework_id = f.id
    GROUP BY r.id
    ORDER BY r.created_at DESC, r.id ASC;
    `,
    { replacements: { frameworkId } }
  ) as [IRisk[], number];
  return result[0];
};

export const getRiskByIdQuery = async (
  id: number,
  tenant: string
): Promise<IRisk | null> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".risks WHERE id = :id`,
    { replacements: { id } }
  ) as [IRisk[], number];
  const projectRisk = result[0][0];
  if (!projectRisk) return null;

  (projectRisk as any).projects = [];
  (projectRisk as any).frameworks = [];
  (projectRisk as any).subClauses = [];
  (projectRisk as any).annexCategories = [];
  (projectRisk as any).controls = [];
  (projectRisk as any).assessments = [];
  (projectRisk as any).subClauses_27001 = [];
  (projectRisk as any).annexControls_27001 = [];

  const attachedProjects = await sequelize.query(
    `SELECT project_id FROM "${tenant}".projects_risks WHERE risk_id = :riskId`,
    { replacements: { riskId: projectRisk.id } }
  ) as [{ project_id: number }[], number];
  if (attachedProjects[0].length > 0) {
    (projectRisk as any).projects = attachedProjects[0].map(p => p.project_id);
  }

  const attachedFrameworks = await sequelize.query(
    `SELECT framework_id FROM "${tenant}".frameworks_risks WHERE risk_id = :riskId`,
    { replacements: { riskId: projectRisk.id } }
  ) as [{ framework_id: number }[], number];
  if (attachedFrameworks[0].length > 0) {
    (projectRisk as any).frameworks = attachedFrameworks[0].map(f => f.framework_id);
  }

  const attachedSubClauses = await sequelize.query(
    `SELECT
        scr.subclause_id AS id, sc.subclause_meta_id AS meta_id, csi.clause_no AS sup_id, scs.title, scs.order_no AS sub_id, csi.id AS parent_id, pf.project_id AS project_id
      FROM "${tenant}".subclauses_iso__risks scr JOIN "${tenant}".subclauses_iso sc ON scr.subclause_id = sc.id
      JOIN public.subclauses_struct_iso scs ON scs.id = sc.subclause_meta_id
      JOIN public.clauses_struct_iso csi ON csi.id = scs.clause_id
      JOIN "${tenant}".projects_frameworks pf ON pf.framework_id = csi.framework_id
      WHERE projects_risks_id = :riskId`,
    { replacements: { riskId: projectRisk.id } }
  ) as [Mitigation[], number];
  if (attachedSubClauses[0].length > 0) {
    (projectRisk as any).subClauses = attachedSubClauses[0];
  }

  const attachedAnnexCategories = await sequelize.query(
    `SELECT
       acr.annexcategory_id AS id, ac.annexcategory_meta_id AS meta_id, asi.annex_no AS sup_id, acs.sub_id AS sub_id, acs.title, asi.id AS parent_id, pf.project_id AS project_id
      FROM "${tenant}".annexcategories_iso__risks acr JOIN "${tenant}".annexcategories_iso ac ON acr.annexcategory_id = ac.id
      JOIN public.annexcategories_struct_iso acs ON acs.id = ac.annexcategory_meta_id
      JOIN public.annex_struct_iso asi ON asi.id = acs.annex_id
      JOIN "${tenant}".projects_frameworks pf ON pf.framework_id = asi.framework_id
      WHERE projects_risks_id = :riskId`,
    { replacements: { riskId: projectRisk.id } }
  ) as [Mitigation[], number];
  if (attachedAnnexCategories[0].length > 0) {
    (projectRisk as any).annexCategories = attachedAnnexCategories[0];
  }

  const attachedControls = await sequelize.query(
    `SELECT cr.control_id AS id, ac.control_meta_id AS meta_id, ccs.id AS sup_id, cse.id AS sub_id, cse.title, cse.id AS parent_id, pf.project_id AS project_id
      FROM "${tenant}".controls_eu__risks cr JOIN "${tenant}".controls_eu ac ON cr.control_id = ac.id
      JOIN public.controls_struct_eu cse ON cse.id = ac.control_meta_id
      JOIN public.controlcategories_struct_eu ccs ON ccs.id = cse.control_category_id
      JOIN "${tenant}".projects_frameworks pf ON pf.framework_id = ccs.framework_id
      WHERE projects_risks_id = :riskId`,
    { replacements: { riskId: projectRisk.id } }
  ) as [Mitigation[], number];
  if (attachedControls[0].length > 0) {
    (projectRisk as any).controls = attachedControls[0];
  }

  const attachedAssessments = await sequelize.query(
    `SELECT ans.id AS id, ans.question_id AS meta_id, ts.id AS sup_id, sts.id AS sub_id, 
        ts.title || '. ' || sts.title || '. ' || qse.question AS title, 
        qse.id AS parent_id, pf.project_id AS project_id
      FROM "${tenant}".answers_eu__risks aur JOIN "${tenant}".answers_eu ans ON aur.answer_id = ans.id
      JOIN public.questions_struct_eu qse ON qse.id = ans.question_id
      JOIN public.subtopics_struct_eu sts ON sts.id = qse.subtopic_id
      JOIN public.topics_struct_eu ts ON ts.id = sts.topic_id
      JOIN "${tenant}".projects_frameworks pf ON pf.framework_id = ts.framework_id
      WHERE projects_risks_id = :riskId`,
    { replacements: { riskId: projectRisk.id } }
  ) as [Mitigation[], number];
  if (attachedAssessments[0].length > 0) {
    (projectRisk as any).assessments = attachedAssessments[0];
  }

  const attachedAnnexControls_27001 = await sequelize.query(
    `SELECT acr.annexcontrol_id AS id, ac.annexcontrol_meta_id AS meta_id, ccs.id AS sup_id, cse.id AS sub_id, cse.title, cse.id AS parent_id, pf.project_id AS project_id
      FROM "${tenant}".annexcontrols_iso27001__risks acr JOIN "${tenant}".annexcontrols_iso27001 ac ON acr.annexcontrol_id = ac.id
      JOIN public.annexcontrols_struct_iso27001 cse ON cse.id = ac.annexcontrol_meta_id
      JOIN public.annex_struct_iso27001 ccs ON ccs.id = cse.annex_id
      JOIN "${tenant}".projects_frameworks pf ON pf.framework_id = ccs.framework_id
      WHERE projects_risks_id = :riskId`,
    { replacements: { riskId: projectRisk.id } }
  ) as [Mitigation[], number];
  if (attachedAnnexControls_27001[0].length > 0) {
    (projectRisk as any).annexControls_27001 = attachedAnnexControls_27001[0];
  }

  const attachedSubClauses_27001 = await sequelize.query(
    `SELECT
        scr.subclause_id AS id, sc.subclause_meta_id AS meta_id, csi.arrangement AS sup_id, scs.title, scs.order_no AS sub_id, csi.id AS parent_id, pf.project_id AS project_id
      FROM "${tenant}".subclauses_iso27001__risks scr JOIN "${tenant}".subclauses_iso27001 sc ON scr.subclause_id = sc.id
      JOIN public.subclauses_struct_iso27001 scs ON scs.id = sc.subclause_meta_id
      JOIN public.clauses_struct_iso27001 csi ON csi.id = scs.clause_id
      JOIN "${tenant}".projects_frameworks pf ON pf.framework_id = csi.framework_id
      WHERE projects_risks_id = :riskId`,
    { replacements: { riskId: projectRisk.id } }
  ) as [Mitigation[], number];
  if (attachedSubClauses_27001[0].length > 0) {
    (projectRisk as any).subClauses_27001 = attachedSubClauses_27001[0];
  }

  return projectRisk;
};

const createProjectRiskLink = async (
  projects: number[],
  riskId: number,
  tenant: string,
  transaction: Transaction
): Promise<void> => {
  const projectReplacements: { [key: string]: number }[] = []
  const placeholders = projects.map((_, index) => {
    projectReplacements.push({ [`projectId_${index}`]: projects![index] });
    return `(:projectId_${index}, :riskId)`;
  }).join(", ");
  const replacements: any = { riskId: riskId, ...Object.assign({}, ...projectReplacements) };
  await sequelize.query(
    `INSERT INTO "${tenant}".projects_risks (project_id, risk_id) VALUES ${placeholders}`,
    {
      replacements,
      transaction,
    }
  );
};

const createFrameworkRiskLink = async (
  frameworks: number[],
  riskId: number,
  tenant: string,
  transaction: Transaction
): Promise<void> => {
  const frameworkReplacements: { [key: string]: number }[] = []
  const placeholders = frameworks.map((_, index) => {
    frameworkReplacements.push({ [`frameworkId_${index}`]: frameworks![index] });
    return `(:frameworkId_${index}, :riskId)`;
  }).join(", ");
  const replacements: any = { riskId: riskId, ...Object.assign({}, ...frameworkReplacements) };
  await sequelize.query(
    `INSERT INTO "${tenant}".frameworks_risks (framework_id, risk_id) VALUES ${placeholders}`,
    {
      replacements,
      transaction,
    }
  );
};

export const createRiskQuery = async (
  projectRisk: Partial<RiskModel & { projects: number[], frameworks: number[] }>,
  tenant: string,
  transaction: Transaction
): Promise<RiskModel> => {
  const result = await sequelize.query(
    `INSERT INTO "${tenant}".risks (
      risk_name, risk_owner, ai_lifecycle_phase, risk_description,
      risk_category, impact, assessment_mapping, controls_mapping, likelihood,
      severity, risk_level_autocalculated, review_notes, mitigation_status,
      current_risk_level, deadline, mitigation_plan, implementation_strategy,
      mitigation_evidence_document, likelihood_mitigation, risk_severity,
      final_risk_level, risk_approval, approval_status, date_of_assessment
    ) VALUES (
      :risk_name, :risk_owner, :ai_lifecycle_phase, :risk_description,
      ARRAY[:risk_category], :impact, :assessment_mapping, :controls_mapping, :likelihood,
      :severity, :risk_level_autocalculated, :review_notes, :mitigation_status,
      :current_risk_level, :deadline, :mitigation_plan, :implementation_strategy,
      :mitigation_evidence_document, :likelihood_mitigation, :risk_severity,
      :final_risk_level, :risk_approval, :approval_status, :date_of_assessment
    ) RETURNING *`,
    {
      replacements: {
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
      model: RiskModel,
      // type: QueryTypes.INSERT
      transaction,
    }
  );

  if (projectRisk.projects && projectRisk.projects.length > 0) {
    await createProjectRiskLink(projectRisk.projects, result[0].id!, tenant, transaction);
  }

  if (projectRisk.frameworks && projectRisk.frameworks.length > 0) {
    await createFrameworkRiskLink(projectRisk.frameworks, result[0].id!, tenant, transaction);
  }
  return result[0];
};

export const updateRiskByIdQuery = async (
  id: number,
  projectRisk: Partial<RiskModel & { projects: number[], frameworks: number[], deletedLinkedProject?: boolean, deletedLinkedFrameworks?: boolean }>,
  tenant: string,
  transaction: Transaction
): Promise<RiskModel | null> => {
  const updateProjectRisk: Partial<Record<keyof RiskModel, any>> = {};
  const setClause = [
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
        projectRisk[f as keyof RiskModel] !== undefined &&
        projectRisk[f as keyof RiskModel]
      ) {
        updateProjectRisk[f as keyof RiskModel] =
          projectRisk[f as keyof RiskModel];
        return true;
      }
      return false;
    })
    .map((f) => {
      if (f === "risk_category") {
        return `${f} = ARRAY[:${f}]`;
      }
      return `${f} = :${f}`;
    });

  let query = `UPDATE "${tenant}".risks SET ${setClause.join(", ")} WHERE id = :id RETURNING *;`;
  if (setClause.length === 0) {
    query = `SELECT * FROM "${tenant}".risks WHERE id = :id;`;
  }

  updateProjectRisk.id = id;

  const result = await sequelize.query(query, {
    replacements: updateProjectRisk,
    mapToModel: true,
    model: RiskModel,
    // type: QueryTypes.UPDATE,
    transaction,
  });

  // Handle project links - delete if explicitly flagged as deleted or if new projects are provided
  if ((projectRisk.projects && projectRisk.projects.length > 0) || projectRisk.deletedLinkedProject) {
    // First, get the current projects linked to this risk to identify deleted ones
    const currentProjectsResult = await sequelize.query(
      `SELECT project_id FROM "${tenant}".projects_risks WHERE risk_id = :riskId`,
      {
        replacements: { riskId: id },
        transaction,
      }
    ) as [{ project_id: number }[], number];

    const currentProjectIds = currentProjectsResult[0].map(row => row.project_id);
    const newProjectIds = projectRisk.projects || [];

    // Find projects that are being removed
    const deletedProjectIds = currentProjectIds.filter(projectId => !newProjectIds.includes(projectId));

    // Clean up mitigation mappings for deleted projects
    if (deletedProjectIds.length > 0) {
      const projectFrameworks = await sequelize.query(
        `SELECT * FROM "${tenant}".projects_frameworks WHERE project_id IN (:deletedProjectIds)`,
        {
          replacements: { deletedProjectIds },
          transaction,
        }
      ) as [(IProjectFrameworks & { id: number })[], number];

      for (let pf of projectFrameworks[0]) {
        if (pf.framework_id === 1) {
          await sequelize.query(
            `DELETE FROM "${tenant}".answers_eu__risks WHERE answer_id IN (
              SELECT ae.id FROM "${tenant}".answers_eu ae JOIN "${tenant}".assessments a ON ae.assessment_id = a.id WHERE a.projects_frameworks_id = :pfId
            ) AND projects_risks_id = :riskId`,
            { replacements: { pfId: pf.id, riskId: id }, transaction }
          );

          await sequelize.query(
            `DELETE FROM "${tenant}".controls_eu__risks WHERE control_id IN (
              SELECT sc.id FROM "${tenant}".controls_eu c JOIN "${tenant}".subcontrols_eu sc ON c.id = sc.control_id WHERE c.projects_frameworks_id = :pfId
            ) AND projects_risks_id = :riskId`,
            { replacements: { pfId: pf.id, riskId: id }, transaction }
          );
        }
      }
    }

    // Delete all project-risk links
    await sequelize.query(
      `DELETE FROM "${tenant}".projects_risks WHERE risk_id = :riskId`,
      {
        replacements: { riskId: id },
        transaction,
      }
    );
    // Only create new links if projects array is provided and not empty
    if (projectRisk.projects && projectRisk.projects.length > 0) {
      await createProjectRiskLink(projectRisk.projects, id, tenant, transaction);
    }
  }

  // Handle framework links - delete if explicitly flagged as deleted or if new frameworks are provided
  if ((projectRisk.frameworks && projectRisk.frameworks.length > 0) || projectRisk.deletedLinkedFrameworks) {
    // First, get the current frameworks linked to this risk to identify deleted ones
    const currentFrameworksResult = await sequelize.query(
      `SELECT framework_id FROM "${tenant}".frameworks_risks WHERE risk_id = :riskId`,
      {
        replacements: { riskId: id },
        transaction,
      }
    ) as [{ framework_id: number }[], number];

    const currentFrameworkIds = currentFrameworksResult[0].map(row => row.framework_id);
    const newFrameworkIds = projectRisk.frameworks || [];

    // Find frameworks that are being removed
    const deletedFrameworkIds = currentFrameworkIds.filter(frameworkId => !newFrameworkIds.includes(frameworkId));

    // Clean up mitigation mappings for deleted frameworks (if framework-specific cleanup is needed)
    if (deletedFrameworkIds.length > 0) {
      const projectFrameworks = await sequelize.query(
        `SELECT * FROM "${tenant}".projects_frameworks WHERE framework_id IN (:deletedFrameworkIds)`,
        {
          replacements: { deletedFrameworkIds },
          transaction,
        }
      ) as [(IProjectFrameworks & { id: number })[], number];
      for (let pf of projectFrameworks[0]) {
        if (pf.framework_id === 2) {
          await sequelize.query(
            `DELETE FROM "${tenant}".subclauses_iso__risks WHERE subclause_id IN (
              SELECT sc.id FROM "${tenant}".subclauses_iso sc WHERE sc.projects_frameworks_id = :pfId
            ) AND projects_risks_id = :riskId`,
            { replacements: { pfId: pf.id, riskId: id }, transaction }
          );

          await sequelize.query(
            `DELETE FROM "${tenant}".annexcategories_iso__risks WHERE annexcategory_id IN (
              SELECT ac.id FROM "${tenant}".annexcategories_iso ac WHERE ac.projects_frameworks_id = :pfId
            ) AND projects_risks_id = :riskId`,
            { replacements: { pfId: pf.id, riskId: id }, transaction }
          );
        }

        if (pf.framework_id === 3) {
          await sequelize.query(
            `DELETE FROM "${tenant}".subclauses_iso27001__risks WHERE subclause_id IN (
              SELECT sc.id FROM "${tenant}".subclauses_iso27001 sc WHERE sc.projects_frameworks_id = :pfId
            ) AND projects_risks_id = :riskId`,
            { replacements: { pfId: pf.id, riskId: id }, transaction }
          );

          await sequelize.query(
            `DELETE FROM "${tenant}".annexcontrols_iso27001__risks WHERE annexcontrol_id IN (
              SELECT ac.id FROM "${tenant}".annexcontrols_iso27001 ac WHERE ac.projects_frameworks_id = :pfId
            ) AND projects_risks_id = :riskId`,
            { replacements: { pfId: pf.id, riskId: id }, transaction }
          );
        }
      }
    }

    // Delete all framework-risk links
    await sequelize.query(
      `DELETE FROM "${tenant}".frameworks_risks WHERE risk_id = :riskId`,
      {
        replacements: { riskId: id },
        transaction,
      }
    );
    // Only create new links if frameworks array is provided and not empty
    if (projectRisk.frameworks && projectRisk.frameworks.length > 0) {
      await createFrameworkRiskLink(projectRisk.frameworks, id, tenant, transaction);
    }
  }
  return result[0];
};

export const deleteRiskByIdQuery = async (
  id: number,
  tenant: string,
  transaction: Transaction
): Promise<Boolean> => {
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".risks WHERE id = :id RETURNING *`,
    {
      replacements: { id },
      mapToModel: true,
      model: RiskModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0;
};
