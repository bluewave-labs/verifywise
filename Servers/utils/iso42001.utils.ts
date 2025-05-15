import { QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { ClauseStructISOModel } from "../models/ISO-42001/clauseStructISO.model";
import { SubClauseStructISOModel } from "../models/ISO-42001/subClauseStructISO.model";
import { SubClauseISO, SubClauseISOModel } from "../models/ISO-42001/subClauseISO.model";
import { AnnexStructISOModel } from "../models/ISO-42001/annexStructISO.model";
import { AnnexCategoryISO, AnnexCategoryISOModel } from "../models/ISO-42001/annexCategoryISO.model";
import { AnnexCategoryStructISOModel } from "../models/ISO-42001/annexCategoryStructISO.model";
import { AnnexCategoryISORisksModel } from "../models/ISO-42001/annexCategoryISORIsks.model";
import { ProjectFrameworksModel } from "../models/projectFrameworks.model";

export const getAllClausesQuery = async (transaction: Transaction | null = null) => {
  const clauses = await sequelize.query(
    `SELECT * FROM clauses_struct_iso ORDER BY id;`,
    {
      mapToModel: true,
      model: ClauseStructISOModel,
      ...(transaction ? { transaction } : {})
    })
  return clauses;
}

export const getClauseById = async (clauseId: number, transaction: Transaction | null = null) => {
  const clause = await sequelize.query(
    `SELECT * FROM clauses_struct_iso WHERE id = :id;`,
    {
      replacements: { id: clauseId },
      mapToModel: true,
      model: ClauseStructISOModel,
      ...(transaction ? { transaction } : {})
    })
  return clause[0];
}

export const getSubClausesByClauseIdQuery = async (clauseId: number, transaction: Transaction | null = null) => {
  const subClauses = await sequelize.query(
    `SELECT * FROM subclauses_struct_iso WHERE clause_id = :id ORDER BY id;`,
    {
      replacements: { id: clauseId },
      mapToModel: true,
      model: SubClauseISOModel,
      ...(transaction ? { transaction } : {})
    })
  return subClauses;
}

export const getSubClauseByIdForProjectQuery = async (subClauseId: number, projectFrameworkId: number) => {
  const _subClauseId = await sequelize.query(
    `SELECT id FROM subclauses_iso WHERE subclause_meta_id = :id AND projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: { id: subClauseId, projects_frameworks_id: projectFrameworkId },
    }) as [{ id: number }[], number];
  const subClauses = await getSubClauseByIdQuery(_subClauseId[0][0].id);
  return subClauses;
}

export const getSubClauseByIdQuery = async (subClauseId: number, transaction: Transaction | null = null) => {
  const subClauses = await sequelize.query(
    `SELECT
      scs.title AS title,
      scs.summary AS summary,
      scs.questions AS questions,
      scs.evidence_examples AS evidence_examples,
      scs.clause_id AS clause_id,
      sc.id AS id,
      sc.implementation_description AS implementation_description,
      sc.evidence_links AS evidence_links,
      sc.status AS status,
      sc.owner AS owner,
      sc.reviewer AS reviewer,
      sc.approver AS approver,
      sc.due_date AS due_date,
      sc.auditor_feedback AS auditor_feedback,
      sc.created_at AS created_at
    FROM subclauses_struct_iso scs JOIN subclauses_iso sc ON scs.id = sc.subclause_meta_id
    WHERE sc.id = :id ORDER BY created_at DESC, id ASC;`,
    {
      replacements: { id: subClauseId },
      ...(transaction ? { transaction } : {}),
    }) as [Partial<SubClauseStructISOModel & SubClauseISOModel>[], number]
  return subClauses[0][0];
}

export const getClausesByProjectIdQuery = async (projectFrameworkId: number) => {
  const subClauseIds = await sequelize.query(
    `SELECT id FROM subclauses_iso WHERE projects_frameworks_id = :projects_frameworks_id ORDER BY id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }) as [{ id: number }[], number];
  const msc = await getManagementSystemClausesQuery(subClauseIds[0].map((subClause) => subClause.id));
  return msc;
}

export const getManagementSystemClausesQuery = async (
  subClauseIds: number[],
  transaction: Transaction | null = null
) => {
  const clausesStruct = await getAllClausesQuery(transaction) as (ClauseStructISOModel & Partial<SubClauseStructISOModel & SubClauseISOModel>[])[]; // wrong type
  let clausesStructMap = new Map();
  for (let [i, clauseStruct] of clausesStruct.entries()) {
    (clauseStruct.dataValues as any).subClauses = [];
    clausesStructMap.set(clauseStruct.id, i);
  }
  for (let subClauseId of subClauseIds) {
    const subClause = await getSubClauseByIdQuery(subClauseId, transaction);
    (clausesStruct as any)[clausesStructMap.get(subClause.clause_id!)].dataValues.subClauses.push(subClause)
  }
  return clausesStruct;
}

export const getAllAnnexesQuery = async (transaction: Transaction | null = null) => {
  const annexes = await sequelize.query(
    `SELECT * FROM annex_struct_iso ORDER BY id;`,
    {
      mapToModel: true,
      model: AnnexStructISOModel,
      ...(transaction ? { transaction } : {})
    })
  return annexes;
}

export const getAnnexByIdQuery = async (annexId: number, transaction: Transaction | null = null) => {
  const annex = await sequelize.query(
    `SELECT * FROM annex_struct_iso WHERE id = :id;`,
    {
      replacements: { id: annexId },
      mapToModel: true,
      model: AnnexStructISOModel,
      ...(transaction ? { transaction } : {})
    })
  return annex[0];
}

export const getAnnexCategoriesByAnnexIdQuery = async (annexId: number, transaction: Transaction | null = null) => {
  const annexCategories = await sequelize.query(
    `SELECT * FROM annexcategories_struct_iso WHERE annex_id = :id ORDER BY id;`,
    {
      replacements: { id: annexId },
      mapToModel: true,
      model: AnnexCategoryStructISOModel,
      ...(transaction ? { transaction } : {})
    })
  return annexCategories;
}

export const getAnnexCategoryByIdForProjectQuery = async (annexCategoryId: number, projectFrameworkId: number) => {
  const _annexCategoryId = await sequelize.query(
    `SELECT id FROM annexcategories_iso WHERE annexcategory_meta_id = :id AND projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: { id: annexCategoryId, projects_frameworks_id: projectFrameworkId },
    }) as [{ id: number }[], number];
  const annexCategories = await getAnnexCategoriesByIdQuery(_annexCategoryId[0][0].id);
  return annexCategories;
}

export const getAnnexCategoriesByIdQuery = async (annexId: number, transaction: Transaction | null = null) => {
  const annexCategories = await sequelize.query(
    `SELECT
      acs.title AS title,
      acs.description AS description,
      acs.guidance AS guidance,
      acs.annex_id AS annex_id,
      ac.id AS id,
      ac.is_applicable AS is_applicable,
      ac.justification_for_exclusion AS justification_for_exclusion,
      ac.implementation_description AS implementation_description,
      ac.evidence_links AS evidence_links,
      ac.status AS status,
      ac.owner AS owner,
      ac.reviewer AS reviewer,
      ac.approver AS approver,
      ac.due_date AS due_date,
      ac.auditor_feedback AS auditor_feedback,
      ac.created_at AS created_at
    FROM annexcategories_struct_iso acs JOIN annexcategories_iso ac ON acs.id = ac.annexcategory_meta_id
    WHERE ac.id = :id ORDER BY created_at DESC, id ASC;`,
    {
      replacements: { id: annexId },
      ...(transaction ? { transaction } : {}),
    }) as [Partial<AnnexCategoryStructISOModel & AnnexCategoryISOModel>[], number]
  return annexCategories[0][0];
}

export const getAnnexesByProjectIdQuery = async (projectFrameworkId: number) => {
  const annexCategoryIds = await sequelize.query(
    `SELECT id FROM annexcategories_iso WHERE projects_frameworks_id = :projects_frameworks_id ORDER BY id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }) as [{ id: number }[], number];
  const rc = await getReferenceControlsQuery(annexCategoryIds[0].map((annexCategory) => annexCategory.id));
  return rc;
}

export const getReferenceControlsQuery = async (
  annexCategoryIds: number[],
  transaction: Transaction | null = null
) => {
  const annexesStruct = await getAllAnnexesQuery(transaction) as (AnnexStructISOModel & Partial<AnnexCategoryISOModel & AnnexCategoryStructISOModel>[])[]; // wrong type
  let annexStructMap = new Map();
  for (let [i, annexStruct] of annexesStruct.entries()) {
    (annexStruct.dataValues as any).subClauses = [];
    annexStructMap.set(annexStruct.id, i);
  }
  for (let annexCategoryId of annexCategoryIds) {
    const annex = await getAnnexCategoriesByIdQuery(annexCategoryId, transaction);
    (annexesStruct as any)[annexStructMap.get(annex.annex_id!)].dataValues.subClauses.push(annex)
  }
  return annexesStruct;
}

export const createNewClausesQuery = async (
  projectId: number,
  enable_ai_data_insertion: boolean,
  transaction: Transaction
) => {
  const projectFrameworkId = await sequelize.query(
    `SELECT id FROM projects_frameworks WHERE project_id = :project_id AND framework_id = 2`,
    {
      replacements: { project_id: projectId }, transaction
    }
  ) as [{ id: number }[], number];
  const subClauses = await sequelize.query(
    `SELECT id FROM subclauses_struct_iso ORDER BY id;`, { transaction }
  ) as [{ id: number }[], number];
  const subClauseIds = await createNewSubClausesQuery(
    subClauses[0].map((subClause) => subClause.id), projectFrameworkId[0][0].id, transaction
  );
  const clauses = await getManagementSystemClausesQuery(subClauseIds, transaction);
  return clauses;
}

export const createNewSubClausesQuery = async (
  subClauses: number[],
  projectFrameworkId: number,
  transaction: Transaction
) => {
  const subClauseIds = []
  for (let _subClauseId of subClauses) {
    const subClauseId = await sequelize.query(
      `INSERT INTO subclauses_iso (
        subclause_meta_id, projects_frameworks_id
      ) VALUES (
        :subclause_meta_id, :projects_frameworks_id
      ) RETURNING id;`,
      {
        replacements: {
          subclause_meta_id: _subClauseId,
          projects_frameworks_id: projectFrameworkId
        },
        transaction
      }
    ) as [{ id: number }[], number];
    subClauseIds.push(subClauseId[0][0].id);
  }
  return subClauseIds;
}

export const createNewAnnexesQUery = async (
  projectId: number,
  enable_ai_data_insertion: boolean,
  transaction: Transaction
) => {
  const projectFrameworkId = await sequelize.query(
    `SELECT id FROM projects_frameworks WHERE project_id = :project_id AND framework_id = 2`,
    {
      replacements: { project_id: projectId }, transaction
    }
  ) as [{ id: number }[], number];
  const annexCategories = await sequelize.query(
    `SELECT id FROM annexcategories_struct_iso ORDER BY id;`, { transaction }
  ) as [{ id: number }[], number];
  const annexCategoryIds = await createNewAnnexeCategoriesQuery(
    annexCategories[0].map((annexCategory) => annexCategory.id), projectFrameworkId[0][0].id, transaction
  );
  const annexes = await getReferenceControlsQuery(annexCategoryIds, transaction);
  return annexes;
}

export const createNewAnnexeCategoriesQuery = async (
  annexCategories: number[],
  projectFrameworkId: number,
  transaction: Transaction
) => {
  const annexCategoryIds = []
  for (let _annexCategoryId of annexCategories) {
    const annexCategoryId = await sequelize.query(
      `INSERT INTO annexcategories_iso (
        annexcategory_meta_id, projects_frameworks_id
      ) VALUES (
        :annexcategory_meta_id, :projects_frameworks_id
      ) RETURNING id;`,
      {
        replacements: {
          annexcategory_meta_id: _annexCategoryId,
          projects_frameworks_id: projectFrameworkId
        },
        transaction
      }
    ) as [{ id: number }[], number];
    annexCategoryIds.push(annexCategoryId[0][0].id);
  }
  return annexCategoryIds;
}

export const createISOFrameworkQuery = async (
  projectId: number,
  enable_ai_data_insertion: boolean,
  transaction: Transaction
) => {
  const management_system_clauses = await createNewClausesQuery(
    projectId,
    enable_ai_data_insertion,
    transaction
  );
  const reference_controls = await createNewAnnexesQUery(
    projectId, enable_ai_data_insertion, transaction
  );
  return {
    management_system_clauses,
    reference_controls
  }
}

export const updateSubClauseQuery = async (
  id: number,
  subClause: Partial<SubClauseISOModel>,
  uploadedFiles: { id: string; fileName: string, project_id: number, uploaded_by: number, uploaded_time: Date }[] = [],
  deletedFiles: number[] = [],
  transaction: Transaction
) => {
  const files = await sequelize.query(
    `SELECT evidence_links FROM subclauses_iso WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: SubClauseISOModel,
      transaction
    }
  );

  let currentFiles = (files[0].evidence_links ? files[0].evidence_links : []) as {
    id: string; fileName: string; project_id: number; uploaded_by: number; uploaded_time: Date;
  }[]

  currentFiles = currentFiles.filter(f => !deletedFiles.includes(parseInt(f.id)));
  currentFiles = currentFiles.concat(uploadedFiles);

  const updateSubClause: Partial<Record<keyof SubClauseISO, any>> = { id };
  const setClause = [
    "implementation_description",
    "evidence_links",
    "status",
    "owner",
    "reviewer",
    "approver",
    "due_date",
    "auditor_feedback",
  ].reduce((acc: string[], field) => {
    if (field === "evidence_links" && currentFiles.length) {
      updateSubClause["evidence_links"] = JSON.stringify(currentFiles);
      acc.push(`${field} = :${field}`);
    } else if (subClause[field as keyof SubClauseISO] != undefined && subClause[field as keyof SubClauseISO]) {
      updateSubClause[field as keyof SubClauseISO] = subClause[field as keyof SubClauseISO];
      acc.push(`${field} = :${field}`);
    }
    return acc;
  }, []).join(", ");

  if (setClause.length === 0) {
    return subClause as SubClauseISO;
  }

  const query = `UPDATE subclauses_iso SET ${setClause} WHERE id = :id RETURNING *;`;

  updateSubClause.id = id;

  const result = await sequelize.query(query, {
    replacements: updateSubClause,
    mapToModel: true,
    model: SubClauseISOModel,
    // type: QueryTypes.UPDATE,
    transaction
  });

  return result[0];
}

export const updateAnnexCategoryQuery = async (
  id: number,
  annexCategory: Partial<AnnexCategoryISO & { risksDelete: string, risksMitigated: string }>,
  uploadedFiles: { id: string; fileName: string, project_id: number, uploaded_by: number, uploaded_time: Date }[] = [],
  deletedFiles: number[] = [],
  transaction: Transaction
) => {
  const files = await sequelize.query(
    `SELECT evidence_links FROM annexcategories_iso WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: AnnexCategoryISOModel,
      transaction
    }
  );

  let currentFiles = (files[0].evidence_links ? files[0].evidence_links : []) as {
    id: string; fileName: string; project_id: number; uploaded_by: number; uploaded_time: Date;
  }[]

  currentFiles = currentFiles.filter(f => !deletedFiles.includes(parseInt(f.id)));
  currentFiles = currentFiles.concat(uploadedFiles);

  const updateAnnexCategory: Partial<Record<keyof AnnexCategoryISO, any>> = {};
  const setClause = [
    "is_applicable",
    "justification_for_exclusion",
    "implementation_description",
    "evidence_links",
    "status",
    "owner",
    "reviewer",
    "approver",
    "due_date",
    "auditor_feedback",
  ].reduce((acc: string[], field) => {
    if (field === "evidence_links" && currentFiles.length) {
      updateAnnexCategory["evidence_links"] = JSON.stringify(currentFiles);
      acc.push(`${field} = :${field}`);
    } else if (annexCategory[field as keyof AnnexCategoryISO] != undefined && annexCategory[field as keyof AnnexCategoryISO]) {
      updateAnnexCategory[field as keyof AnnexCategoryISO] = annexCategory[field as keyof AnnexCategoryISO];
      acc.push(`${field} = :${field}`);
    }
    return acc;
  }, []).join(", ");

  if (setClause.length === 0) {
    return annexCategory as AnnexCategoryISO;
  }

  const query = `UPDATE annexcategories_iso SET ${setClause} WHERE id = :id RETURNING *;`;

  updateAnnexCategory.id = id;

  const result = await sequelize.query(query, {
    replacements: updateAnnexCategory,
    // type: QueryTypes.UPDATE,
    transaction
  }) as [AnnexCategoryISOModel[], number];
  const annexCategoryResult = result[0][0];
  (annexCategoryResult as any).risks = [];

  // update the risks
  const risksDeleted = JSON.parse(annexCategory.risksDelete || "[]") as number[];
  const risksMitigated = JSON.parse(annexCategory.risksMitigated || "[]") as number[];
  const risks = await sequelize.query(
    `SELECT projects_risks_id FROM annexcategories_iso__risks WHERE annexcategory_id = :id`,
    {
      replacements: { id },
      transaction
    }
  ) as [AnnexCategoryISORisksModel[], number];
  let currentRisks = risks[0].map(r => r.project_risk_id!);
  currentRisks = currentRisks.filter(r => !risksDeleted.includes(r));
  currentRisks = currentRisks.concat(risksMitigated);

  await sequelize.query(
    `DELETE FROM annexcategories_iso__risks WHERE annexcategory_id = :id;`,
    {
      replacements: { id },
      transaction
    }
  );
  const annexCategoryRisksInsert = currentRisks.map(risk => `(${id}, ${risk})`).join(", ");
  if (annexCategoryRisksInsert) {
    const annexCategoryRisksInsertResult = await sequelize.query(
      `INSERT INTO annexcategories_iso__risks (annexcategory_id, projects_risks_id) VALUES ${annexCategoryRisksInsert} RETURNING projects_risks_id;`,
      {
        transaction
      }
    ) as [{ projects_risks_id: number }[], number];
    for (let risk of annexCategoryRisksInsertResult[0]) {
      (annexCategoryResult as any).risks.push(risk.projects_risks_id);
    }
  }

  return annexCategoryResult;
}

export const deleteSubClausesISOByProjectIdQuery = async (
  projectFrameworkId: number,
  transaction: Transaction
) => {
  const result = await sequelize.query(
    `DELETE FROM subclauses_iso WHERE projects_frameworks_id = :projects_frameworks_id RETURNING *`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      mapToModel: true,
      model: SubClauseISOModel,
      type: QueryTypes.DELETE,
      transaction
    }
  )
  return result.length > 0;
}

export const deleteAnnexCategoriesISOByProjectIdQuery = async (
  projectFrameworkId: number,
  transaction: Transaction
) => {
  const result = await sequelize.query(
    `DELETE FROM annexcategories_iso WHERE projects_frameworks_id = :projects_frameworks_id RETURNING *`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      mapToModel: true,
      model: AnnexCategoryISOModel,
      type: QueryTypes.DELETE,
      transaction
    }
  )
  return result.length > 0;
}

export const deleteProjectFrameworkISOQuery = async (
  projectId: number,
  transaction: Transaction
) => {
  const projectFrameworkId = await sequelize.query(
    `SELECT id FROM projects_frameworks WHERE project_id = :project_id AND framework_id = 2`,
    {
      replacements: { project_id: projectId }, transaction
    }
  ) as [{ id: number }[], number];
  const subClausesDeleted = await deleteSubClausesISOByProjectIdQuery(projectFrameworkId[0][0].id, transaction);
  const annexeCategoriesDeleted = await deleteAnnexCategoriesISOByProjectIdQuery(projectFrameworkId[0][0].id, transaction);
  const result = await sequelize.query(
    `DELETE FROM projects_frameworks WHERE project_id = :project_id AND framework_id = 2 RETURNING *`,
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: ProjectFrameworksModel,
      type: QueryTypes.DELETE,
      transaction
    }
  )
  return result.length > 0 && subClausesDeleted && annexeCategoriesDeleted;
}
