import { QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { ClauseStructISOModel } from "../domain.layer/frameworks/ISO-42001/clauseStructISO.model";
import { SubClauseStructISOModel } from "../domain.layer/frameworks/ISO-42001/subClauseStructISO.model";
import {
  SubClauseISO,
  SubClauseISOModel,
} from "../domain.layer/frameworks/ISO-42001/subClauseISO.model";
import { AnnexStructISOModel } from "../domain.layer/frameworks/ISO-42001/annexStructISO.model";
import {
  AnnexCategoryISO,
  AnnexCategoryISOModel,
} from "../domain.layer/frameworks/ISO-42001/annexCategoryISO.model";
import { AnnexCategoryStructISOModel } from "../domain.layer/frameworks/ISO-42001/annexCategoryStructISO.model";
import { AnnexCategoryISORisksModel } from "../domain.layer/frameworks/ISO-42001/annexCategoryISORIsks.model";
import { ProjectFrameworksModel } from "../domain.layer/models/projectFrameworks/projectFrameworks.model";
import { Clauses } from "../structures/ISO-42001/clauses/clauses.struct";
import { Annex } from "../structures/ISO-42001/annex/annex.struct";
import { STATUSES } from "../types/status.type";

const getDemoSubClauses = (): Object[] => {
  const subClauses = [];
  for (let clause of Clauses) {
    for (let subClause of clause.subclauses) {
      subClauses.push({
        implementation_description: subClause.implementation_description || "",
        auditor_feedback: subClause.auditor_feedback || "",
      });
    }
  }
  return subClauses;
};

const getDemoAnnexCategories = (): Object[] => {
  const annexCategories = [];
  for (let annex of Annex) {
    for (let annexCategory of annex.annexcategories) {
      annexCategories.push({
        is_applicable: annexCategory.is_applicable,
        justification_for_exclusion:
          annexCategory.justification_for_exclusion || "",
        implementation_description:
          annexCategory.implementation_description || "",
        auditor_feedback: annexCategory.auditor_feedback || "",
      });
    }
  }
  return annexCategories;
};

export const countSubClausesISOByProjectId = async (
  projectFrameworkId: number
): Promise<{
  totalSubclauses: string;
  doneSubclauses: string;
}> => {
  const result = (await sequelize.query(
    `SELECT COUNT(*) AS "totalSubclauses", SUM(CASE WHEN status = 'Implemented' THEN 1 ELSE 0 END) AS "doneSubclauses" FROM subclauses_iso WHERE projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }
  )) as [{ totalSubclauses: string; doneSubclauses: string }[], number];
  return result[0][0];
};

export const countAnnexCategoriesISOByProjectId = async (
  projectFrameworkId: number
): Promise<{
  totalAnnexcategories: string;
  doneAnnexcategories: string;
}> => {
  const result = (await sequelize.query(
    `SELECT COUNT(*) AS "totalAnnexcategories", SUM(CASE WHEN status = 'Implemented' THEN 1 ELSE 0 END) AS "doneAnnexcategories" FROM annexcategories_iso WHERE projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }
  )) as [
    { totalAnnexcategories: string; doneAnnexcategories: string }[],
    number
  ];
  return result[0][0];
};

export const getAllClausesQuery = async (
  transaction: Transaction | null = null
) => {
  const clauses = await sequelize.query(
    `SELECT * FROM clauses_struct_iso ORDER BY id;`,
    {
      mapToModel: true,
      model: ClauseStructISOModel,
      ...(transaction ? { transaction } : {}),
    }
  );
  return clauses;
};

export const getAllClausesWithSubClauseQuery = async (
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

  for (let clause of clauses[0]) {
    const subClauses = (await sequelize.query(
      `SELECT scs.id, scs.title, scs.order_no, sc.status FROM subclauses_struct_iso scs JOIN subclauses_iso sc ON scs.id = sc.subclause_meta_id WHERE scs.clause_id = :id AND sc.projects_frameworks_id = :projects_frameworks_id ORDER BY id;`,
      {
        replacements: {
          id: clause.id,
          projects_frameworks_id: projectFrameworkId,
        },
        mapToModel: true,
        ...(transaction ? { transaction } : {}),
      }
    )) as [Partial<SubClauseStructISOModel & SubClauseISOModel>[], number];
    (
      clause as ClauseStructISOModel & {
        subClauses: Partial<SubClauseStructISOModel & SubClauseISOModel>[];
      }
    ).subClauses = subClauses[0];
  }
  return clauses[0];
};

export const getAllAnnexesWithSubAnnexQuery = async (
  projectFrameworkId: number,
  transaction: Transaction | null = null
) => {
  const annexes = (await sequelize.query(
    `SELECT * FROM annex_struct_iso ORDER BY id;`,
    {
      mapToModel: true,
      ...(transaction ? { transaction } : {}),
    }
  )) as [AnnexStructISOModel[], number];

  for (let annex of annexes[0]) {
    const annexCategories = (await sequelize.query(
      `SELECT acs.id, acs.title, acs.description, acs.guidance, acs.sub_id, acs.order_no, acs.annex_id,
              ac.id as instance_id, ac.is_applicable, ac.justification_for_exclusion, ac.implementation_description,
              ac.evidence_links, ac.status, ac.owner, ac.reviewer, ac.approver, ac.due_date, ac.auditor_feedback,
              ac.projects_frameworks_id, ac.created_at, ac.is_demo
         FROM annexcategories_struct_iso acs
         LEFT JOIN annexcategories_iso ac
           ON acs.id = ac.annexcategory_meta_id
          AND ac.projects_frameworks_id = :projects_frameworks_id
        WHERE acs.annex_id = :annex_id
        ORDER BY acs.order_no, acs.id;`,
      {
        replacements: {
          annex_id: annex.id,
          projects_frameworks_id: projectFrameworkId,
        },
        mapToModel: false, // This is a mixed result, not a single model
        ...(transaction ? { transaction } : {}),
      }
    )) as [any[], number];

    (annex as any).annexcategories = annexCategories[0];
  }
  return annexes[0];
};

export const getClauseById = async (
  clauseId: number,
  transaction: Transaction | null = null
) => {
  const clause = await sequelize.query(
    `SELECT * FROM clauses_struct_iso WHERE id = :id;`,
    {
      replacements: { id: clauseId },
      mapToModel: true,
      model: ClauseStructISOModel,
      ...(transaction ? { transaction } : {}),
    }
  );
  return clause[0];
};

export const getSubClausesByClauseIdQuery = async (
  clauseId: number,
  transaction: Transaction | null = null
) => {
  const subClauses = await sequelize.query(
    `SELECT * FROM subclauses_struct_iso WHERE clause_id = :id ORDER BY id;`,
    {
      replacements: { id: clauseId },
      mapToModel: true,
      model: SubClauseISOModel,
      ...(transaction ? { transaction } : {}),
    }
  );
  return subClauses;
};

export const getSubClauseByIdForProjectQuery = async (
  subClauseId: number,
  projectFrameworkId: number
) => {
  const _subClauseId = (await sequelize.query(
    `SELECT id FROM subclauses_iso WHERE subclause_meta_id = :id AND projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: {
        id: subClauseId,
        projects_frameworks_id: projectFrameworkId,
      },
    }
  )) as [{ id: number }[], number];
  const subClauses = await getSubClauseByIdQuery(_subClauseId[0][0].id);
  return subClauses;
};

export const getSubClauseByIdQuery = async (
  subClauseId: number,
  transaction: Transaction | null = null
) => {
  const subClauses = (await sequelize.query(
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
    }
  )) as [Partial<SubClauseStructISOModel & SubClauseISOModel>[], number];
  return subClauses[0][0];
};

export const getClausesByProjectIdQuery = async (
  projectFrameworkId: number
) => {
  const subClauseIds = (await sequelize.query(
    `SELECT id FROM subclauses_iso WHERE projects_frameworks_id = :projects_frameworks_id ORDER BY id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }
  )) as [{ id: number }[], number];
  const msc = await getManagementSystemClausesQuery(
    subClauseIds[0].map((subClause) => subClause.id)
  );
  return msc;
};

export const getManagementSystemClausesQuery = async (
  subClauseIds: number[],
  transaction: Transaction | null = null
) => {
  const clausesStruct = (await getAllClausesQuery(
    transaction
  )) as (ClauseStructISOModel &
    Partial<SubClauseStructISOModel & SubClauseISOModel>[])[]; // wrong type
  let clausesStructMap = new Map();
  for (let [i, clauseStruct] of clausesStruct.entries()) {
    (clauseStruct.dataValues as any).subClauses = [];
    clausesStructMap.set(clauseStruct.id, i);
  }
  for (let subClauseId of subClauseIds) {
    const subClause = await getSubClauseByIdQuery(subClauseId, transaction);
    (clausesStruct as any)[
      clausesStructMap.get(subClause.clause_id!)
    ].dataValues.subClauses.push(subClause);
  }
  return clausesStruct;
};

export const getAllAnnexesQuery = async (
  transaction: Transaction | null = null
) => {
  const annexes = await sequelize.query(
    `SELECT * FROM annex_struct_iso ORDER BY id;`,
    {
      mapToModel: true,
      model: AnnexStructISOModel,
      ...(transaction ? { transaction } : {}),
    }
  );
  return annexes;
};

export const getAllAnnexesWithCategoriesQuery = async (
  projectFrameworkId: number,
  transaction: Transaction | null = null
) => {
  const annexes = (await sequelize.query(
    `SELECT * FROM annex_struct_iso ORDER BY id;`,
    {
      mapToModel: true,
      ...(transaction ? { transaction } : {}),
    }
  )) as [AnnexStructISOModel[], number];

  for (let annex of annexes[0]) {
    const annexCategories = (await sequelize.query(
      `SELECT acs.id, acs.title, acs.description, acs.order_no, ac.status, ac.is_applicable FROM annexcategories_struct_iso acs JOIN annexcategories_iso ac ON acs.id = ac.annexcategory_meta_id WHERE acs.annex_id = :id AND ac.projects_frameworks_id = :projects_frameworks_id ORDER BY id;`,
      {
        replacements: {
          id: annex.id,
          projects_frameworks_id: projectFrameworkId,
        },
        mapToModel: true,
        ...(transaction ? { transaction } : {}),
      }
    )) as [
      Partial<AnnexCategoryStructISOModel & AnnexCategoryISOModel>[],
      number
    ];
    (
      annex as AnnexStructISOModel & {
        annexCategories: Partial<
          AnnexCategoryStructISOModel & AnnexCategoryISOModel
        >[];
      }
    ).annexCategories = annexCategories[0];
  }
  return annexes[0];
};

export const getAnnexByIdQuery = async (
  annexId: number,
  transaction: Transaction | null = null
) => {
  const annex = await sequelize.query(
    `SELECT * FROM annex_struct_iso WHERE id = :id;`,
    {
      replacements: { id: annexId },
      mapToModel: true,
      model: AnnexStructISOModel,
      ...(transaction ? { transaction } : {}),
    }
  );
  return annex[0];
};

export const getAnnexCategoriesByAnnexIdQuery = async (
  annexId: number,
  transaction: Transaction | null = null
) => {
  const annexCategories = await sequelize.query(
    `SELECT * FROM annexcategories_struct_iso WHERE annex_id = :id ORDER BY id;`,
    {
      replacements: { id: annexId },
      mapToModel: true,
      model: AnnexCategoryStructISOModel,
      ...(transaction ? { transaction } : {}),
    }
  );
  return annexCategories;
};

export const getAnnexCategoryByIdForProjectQuery = async (
  annexCategoryId: number,
  projectFrameworkId: number
) => {
  const _annexCategoryId = (await sequelize.query(
    `SELECT id FROM annexcategories_iso WHERE annexcategory_meta_id = :id AND projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: {
        id: annexCategoryId,
        projects_frameworks_id: projectFrameworkId,
      },
    }
  )) as [{ id: number }[], number];
  const annexCategories = await getAnnexCategoriesByIdQuery(
    _annexCategoryId[0][0].id
  );
  return annexCategories;
};

export const getAnnexCategoriesByIdQuery = async (
  annexCategoryId: number,
  transaction: Transaction | null = null
) => {
  const annexCategories = (await sequelize.query(
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
      replacements: { id: annexCategoryId },
      ...(transaction ? { transaction } : {}),
    }
  )) as [
    Partial<AnnexCategoryStructISOModel & AnnexCategoryISOModel>[],
    number
  ];
  const annexCategory = annexCategories[0][0];
  (annexCategory as any).risks = [];
  const risks = (await sequelize.query(
    `SELECT projects_risks_id FROM annexcategories_iso__risks WHERE annexcategory_id = :id`,
    {
      replacements: { id: annexCategoryId },
      transaction,
    }
  )) as [{ projects_risks_id: number }[], number];
  for (let risk of risks[0]) {
    (annexCategory as any).risks.push(risk.projects_risks_id);
  }
  return annexCategory;
};

export const getAnnexesByProjectIdQuery = async (
  projectFrameworkId: number
) => {
  const annexCategoryIds = (await sequelize.query(
    `SELECT id FROM annexcategories_iso WHERE projects_frameworks_id = :projects_frameworks_id ORDER BY id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }
  )) as [{ id: number }[], number];
  const rc = await getReferenceControlsQuery(
    annexCategoryIds[0].map((annexCategory) => annexCategory.id)
  );
  return rc;
};

export const getReferenceControlsQuery = async (
  annexCategoryIds: number[],
  transaction: Transaction | null = null
) => {
  const annexesStruct = (await getAllAnnexesQuery(
    transaction
  )) as (AnnexStructISOModel &
    Partial<AnnexCategoryISOModel & AnnexCategoryStructISOModel>[])[]; // wrong type
  let annexStructMap = new Map();
  for (let [i, annexStruct] of annexesStruct.entries()) {
    (annexStruct.dataValues as any).subClauses = [];
    annexStructMap.set(annexStruct.id, i);
  }
  for (let annexCategoryId of annexCategoryIds) {
    const annex = await getAnnexCategoriesByIdQuery(
      annexCategoryId,
      transaction
    );
    (annexesStruct as any)[
      annexStructMap.get(annex.annex_id!)
    ].dataValues.subClauses.push(annex);
  }
  return annexesStruct;
};

export const createNewClausesQuery = async (
  projectId: number,
  enable_ai_data_insertion: boolean,
  transaction: Transaction,
  is_mock_data: boolean
) => {
  const projectFrameworkId = (await sequelize.query(
    `SELECT id FROM projects_frameworks WHERE project_id = :project_id AND framework_id = 2`,
    {
      replacements: { project_id: projectId },
      transaction,
    }
  )) as [{ id: number }[], number];
  const subClauses = (await sequelize.query(
    `SELECT id FROM subclauses_struct_iso ORDER BY id;`,
    { transaction }
  )) as [{ id: number }[], number];
  const demoSubClauses = getDemoSubClauses() as {
    implementation_description: string;
    auditor_feedback: string;
  }[];
  const subClauseIds = await createNewSubClausesQuery(
    subClauses[0].map((subClause) => subClause.id),
    projectFrameworkId[0][0].id,
    enable_ai_data_insertion,
    demoSubClauses,
    transaction,
    is_mock_data
  );
  const clauses = await getManagementSystemClausesQuery(
    subClauseIds,
    transaction
  );
  return clauses;
};

export const createNewSubClausesQuery = async (
  subClauses: number[],
  projectFrameworkId: number,
  enable_ai_data_insertion: boolean,
  demoSubClauses: {
    implementation_description: string;
    auditor_feedback: string;
  }[],
  transaction: Transaction,
  is_mock_data: boolean
) => {
  const subClauseIds = [];
  let ctr = 0;
  for (let _subClauseId of subClauses) {
    const subClauseId = (await sequelize.query(
      `INSERT INTO subclauses_iso (
        subclause_meta_id, projects_frameworks_id, implementation_description, auditor_feedback, status
      ) VALUES (
        :subclause_meta_id, :projects_frameworks_id, :implementation_description, :auditor_feedback, :status
      ) RETURNING id;`,
      {
        replacements: {
          subclause_meta_id: _subClauseId,
          projects_frameworks_id: projectFrameworkId,
          implementation_description: enable_ai_data_insertion
            ? demoSubClauses[ctr].implementation_description
            : null,
          auditor_feedback: enable_ai_data_insertion
            ? demoSubClauses[ctr].auditor_feedback
            : null,
          status: is_mock_data
            ? STATUSES[Math.floor(Math.random() * STATUSES.length)]
            : "Not started",
        },
        transaction,
      }
    )) as [{ id: number }[], number];
    subClauseIds.push(subClauseId[0][0].id);
    ctr++;
  }
  return subClauseIds;
};

export const createNewAnnexesQUery = async (
  projectId: number,
  enable_ai_data_insertion: boolean,
  transaction: Transaction,
  is_mock_data: boolean
) => {
  const projectFrameworkId = (await sequelize.query(
    `SELECT id FROM projects_frameworks WHERE project_id = :project_id AND framework_id = 2`,
    {
      replacements: { project_id: projectId },
      transaction,
    }
  )) as [{ id: number }[], number];
  const annexCategories = (await sequelize.query(
    `SELECT id FROM annexcategories_struct_iso ORDER BY id;`,
    { transaction }
  )) as [{ id: number }[], number];
  const demoAnnexCategories = getDemoAnnexCategories() as {
    is_applicable: boolean;
    justification_for_exclusion: string;
    implementation_description: string;
    auditor_feedback: string;
  }[];
  const annexCategoryIds = await createNewAnnexeCategoriesQuery(
    annexCategories[0].map((annexCategory) => annexCategory.id),
    projectFrameworkId[0][0].id,
    demoAnnexCategories,
    enable_ai_data_insertion,
    transaction,
    is_mock_data
  );
  const annexes = await getReferenceControlsQuery(
    annexCategoryIds,
    transaction
  );
  return annexes;
};

export const createNewAnnexeCategoriesQuery = async (
  annexCategories: number[],
  projectFrameworkId: number,
  demoAnnexCategories: {
    is_applicable: boolean;
    justification_for_exclusion: string;
    implementation_description: string;
    auditor_feedback: string;
  }[],
  enable_ai_data_insertion: boolean,
  transaction: Transaction,
  is_mock_data: boolean
) => {
  const annexCategoryIds = [];
  let ctr = 0;
  for (let _annexCategoryId of annexCategories) {
    const annexCategoryId = (await sequelize.query(
      `INSERT INTO annexcategories_iso (
        annexcategory_meta_id, projects_frameworks_id, is_applicable, justification_for_exclusion, implementation_description, auditor_feedback, status
      ) VALUES (
        :annexcategory_meta_id, :projects_frameworks_id, :is_applicable, :justification_for_exclusion, :implementation_description, :auditor_feedback, :status
      ) RETURNING id;`,
      {
        replacements: {
          annexcategory_meta_id: _annexCategoryId,
          projects_frameworks_id: projectFrameworkId,
          is_applicable: enable_ai_data_insertion
            ? demoAnnexCategories[ctr].is_applicable
            : null,
          justification_for_exclusion: enable_ai_data_insertion
            ? demoAnnexCategories[ctr].justification_for_exclusion
            : null,
          implementation_description: enable_ai_data_insertion
            ? demoAnnexCategories[ctr].implementation_description
            : null,
          auditor_feedback: enable_ai_data_insertion
            ? demoAnnexCategories[ctr].auditor_feedback
            : null,
          status: is_mock_data
            ? STATUSES[Math.floor(Math.random() * STATUSES.length)]
            : "Not started",
        },
        transaction,
      }
    )) as [{ id: number }[], number];
    annexCategoryIds.push(annexCategoryId[0][0].id);
    ctr++;
  }
  return annexCategoryIds;
};

export const createISOFrameworkQuery = async (
  projectId: number,
  enable_ai_data_insertion: boolean,
  transaction: Transaction,
  is_mock_data: boolean = false
) => {
  const management_system_clauses = await createNewClausesQuery(
    projectId,
    enable_ai_data_insertion,
    transaction,
    is_mock_data
  );
  const reference_controls = await createNewAnnexesQUery(
    projectId,
    enable_ai_data_insertion,
    transaction,
    is_mock_data
  );
  return {
    management_system_clauses,
    reference_controls,
  };
};

export const updateSubClauseQuery = async (
  id: number,
  subClause: Partial<SubClauseISOModel>,
  uploadedFiles: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[] = [],
  deletedFiles: number[] = [],
  transaction: Transaction
) => {
  const files = await sequelize.query(
    `SELECT evidence_links FROM subclauses_iso WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: SubClauseISOModel,
      transaction,
    }
  );

  let currentFiles = (
    files[0].evidence_links ? files[0].evidence_links : []
  ) as {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[];

  currentFiles = currentFiles.filter(
    (f) => !deletedFiles.includes(parseInt(f.id))
  );
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
  ]
    .reduce((acc: string[], field) => {
      if (field === "evidence_links") {
        updateSubClause["evidence_links"] = JSON.stringify(currentFiles);
        acc.push(`${field} = :${field}`);
      } else if (
        subClause[field as keyof SubClauseISO] != undefined &&
        subClause[field as keyof SubClauseISO]
      ) {
        updateSubClause[field as keyof SubClauseISO] =
          subClause[field as keyof SubClauseISO];
        acc.push(`${field} = :${field}`);
      }
      return acc;
    }, [])
    .join(", ");

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
    transaction,
  });

  return result[0];
};

export const updateAnnexCategoryQuery = async (
  id: number,
  annexCategory: Partial<
    AnnexCategoryISO & { risksDelete: string; risksMitigated: string }
  >,
  uploadedFiles: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[] = [],
  deletedFiles: number[] = [],
  transaction: Transaction
) => {
  const files = await sequelize.query(
    `SELECT evidence_links FROM annexcategories_iso WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: AnnexCategoryISOModel,
      transaction,
    }
  );

  let currentFiles = (
    files[0].evidence_links ? files[0].evidence_links : []
  ) as {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[];

  currentFiles = currentFiles.filter(
    (f) => !deletedFiles.includes(parseInt(f.id))
  );
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
  ]
    .reduce((acc: string[], field) => {
      if (field === "evidence_links") {
        updateAnnexCategory["evidence_links"] = JSON.stringify(currentFiles);
        acc.push(`${field} = :${field}`);
      } else if (
        annexCategory[field as keyof AnnexCategoryISO] != undefined &&
        annexCategory[field as keyof AnnexCategoryISO]
      ) {
        updateAnnexCategory[field as keyof AnnexCategoryISO] =
          annexCategory[field as keyof AnnexCategoryISO];
        acc.push(`${field} = :${field}`);
      }
      return acc;
    }, [])
    .join(", ");

  if (setClause.length === 0) {
    return annexCategory as AnnexCategoryISO;
  }

  const query = `UPDATE annexcategories_iso SET ${setClause} WHERE id = :id RETURNING *;`;

  updateAnnexCategory.id = id;

  const result = (await sequelize.query(query, {
    replacements: updateAnnexCategory,
    // type: QueryTypes.UPDATE,
    transaction,
  })) as [AnnexCategoryISOModel[], number];
  const annexCategoryResult = result[0][0];
  (annexCategoryResult as any).risks = [];

  // update the risks
  const risksDeleted = JSON.parse(
    annexCategory.risksDelete || "[]"
  ) as number[];
  const risksMitigated = JSON.parse(
    annexCategory.risksMitigated || "[]"
  ) as number[];
  const risks = (await sequelize.query(
    `SELECT projects_risks_id FROM annexcategories_iso__risks WHERE annexcategory_id = :id`,
    {
      replacements: { id },
      transaction,
    }
  )) as [AnnexCategoryISORisksModel[], number];
  let currentRisks = risks[0].map((r) => r.project_risk_id!);
  currentRisks = currentRisks.filter((r) => !risksDeleted.includes(r));
  currentRisks = currentRisks.concat(risksMitigated);

  await sequelize.query(
    `DELETE FROM annexcategories_iso__risks WHERE annexcategory_id = :id;`,
    {
      replacements: { id },
      transaction,
    }
  );
  const annexCategoryRisksInsert = currentRisks
    .map((risk) => `(${id}, ${risk})`)
    .join(", ");
  if (annexCategoryRisksInsert) {
    const annexCategoryRisksInsertResult = (await sequelize.query(
      `INSERT INTO annexcategories_iso__risks (annexcategory_id, projects_risks_id) VALUES ${annexCategoryRisksInsert} RETURNING projects_risks_id;`,
      {
        transaction,
      }
    )) as [{ projects_risks_id: number }[], number];
    for (let risk of annexCategoryRisksInsertResult[0]) {
      (annexCategoryResult as any).risks.push(risk.projects_risks_id);
    }
  }

  return annexCategoryResult;
};

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
      transaction,
    }
  );
  return result.length > 0;
};

export const deleteAnnexCategoriesISOByProjectIdQuery = async (
  projectFrameworkId: number,
  transaction: Transaction
) => {
  // delete the risks first
  await sequelize.query(
    `DELETE FROM annexcategories_iso__risks WHERE annexcategory_id IN (SELECT id FROM annexcategories_iso WHERE projects_frameworks_id = :projects_frameworks_id)`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      transaction,
    }
  );
  const result = await sequelize.query(
    `DELETE FROM annexcategories_iso WHERE projects_frameworks_id = :projects_frameworks_id RETURNING *`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      mapToModel: true,
      model: AnnexCategoryISOModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0;
};

export const deleteProjectFrameworkISOQuery = async (
  projectId: number,
  transaction: Transaction
) => {
  const projectFrameworkId = (await sequelize.query(
    `SELECT id FROM projects_frameworks WHERE project_id = :project_id AND framework_id = 2`,
    {
      replacements: { project_id: projectId },
      transaction,
    }
  )) as [{ id: number }[], number];
  const subClausesDeleted = await deleteSubClausesISOByProjectIdQuery(
    projectFrameworkId[0][0].id,
    transaction
  );
  const annexeCategoriesDeleted =
    await deleteAnnexCategoriesISOByProjectIdQuery(
      projectFrameworkId[0][0].id,
      transaction
    );
  const result = await sequelize.query(
    `DELETE FROM projects_frameworks WHERE project_id = :project_id AND framework_id = 2 RETURNING *`,
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: ProjectFrameworksModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0 && subClausesDeleted && annexeCategoriesDeleted;
};
