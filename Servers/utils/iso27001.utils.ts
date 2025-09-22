import { QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { ProjectFrameworksModel } from "../domain.layer/models/projectFrameworks/projectFrameworks.model";
import { STATUSES } from "../types/status.type";
import { ISO27001Clause } from "../structures/ISO-27001/clauses/iso27001.clause.struct";
import { ISO27001Annex } from "../structures/ISO-27001/annexes/iso27001.annex.struct";
import { ISO27001ClauseStructModel } from "../domain.layer/frameworks/ISO-27001/ISO27001ClauseStruct.model";
import { ISO27001SubClauseStructModel } from "../domain.layer/frameworks/ISO-27001/ISO27001SubClauseStruct.model";
import { ISO27001SubClauseModel } from "../domain.layer/frameworks/ISO-27001/ISO27001SubClause.model";
import { ISO27001AnnexStructModel } from "../domain.layer/frameworks/ISO-27001/ISO27001AnnexStruct.model";
import { ISO27001AnnexControlStructModel } from "../domain.layer/frameworks/ISO-27001/ISO27001AnnexControlStruct.model";
import { ISO27001AnnexControlModel } from "../domain.layer/frameworks/ISO-27001/ISO27001AnnexControl.model";
import { IISO27001SubClause } from "../domain.layer/interfaces/i.ISO27001SubClause";
import { ISO27001SubClauseRisksModel } from "../domain.layer/frameworks/ISO-27001/ISO27001SubClauseRisks.model";
import { IISO27001AnnexControl } from "../domain.layer/interfaces/i.iso27001AnnexControl";
import { ISO27001AnnexControlRisksModel } from "../domain.layer/frameworks/ISO-27001/ISO27001AnnexControlRisks.model";
import { validateRiskArray } from "./utility.utils";

const getDemoSubClauses = (): Object[] => {
  const subClauses = [];
  for (let clause of ISO27001Clause) {
    for (let subClause of clause.subclauses) {
      subClauses.push({
        implementation_description: subClause.implementation_description || "",
        auditor_feedback:
          "auditor_feedback" in subClause
            ? (subClause as any).auditor_feedback || ""
            : "",
      });
    }
  }
  return subClauses;
};

const getDemoAnnexControls = (): Object[] => {
  const annexControls = [];
  for (let annex of ISO27001Annex) {
    for (let annexControl of annex.controls) {
      annexControls.push({
        implementation_description:
          annexControl.implementation_description || "",
        auditor_feedback:
          "auditor_feedback" in annexControl
            ? (annexControl as any).auditor_feedback || ""
            : "",
      });
    }
  }
  return annexControls;
};

export const countSubClausesISOByProjectId = async (
  projectFrameworkId: number,
  tenant: string
): Promise<{
  totalSubclauses: string;
  doneSubclauses: string;
}> => {
  const result = (await sequelize.query(
    `SELECT COUNT(*) AS "totalSubclauses", SUM(CASE WHEN status = 'Implemented' THEN 1 ELSE 0 END) AS "doneSubclauses" FROM "${tenant}".subclauses_iso27001 WHERE projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }
  )) as [{ totalSubclauses: string; doneSubclauses: string }[], number];
  return result[0][0];
};

export const countAnnexControlsISOByProjectId = async (
  projectFrameworkId: number,
  tenant: string
): Promise<{
  totalAnnexControls: string;
  doneAnnexControls: string;
}> => {
  const result = (await sequelize.query(
    `SELECT COUNT(*) AS "totalAnnexControls", SUM(CASE WHEN status = 'Implemented' THEN 1 ELSE 0 END) AS "doneAnnexControls" FROM "${tenant}".annexcontrols_iso27001 WHERE projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }
  )) as [{ totalAnnexControls: string; doneAnnexControls: string }[], number];
  return result[0][0];
};

export const getAllClausesQuery = async (
  tenant: string,
  transaction: Transaction | null = null
) => {
  const clauses = await sequelize.query(
    `SELECT * FROM public.clauses_struct_iso27001 ORDER BY id;`,
    {
      mapToModel: true,
      model: ISO27001ClauseStructModel,
      ...(transaction ? { transaction } : {}),
    }
  );
  return clauses;
};

export const getAllClausesWithSubClauseQuery = async (
  projectFrameworkId: number,
  tenant: string,
  transaction: Transaction | null = null
) => {
  const clauses = (await sequelize.query(
    `SELECT * FROM public.clauses_struct_iso27001 ORDER BY id;`,
    {
      mapToModel: true,
      ...(transaction ? { transaction } : {}),
    }
  )) as [ISO27001ClauseStructModel[], number];

  for (let clause of clauses[0]) {
    const subClauses = (await sequelize.query(
      `SELECT scs.id, scs.title, scs.order_no, sc.status FROM public.subclauses_struct_iso27001 scs JOIN "${tenant}".subclauses_iso27001 sc ON scs.id = sc.subclause_meta_id WHERE scs.clause_id = :id AND sc.projects_frameworks_id = :projects_frameworks_id ORDER BY id;`,
      {
        replacements: {
          id: clause.id,
          projects_frameworks_id: projectFrameworkId,
        },
        mapToModel: true,
        ...(transaction ? { transaction } : {}),
      }
    )) as [
        Partial<ISO27001SubClauseStructModel & ISO27001SubClauseModel>[],
        number,
      ];
    (
      clause as ISO27001ClauseStructModel & {
        subClauses: Partial<
          ISO27001SubClauseStructModel & ISO27001SubClauseModel
        >[];
      }
    ).subClauses = subClauses[0];
  }
  return clauses[0];
};

export const getAllAnnexesWithSubAnnexQuery = async (
  projectFrameworkId: number,
  tenant: string,
  transaction: Transaction | null = null
) => {
  const annexes = (await sequelize.query(
    `SELECT * FROM public.annex_struct_iso27001 ORDER BY id;`,
    {
      mapToModel: true,
      ...(transaction ? { transaction } : {}),
    }
  )) as [ISO27001AnnexStructModel[], number];

  for (let annex of annexes[0]) {
    const annexControls = (await sequelize.query(
      `SELECT acs.id, acs.title, acs.description, acs.guidance, acs.sub_id, acs.order_no, acs.annex_id,
              ac.id as instance_id, ac.implementation_description,
              ac.evidence_links, ac.status, ac.owner, ac.reviewer, ac.approver, ac.due_date, ac.auditor_feedback,
              ac.projects_frameworks_id, ac.created_at, ac.is_demo
         FROM public.annexcontrols_struct_iso27001 acs
         LEFT JOIN "${tenant}".annexcontrols_iso27001 ac
           ON acs.id = ac.annexcontrol_meta_id
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

    (annex as any).annexcontrols = annexControls[0];
  }
  return annexes[0];
};

export const getClauseById = async (
  clauseId: number,
  transaction: Transaction | null = null
) => {
  const clause = await sequelize.query(
    `SELECT * FROM public.clauses_struct_iso27001 WHERE id = :id;`,
    {
      replacements: { id: clauseId },
      mapToModel: true,
      model: ISO27001ClauseStructModel,
      ...(transaction ? { transaction } : {}),
    }
  );
  return clause[0];
};

export const getSubClausesByClauseIdQuery = async (
  clauseId: number,
  tenant: string,
  transaction: Transaction | null = null
) => {
  const subClauses = await sequelize.query(
    `SELECT * FROM public.subclauses_struct_iso27001 WHERE clause_id = :id ORDER BY id;`,
    {
      replacements: { id: clauseId },
      mapToModel: true,
      model: ISO27001SubClauseStructModel,
      ...(transaction ? { transaction } : {}),
    }
  );
  return subClauses;
};

export const getSubClauseByIdForProjectQuery = async (
  subClauseId: number,
  projectFrameworkId: number,
  tenant: string
) => {
  const _subClauseId = (await sequelize.query(
    `SELECT id FROM "${tenant}".subclauses_iso27001 WHERE subclause_meta_id = :id AND projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: {
        id: subClauseId,
        projects_frameworks_id: projectFrameworkId,
      },
    }
  )) as [{ id: number }[], number];
  const subClauses = await getSubClauseByIdQuery(_subClauseId[0][0].id, tenant);
  return subClauses;
};

export const getSubClauseByIdQuery = async (
  subClauseId: number,
  tenant: string,
  transaction: Transaction | null = null
) => {
  const subClauses = (await sequelize.query(
    `SELECT
      scs.title AS title,
      scs.requirement_summary AS requirement_summary,
      scs.key_questions AS key_questions,
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
    FROM public.subclauses_struct_iso27001 scs JOIN "${tenant}".subclauses_iso27001 sc ON scs.id = sc.subclause_meta_id
    WHERE sc.id = :id ORDER BY created_at DESC, id ASC;`,
    {
      replacements: { id: subClauseId },
      ...(transaction ? { transaction } : {}),
    }
  )) as [
      Partial<ISO27001SubClauseStructModel & ISO27001SubClauseModel>[],
      number,
    ];
  const subClause = subClauses[0][0];
  (subClause as any).risks = [];
  const risks = (await sequelize.query(
    `SELECT projects_risks_id FROM "${tenant}".subclauses_iso27001__risks WHERE subclause_id = :id`,
    {
      replacements: { id: subClauseId },
      transaction,
    }
  )) as [{ projects_risks_id: number }[], number];
  for (let risk of risks[0]) {
    (subClause as any).risks.push(risk.projects_risks_id);
  }
  return subClause;
};

export const getClausesByProjectIdQuery = async (
  projectFrameworkId: number,
  tenant: string
) => {
  const subClauseIds = (await sequelize.query(
    `SELECT id FROM "${tenant}".subclauses_iso27001 WHERE projects_frameworks_id = :projects_frameworks_id ORDER BY id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }
  )) as [{ id: number }[], number];
  const msc = await getMainClausesQuery(
    subClauseIds[0].map((subClause) => subClause.id),
    tenant
  );
  return msc;
};

export const getMainClausesQuery = async (
  subClauseIds: number[],
  tenant: string,
  transaction: Transaction | null = null
) => {
  const clausesStruct = (await getAllClausesQuery(
    tenant,
    transaction
  )) as (ISO27001ClauseStructModel &
    Partial<ISO27001SubClauseStructModel & ISO27001SubClauseModel>[])[]; // wrong type
  let clausesStructMap = new Map();
  for (let [i, clauseStruct] of clausesStruct.entries()) {
    (clauseStruct.dataValues as any).subClauses = [];
    clausesStructMap.set(clauseStruct.id, i);
  }
  for (let subClauseId of subClauseIds) {
    const subClause = await getSubClauseByIdQuery(
      subClauseId,
      tenant,
      transaction
    );
    (clausesStruct as any)[
      clausesStructMap.get(subClause.clause_id!)
    ].dataValues.subClauses.push(subClause);
  }
  return clausesStruct;
};

export const getAllAnnexesQuery = async (
  tenant: string,
  transaction: Transaction | null = null
) => {
  const annexes = await sequelize.query(
    `SELECT * FROM public.annex_struct_iso27001 ORDER BY id;`,
    {
      mapToModel: true,
      model: ISO27001AnnexStructModel,
      ...(transaction ? { transaction } : {}),
    }
  );
  return annexes;
};

export const getAllAnnexesWithControlsQuery = async (
  projectFrameworkId: number,
  tenant: string,
  transaction: Transaction | null = null
) => {
  const annexes = (await sequelize.query(
    `SELECT * FROM public.annex_struct_iso27001 ORDER BY id;`,
    {
      mapToModel: true,
      ...(transaction ? { transaction } : {}),
    }
  )) as [ISO27001AnnexStructModel[], number];

  for (let annex of annexes[0]) {
    const annexControls = (await sequelize.query(
      `SELECT acs.id, acs.title, acs.requirement_summary, acs.order_no, ac.status FROM public.annexcontrols_struct_iso27001 acs JOIN "${tenant}".annexcontrols_iso27001 ac ON acs.id = ac.annexcontrol_meta_id WHERE acs.annex_id = :id AND ac.projects_frameworks_id = :projects_frameworks_id ORDER BY id;`,
      {
        replacements: {
          id: annex.id,
          projects_frameworks_id: projectFrameworkId,
        },
        mapToModel: true,
        ...(transaction ? { transaction } : {}),
      }
    )) as [
        Partial<ISO27001AnnexControlStructModel & ISO27001AnnexControlModel>[],
        number,
      ];
    (
      annex as ISO27001AnnexStructModel & {
        annexControls: Partial<
          ISO27001AnnexControlStructModel & ISO27001AnnexControlModel
        >[];
      }
    ).annexControls = annexControls[0];
  }
  return annexes[0];
};

export const getAnnexByIdQuery = async (
  annexId: number,
  transaction: Transaction | null = null
) => {
  const annex = await sequelize.query(
    `SELECT * FROM public.annex_struct_iso27001 WHERE id = :id;`,
    {
      replacements: { id: annexId },
      mapToModel: true,
      model: ISO27001AnnexStructModel,
      ...(transaction ? { transaction } : {}),
    }
  );
  return annex[0];
};

export const getAnnexControlsByAnnexIdQuery = async (
  annexId: number,
  tenant: string,
  transaction: Transaction | null = null
) => {
  const annexControls = await sequelize.query(
    `SELECT * FROM public.annexcontrols_struct_iso27001 WHERE annex_id = :id ORDER BY id;`,
    {
      replacements: { id: annexId },
      mapToModel: true,
      model: ISO27001AnnexControlStructModel,
      ...(transaction ? { transaction } : {}),
    }
  );
  return annexControls;
};

export const getAnnexControlByIdForProjectQuery = async (
  annexControlId: number,
  projectFrameworkId: number,
  tenant: string
) => {
  const _annexControlId = (await sequelize.query(
    `SELECT id FROM "${tenant}".annexcontrols_iso27001 WHERE annexcontrol_meta_id = :id AND projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: {
        id: annexControlId,
        projects_frameworks_id: projectFrameworkId,
      },
    }
  )) as [{ id: number }[], number];
  const annexControls = await getAnnexControlsByIdQuery(
    _annexControlId[0][0].id,
    tenant
  );
  return annexControls;
};

export const getAnnexControlsByIdQuery = async (
  annexControlId: number,
  tenant: string,
  transaction: Transaction | null = null
) => {
  const annexControls = (await sequelize.query(
    `SELECT
      acs.title AS title,
      acs.requirement_summary AS requirement_summary,
      acs.key_questions AS key_questions,
      acs.evidence_examples AS evidence_examples,
      acs.annex_id AS annex_id,
      ac.id AS id,
      ac.implementation_description AS implementation_description,
      ac.evidence_links AS evidence_links,
      ac.status AS status,
      ac.owner AS owner,
      ac.reviewer AS reviewer,
      ac.approver AS approver,
      ac.due_date AS due_date,
      ac.auditor_feedback AS auditor_feedback,
      ac.created_at AS created_at
    FROM public.annexcontrols_struct_iso27001 acs JOIN "${tenant}".annexcontrols_iso27001 ac ON acs.id = ac.annexcontrol_meta_id
    WHERE ac.id = :id ORDER BY created_at DESC, id ASC;`,
    {
      replacements: { id: annexControlId },
      ...(transaction ? { transaction } : {}),
    }
  )) as [
      Partial<ISO27001AnnexControlStructModel & ISO27001AnnexControlModel>[],
      number,
    ];
  const annexControl = annexControls[0][0];
  (annexControl as any).risks = [];
  const risks = (await sequelize.query(
    `SELECT projects_risks_id FROM "${tenant}".annexcontrols_iso27001__risks WHERE annexcontrol_id = :id`,
    {
      replacements: { id: annexControlId },
      transaction,
    }
  )) as [{ projects_risks_id: number }[], number];
  for (let risk of risks[0]) {
    (annexControl as any).risks.push(risk.projects_risks_id);
  }
  return annexControl;
};

export const getAnnexesByProjectIdQuery = async (
  projectFrameworkId: number,
  tenant: string
) => {
  const annexControlIds = (await sequelize.query(
    `SELECT id FROM "${tenant}".annexcontrols_iso27001 WHERE projects_frameworks_id = :projects_frameworks_id ORDER BY id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }
  )) as [{ id: number }[], number];
  const rc = await getAnnexControlsQuery(
    annexControlIds[0].map((annexControl) => annexControl.id),
    tenant
  );
  return rc;
};

export const getAnnexControlsQuery = async (
  annexControlIds: number[],
  tenant: string,
  transaction: Transaction | null = null
) => {
  const annexesStruct = (await getAllAnnexesQuery(
    tenant,
    transaction
  )) as (ISO27001AnnexStructModel &
    Partial<ISO27001AnnexControlModel & ISO27001AnnexControlStructModel>[])[]; // wrong type
  let annexStructMap = new Map();
  for (let [i, annexStruct] of annexesStruct.entries()) {
    (annexStruct.dataValues as any).subClauses = [];
    annexStructMap.set(annexStruct.id, i);
  }
  for (let annexControlId of annexControlIds) {
    const annex = await getAnnexControlsByIdQuery(
      annexControlId,
      tenant,
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
  tenant: string,
  transaction: Transaction,
  is_mock_data: boolean
) => {
  const projectFrameworkId = (await sequelize.query(
    `SELECT id FROM "${tenant}".projects_frameworks WHERE project_id = :project_id AND framework_id = 3`,
    {
      replacements: { project_id: projectId },
      transaction,
    }
  )) as [{ id: number }[], number];
  const subClauses = (await sequelize.query(
    `SELECT id FROM public.subclauses_struct_iso27001 ORDER BY id;`,
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
    tenant,
    transaction,
    is_mock_data
  );
  const clauses = await getMainClausesQuery(subClauseIds, tenant, transaction);
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
  tenant: string,
  transaction: Transaction,
  is_mock_data: boolean
) => {
  const subClauseIds = [];
  let ctr = 0;
  for (let _subClauseId of subClauses) {
    const subClauseId = (await sequelize.query(
      `INSERT INTO "${tenant}".subclauses_iso27001 (
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
  tenant: string,
  transaction: Transaction,
  is_mock_data: boolean
) => {
  const projectFrameworkId = (await sequelize.query(
    `SELECT id FROM "${tenant}".projects_frameworks WHERE project_id = :project_id AND framework_id = 3`,
    {
      replacements: { project_id: projectId },
      transaction,
    }
  )) as [{ id: number }[], number];
  const annexControls = (await sequelize.query(
    `SELECT id FROM public.annexcontrols_struct_iso27001 ORDER BY id;`,
    { transaction }
  )) as [{ id: number }[], number];
  const demoAnnexControls = getDemoAnnexControls() as {
    implementation_description: string;
    auditor_feedback: string;
  }[];
  const annexControlIds = await createNewAnnexControlsQuery(
    annexControls[0].map((annexControl) => annexControl.id),
    projectFrameworkId[0][0].id,
    demoAnnexControls,
    enable_ai_data_insertion,
    tenant,
    transaction,
    is_mock_data
  );
  const annexes = await getAnnexControlsQuery(
    annexControlIds,
    tenant,
    transaction
  );
  return annexes;
};

export const createNewAnnexControlsQuery = async (
  annexControls: number[],
  projectFrameworkId: number,
  demoAnnexControls: {
    implementation_description: string;
    auditor_feedback: string;
  }[],
  enable_ai_data_insertion: boolean,
  tenant: string,
  transaction: Transaction,
  is_mock_data: boolean
) => {
  const annexControlIds = [];
  let ctr = 0;
  for (let _annexControlId of annexControls) {
    const annexControlId = (await sequelize.query(
      `INSERT INTO "${tenant}".annexcontrols_iso27001 (
        annexcontrol_meta_id, projects_frameworks_id, implementation_description, auditor_feedback, status
      ) VALUES (
        :annexcontrol_meta_id, :projects_frameworks_id, :implementation_description, :auditor_feedback, :status
      ) RETURNING id;`,
      {
        replacements: {
          annexcontrol_meta_id: _annexControlId,
          projects_frameworks_id: projectFrameworkId,
          implementation_description: enable_ai_data_insertion
            ? demoAnnexControls[ctr].implementation_description
            : null,
          auditor_feedback: enable_ai_data_insertion
            ? demoAnnexControls[ctr].auditor_feedback
            : null,
          status: is_mock_data
            ? STATUSES[Math.floor(Math.random() * STATUSES.length)]
            : "Not started",
        },
        transaction,
      }
    )) as [{ id: number }[], number];
    annexControlIds.push(annexControlId[0][0].id);
    ctr++;
  }
  return annexControlIds;
};

export const createISO27001FrameworkQuery = async (
  projectId: number,
  enable_ai_data_insertion: boolean,
  tenant: string,
  transaction: Transaction,
  is_mock_data: boolean = false
) => {
  const main_clauses = await createNewClausesQuery(
    projectId,
    enable_ai_data_insertion,
    tenant,
    transaction,
    is_mock_data
  );
  const annex_controls = await createNewAnnexesQUery(
    projectId,
    enable_ai_data_insertion,
    tenant,
    transaction,
    is_mock_data
  );
  return {
    main_clauses,
    annex_controls,
  };
};

export const updateSubClauseQuery = async (
  id: number,
  subClause: Partial<
    ISO27001SubClauseModel & { risksDelete: string; risksMitigated: string }
  >,
  uploadedFiles: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[] = [],
  deletedFiles: number[] = [],
  tenant: string,
  transaction: Transaction
) => {
  const files = await sequelize.query(
    `SELECT evidence_links FROM "${tenant}".subclauses_iso27001 WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: ISO27001SubClauseModel,
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

  const updateSubClause: Partial<Record<keyof IISO27001SubClause, any>> = {
    id,
  };
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
      } else if (subClause[field as keyof IISO27001SubClause] != undefined) {
        let value = subClause[field as keyof IISO27001SubClause];

        // Handle empty strings for integer fields
        if (["owner", "reviewer", "approver"].includes(field)) {
          if (value === "" || value === null || value === undefined) {
            return acc; // Skip this field if it's empty
          }
          const numValue = parseInt(value as string);
          if (isNaN(numValue)) {
            return acc; // Skip this field if it's not a valid number
          }
          value = numValue;
        }

        updateSubClause[field as keyof IISO27001SubClause] = value;
        acc.push(`${field} = :${field}`);
      }
      return acc;
    }, [])
    .join(", ");

  if (setClause.length === 0) {
    return subClause as IISO27001SubClause;
  }

  const query = `UPDATE "${tenant}".subclauses_iso27001 SET ${setClause} WHERE id = :id RETURNING *;`;

  updateSubClause.id = id;

  const result = (await sequelize.query(query, {
    replacements: updateSubClause,
    // mapToModel: true,
    // model: SubClauseISOModel,
    // type: QueryTypes.UPDATE,
    transaction,
  })) as [ISO27001SubClauseModel[], number];
  const subClauseResult = result[0][0];
  (subClauseResult as any).risks = [];

  // update the risks
  const risksDeletedRaw = JSON.parse(subClause.risksDelete || "[]");
  const risksMitigatedRaw = JSON.parse(subClause.risksMitigated || "[]");

  // Validate that both arrays contain only valid integers
  const risksDeleted = validateRiskArray(risksDeletedRaw, "risksDelete");
  const risksMitigated = validateRiskArray(risksMitigatedRaw, "risksMitigated");

  const risks = (await sequelize.query(
    `SELECT projects_risks_id FROM "${tenant}".subclauses_iso27001__risks WHERE subclause_id = :id`,
    {
      replacements: { id },
      transaction,
    }
  )) as [ISO27001SubClauseRisksModel[], number];
  let currentRisks = risks[0].map((r) => r.projects_risks_id!);
  currentRisks = currentRisks.filter((r) => !risksDeleted.includes(r));
  currentRisks = currentRisks.concat(risksMitigated);

  await sequelize.query(
    `DELETE FROM "${tenant}".subclauses_iso27001__risks WHERE subclause_id = :id;`,
    {
      replacements: { id },
      transaction,
    }
  );
  if (currentRisks.length > 0) {
    // Create parameterized placeholders for safe insertion
    const placeholders = currentRisks.map((_, i) => `(:subclause_id${i}, :projects_risks_id${i})`).join(", ");
    const replacements: { [key: string]: any } = {};

    // Build replacement parameters safely
    currentRisks.forEach((risk, i) => {
      replacements[`subclause_id${i}`] = id;
      replacements[`projects_risks_id${i}`] = risk;
    });
    const subClauseRisksInsertResult = (await sequelize.query(
      `INSERT INTO "${tenant}".subclauses_iso27001__risks (subclause_id, projects_risks_id) VALUES ${placeholders} RETURNING projects_risks_id;`,
      {
        replacements,
        transaction,
      }
    )) as [{ projects_risks_id: number }[], number];
    for (let risk of subClauseRisksInsertResult[0]) {
      (subClauseResult as any).risks.push(risk.projects_risks_id);
    }
  }
};

export const updateAnnexControlQuery = async (
  id: number,
  annexControl: Partial<
    IISO27001AnnexControl & { risksDelete: string; risksMitigated: string }
  >,
  uploadedFiles: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: Date;
  }[] = [],
  deletedFiles: number[] = [],
  tenant: string,
  transaction: Transaction
) => {
  const files = await sequelize.query(
    `SELECT evidence_links FROM "${tenant}".annexcontrols_iso27001 WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: ISO27001AnnexControlModel,
      transaction,
    }
  );

  if (!files[0]) {
    throw new Error(`Annex control with ID ${id} not found`);
  }

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

  const updateAnnexControl: Partial<Record<keyof IISO27001AnnexControl, any>> =
    {};
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
        updateAnnexControl["evidence_links"] = JSON.stringify(currentFiles);
        acc.push(`${field} = :${field}`);
      } else if (
        annexControl[field as keyof IISO27001AnnexControl] != undefined
      ) {
        let value = annexControl[field as keyof IISO27001AnnexControl];

        // Handle empty strings for integer fields
        if (["owner", "reviewer", "approver"].includes(field)) {
          if (value === "" || value === null || value === undefined) {
            return acc; // Skip this field if it's empty
          }
          const numValue = parseInt(value as string);
          if (isNaN(numValue)) {
            return acc; // Skip this field if it's not a valid number
          }
          value = numValue;
        }

        updateAnnexControl[field as keyof IISO27001AnnexControl] = value;
        acc.push(`${field} = :${field}`);
      }
      return acc;
    }, [])
    .join(", ");

  // update the risks
  const risksDeletedRaw = JSON.parse(annexControl.risksDelete || "[]");
  const risksMitigatedRaw = JSON.parse(annexControl.risksMitigated || "[]");

  // Validate that both arrays contain only valid integers
  const risksDeleted = validateRiskArray(risksDeletedRaw, "risksDelete");
  const risksMitigated = validateRiskArray(risksMitigatedRaw, "risksMitigated");

  if (setClause.length === 0 && risksDeleted.length === 0 && risksMitigated.length === 0) {
    return annexControl as IISO27001AnnexControl;
  }

  const query = `UPDATE "${tenant}".annexcontrols_iso27001 SET ${setClause} WHERE id = :id RETURNING *;`;

  updateAnnexControl.id = id;

  const result = (await sequelize.query(query, {
    replacements: updateAnnexControl,
    // type: QueryTypes.UPDATE,
    transaction,
  })) as [ISO27001AnnexControlModel[], number];
  const annexControlResult = result[0][0];
  (annexControlResult as any).risks = [];

  const risks = (await sequelize.query(
    `SELECT projects_risks_id FROM "${tenant}".annexcontrols_iso27001__risks WHERE annexcontrol_id = :id`,
    {
      replacements: { id },
      transaction,
    }
  )) as [ISO27001AnnexControlRisksModel[], number];
  let currentRisks = risks[0].map((r) => r.projects_risks_id!);
  currentRisks = currentRisks.filter((r) => !risksDeleted.includes(r));
  currentRisks = currentRisks.concat(risksMitigated);

  await sequelize.query(
    `DELETE FROM "${tenant}".annexcontrols_iso27001__risks WHERE annexcontrol_id = :id;`,
    {
      replacements: { id },
      transaction,
    }
  );
  if (currentRisks.length > 0) {
    // Create parameterized placeholders for safe insertion
    const placeholders = currentRisks.map((_, i) => `(:annexcontrol_id${i}, :projects_risks_id${i})`).join(", ");
    const replacements: { [key: string]: any } = {};

    // Build replacement parameters safely
    currentRisks.forEach((risk, i) => {
      replacements[`annexcontrol_id${i}`] = id;
      replacements[`projects_risks_id${i}`] = risk;
    });

    const annexControlRisksInsertResult = (await sequelize.query(
      `INSERT INTO "${tenant}".annexcontrols_iso27001__risks (annexcontrol_id, projects_risks_id) VALUES ${placeholders} RETURNING projects_risks_id;`,
      {
        replacements,
        transaction,
      }
    )) as [{ projects_risks_id: number }[], number];
    for (let risk of annexControlRisksInsertResult[0]) {
      (annexControlResult as any).risks.push(risk.projects_risks_id);
    }
  }

  return annexControlResult;
};

export const deleteSubClausesISO27001ByProjectIdQuery = async (
  projectFrameworkId: number,
  tenant: string,
  transaction: Transaction
) => {
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".subclauses_iso27001 WHERE projects_frameworks_id = :projects_frameworks_id RETURNING *`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      mapToModel: true,
      model: ISO27001SubClauseModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0;
};

export const deleteAnnexControlsISO27001ByProjectIdQuery = async (
  projectFrameworkId: number,
  tenant: string,
  transaction: Transaction
) => {
  // delete the risks first
  await sequelize.query(
    `DELETE FROM "${tenant}".annexcontrols_iso27001__risks WHERE annexcontrol_id IN (SELECT id FROM "${tenant}".annexcontrols_iso27001 WHERE projects_frameworks_id = :projects_frameworks_id)`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      transaction,
    }
  );
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".annexcontrols_iso27001 WHERE projects_frameworks_id = :projects_frameworks_id RETURNING *`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      mapToModel: true,
      model: ISO27001AnnexControlModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0;
};

export const deleteProjectFrameworkISO27001Query = async (
  projectId: number,
  tenant: string,
  transaction: Transaction
) => {
  const projectFrameworkId = (await sequelize.query(
    `SELECT id FROM "${tenant}".projects_frameworks WHERE project_id = :project_id AND framework_id = 3`,
    {
      replacements: { project_id: projectId },
      transaction,
    }
  )) as [{ id: number }[], number];
  const subClausesDeleted = await deleteSubClausesISO27001ByProjectIdQuery(
    projectFrameworkId[0][0].id,
    tenant,
    transaction
  );
  const annexControlsDeleted =
    await deleteAnnexControlsISO27001ByProjectIdQuery(
      projectFrameworkId[0][0].id,
      tenant,
      transaction
    );
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".projects_frameworks WHERE project_id = :project_id AND framework_id = 3 RETURNING *`,
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: ProjectFrameworksModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0 && subClausesDeleted && annexControlsDeleted;
};
