import { sequelize } from "../database/db";
import {
  ProjectsMembers,
  ProjectsMembersModel,
} from "../models/projectsMembers.model";
import { FileModel } from "../models/file.model";
import { QueryTypes, Transaction } from "sequelize";
import { getAllTopicsQuery, getAllSubTopicsQuery, getAllQuestionsQuery, getControlStructByControlCategoryIdForAProjectQuery, getAllControlCategoriesQuery, getControlByIdForProjectQuery, getControlByIdQuery, getSubControlsByIdQuery } from "./eu.utils";
import { TopicStructEUModel } from "../models/EU/topicStructEU.model";
import { AnnexStructISOModel } from "../models/ISO-42001/annexStructISO.model";
import { ClauseStructISOModel } from "../models/ISO-42001/clauseStructISO.model";
import { AnnexCategoryStructISOModel } from "../models/ISO-42001/annexCategoryStructISO.model";
import { AnnexCategoryISOModel } from "../models/ISO-42001/annexCategoryISO.model";
import { ControlEUModel } from "../models/EU/controlEU.model";
import { ControlStructEUModel } from "../models/EU/controlStructEU.model";


/**
 * Retrieves all project risk data from the `projectrisks` table,
 * including the risk owner's name and surname from the `users` table.
 *
 * @param projectId - The ID of the project
 * @returns projectRisks[] with risk_owner's name and surname
 */
export const getProjectRisksReportQuery = async (
  projectId: number
) => {
  const query = `
    SELECT 
      risk.*,       
      u.name AS risk_owner_name,
      u.surname AS risk_owner_surname
    FROM projectrisks risk
    LEFT JOIN users u ON risk.risk_owner = u.id
    WHERE project_id = :project_id 
    ORDER BY created_at DESC, id ASC
  `;
  const projectRisks = await sequelize.query(query, {
    replacements: { project_id: projectId },
    type: QueryTypes.SELECT,
  });
  return projectRisks;
};

export const getMembersByProjectIdQuery = async (
  projectId: number
): Promise<ProjectsMembers[]> => {
  const members = await sequelize.query(
    "SELECT * FROM projects_members WHERE project_id = :project_id",
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: ProjectsMembersModel,
    }
  );
  return members;
};

export const getGeneratedReportsQuery = async () => {
  const validSources = [
    "Project risks report",
    "Compliance tracker report",
    "Assessment tracker report",
    "Vendors and risks report",
    "All reports",
  ];
  const query = `
    SELECT 
      report.id, 
      report.filename, 
      report.project_id,  
      report.uploaded_time,
      report.source, 
      p.project_title AS project_title,
      u.name AS uploader_name,
      u.surname AS uploader_surname
    FROM files report
    JOIN projects p ON report.project_id = p.id
    JOIN users u ON report.uploaded_by = u.id
    WHERE report.source IN (:sources)
    ORDER BY uploaded_time DESC, report.id ASC
  `;
  const reports = await sequelize.query(query, {
    replacements: { sources: validSources },
    type: QueryTypes.SELECT,
  });
  return reports;
};

export const deleteReportByIdQuery = async (
  id: number,
  transaction: Transaction
) => {
  const result = await sequelize.query(
    "DELETE FROM files WHERE id = :id RETURNING *",
    {
      replacements: { id },
      mapToModel: true,
      model: FileModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );

  return result.length > 0;
};

export const getReportByIdQuery = async (id: number) => {
  const result = await sequelize.query(`SELECT * FROM files WHERE id = :id`, {
    replacements: { id },
    mapToModel: true,
    model: FileModel,
  });
  return result[0];
};

export const getAssessmentReportQuery = async (
  projectId: number,
  frameworkId: number,
) => {
  const projectFrameworkIdQuery = await sequelize.query(
    `SELECT id FROM projects_frameworks WHERE project_id = :project_id AND framework_id = :framework_id`,
    {
      replacements: { project_id: projectId, framework_id: frameworkId }
    }
  ) as [{ id: number }[], number];
  const projectFrameworkId = projectFrameworkIdQuery[0][0]?.id;
  if (!projectFrameworkId) {
    throw new Error("Project framework id not found");
  }
  const assessmentId = await sequelize.query(
    `SELECT id FROM assessments WHERE projects_frameworks_id = :projects_frameworks_id`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId }
    }
  ) as [{ id: number }[], number];

  const allTopics: TopicStructEUModel[] = await getAllTopicsQuery();
  await Promise.all(
    allTopics.map(async (topic) => {
      if (topic.id) {
        const subtopicStruct = await getAllSubTopicsQuery(topic.id);
        await Promise.all(
          subtopicStruct.map(async (subtopic) => {
            if (subtopic.id && assessmentId.length > 0) {
              const questionAnswers = await getAllQuestionsQuery(subtopic.id!, assessmentId[0][0].id);
              (subtopic.dataValues as any).questions = questionAnswers.map(q => ({ ...q }));
            }
          }));
        (topic.dataValues as any).subtopics = subtopicStruct.map(s => s.get({ plain: true }));
      }
    }))
  const allAssessments = allTopics.map((topic) => topic.get({ plain: true }));
  return allAssessments;
}

export const getAnnexesReportQuery =async (
  projectFrameworkId: number,
  transaction: Transaction | null = null
  ) => {    
    const annexes = await sequelize.query(
      `SELECT * FROM annex_struct_iso ORDER BY id;`,
      {
        mapToModel: true,
        ...(transaction ? { transaction } : {})
      }) as [AnnexStructISOModel[], number];
    
    for (const annex of annexes[0]) {
      const annexCategories = await annexCategoriesQuery(projectFrameworkId, annex.id, transaction);
      (annex as any).annexCategories = annexCategories;
    }
    return annexes[0];
}

export const annexCategoriesQuery =async (
  projectFrameworkId: number,
  annexId: number,
  transaction: Transaction | null = null
  ) => {
    const annexCategories = await sequelize.query(
      `SELECT acs.id, acs.title, acs.description, acs.order_no, ac.status, ac.is_applicable, ac.justification_for_exclusion, ac.implementation_description 
       FROM annexcategories_struct_iso acs 
       JOIN annexcategories_iso ac ON acs.id = ac.annexcategory_meta_id 
       WHERE acs.annex_id = :id AND ac.projects_frameworks_id = :projects_frameworks_id 
       ORDER BY acs.id;`,
       {
        replacements: {
          id: annexId,
          projects_frameworks_id: projectFrameworkId,
        },
        type: QueryTypes.SELECT,
        ...(transaction ? { transaction } : {})
      });
    
    return annexCategories;
}

export const getComplianceReportQuery = async (
  projectFrameworkId: number
) => {
  const compliances = await getAllControlCategoriesQuery();
  for(let controlCategory of compliances){
    if(controlCategory.id && controlCategory.framework_id){
      const subCategorieStructs = await getControlStructByControlCategoryIdForAProjectQuery(controlCategory.id, controlCategory.framework_id);                              
      for(const subControlCategory of subCategorieStructs) {
        if (subControlCategory.id) {
          const controls = await getControlByIdQuery(subControlCategory.id);
          if (controls && controls.length > 0) {
            const control = controls[0];
            const subControls = await getSubControlsByIdQuery(control.id!);
            (control as any).subControls = [];
            for (let subControl of subControls) {
              (control as any).subControls.push({ ...subControl });
            }
            (subControlCategory as any).data = {};
            (subControlCategory as any).data= control;
          }
        }
      }      
      (controlCategory.dataValues as any).subControlCategories = subCategorieStructs || []; 
    }
  }

  const AllCompliances = compliances.map((topic) => topic.get({ plain: true }));
  return AllCompliances;
}

export const getClausesReportQuery = async (
  projectFrameworkId: number,
  transaction: Transaction | null = null
) => {
  const clauses = (await sequelize.query(
    `SELECT * FROM clauses_struct_iso ORDER BY id;`,
    {
      mapToModel: true,
      ...(transaction ? { transaction } : {}),
    }
  )) as [ClauseStructISOModel[], number];

  for (const clause of clauses[0]) {
    const subClauses = await subClausesQuery(projectFrameworkId, clause.id, transaction);
    (clause as any).subClauses = subClauses;
  }
  return clauses[0];
};

export const subClausesQuery = async (
  projectFrameworkId: number,
  clauseId: number,
  transaction: Transaction | null = null
) => {
  
  return await sequelize.query(
    `SELECT scs.id, scs.title, scs.order_no, scs.summary, sc.status, sc.implementation_description
     FROM subclauses_struct_iso scs
     JOIN subclauses_iso sc ON scs.id = sc.subclause_meta_id 
     WHERE scs.clause_id = :clause_id AND sc.projects_frameworks_id = :projects_frameworks_id
     ORDER BY scs.id;`,
    {
      replacements: {
        clause_id: clauseId,
        projects_frameworks_id: projectFrameworkId + 1,
      },
      type: QueryTypes.SELECT,
      ...(transaction ? { transaction } : {})
    }
  );
}