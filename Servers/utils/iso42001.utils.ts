import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { ClauseStructISOModel } from "../models/ISO-42001/clauseStructISO.model";
import { SubClauseStructISOModel } from "../models/ISO-42001/subClauseStructISO.model";
import { SubClauseISOModel } from "../models/ISO-42001/subClauseISO.model";
import { AnnexStructISOModel } from "../models/ISO-42001/annexStructISO.model";
import { AnnexCategoryISOModel } from "../models/ISO-42001/annexCategoryISO.model";
import { AnnexCategoryStructISOModel } from "../models/ISO-42001/annexCategoryStructISO.model";

export const getAllClausesQuery = async (transaction: Transaction) => {
  const clauses = await sequelize.query(
    `SELECT * FROM clauses_struct_iso ORDER BY id;`,
    {
      mapToModel: true,
      model: ClauseStructISOModel,
      transaction
    })
  return clauses;
}

export const getSubClauseByIdQuery = async (subClauseId: number, transaction: Transaction) => {
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
      sc.created_at AS created_at,
    FROM subclauses_struct_iso scs JOIN subclauses_iso sc ON scs.id = sc.subclause_meta_id
    WHERE sc.id = :id ORDER BY created_at DESC, id ASC;`,
    {
      replacements: { id: subClauseId },
      transaction
    }) as [Partial<SubClauseStructISOModel & SubClauseISOModel>[], number]
  return subClauses[0][0];
}

export const getManagementSystemClausesQuery = async (
  subClauseIds: number[],
  transaction: Transaction
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

export const getAllAnnexesQuery = async (transaction: Transaction) => {
  const annexes = await sequelize.query(
    `SELECT * FROM annex_struct_iso ORDER BY id;`,
    {
      mapToModel: true,
      model: AnnexStructISOModel,
      transaction
    })
  return annexes;
}

export const getAnnexCategoriesByIdQuery = async (annexId: number, transaction: Transaction) => {
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
      ac.created_at AS created_at,
    FROM annexcategories_struct_iso acs JOIN annexcategories_iso ac ON acs.id = ac.category_meta_id
    WHERE ac.id = :id ORDER BY created_at DESC, id ASC;`,
    {
      replacements: { id: annexId },
      transaction
    }) as [Partial<AnnexCategoryStructISOModel & AnnexCategoryISOModel>[], number]
  return annexCategories[0][0];
}

export const getReferenceControlsQuery = async (
  annexCategoryIds: number[],
  transaction: Transaction
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
      `INSERT INTO clauses_struct_iso (
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
        category_meta_id, projects_frameworks_id
      ) VALUES (
        :category_meta_id, :projects_frameworks_id
      ) RETURNING id;`,
      {
        replacements: {
          category_meta_id: _annexCategoryId,
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