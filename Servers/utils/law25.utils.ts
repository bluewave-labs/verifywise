import { QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { Law25Topics } from "../structures/LAW-25/topics.struct";
import { STATUSES } from "../types/status.type";
import { validateRiskArray } from "./utility.utils";

// Framework ID for Quebec Law 25
const LAW25_FRAMEWORK_ID = 5;

/**
 * Get demo requirement data for Law 25
 */
const getDemoRequirements = (): Object[] => {
  const requirements = [];
  for (let topic of Law25Topics) {
    for (let _requirement of topic.requirements) {
      requirements.push({
        implementation_description: "",
        auditor_feedback: "",
      });
    }
  }
  return requirements;
};

/**
 * Count requirements by project framework ID
 */
export const countRequirementsLaw25ByProjectId = async (
  projectFrameworkId: number,
  tenant: string
): Promise<{
  totalRequirements: string;
  doneRequirements: string;
}> => {
  const result = (await sequelize.query(
    `SELECT COUNT(*) AS "totalRequirements", SUM(CASE WHEN status = 'Implemented' THEN 1 ELSE 0 END) AS "doneRequirements" FROM "${tenant}".requirements_law25 WHERE projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }
  )) as [{ totalRequirements: string; doneRequirements: string }[], number];
  return result[0][0];
};

/**
 * Count assigned requirements by project framework ID
 */
export const countRequirementAssignmentsLaw25ByProjectId = async (
  projectFrameworkId: number,
  tenant: string
): Promise<{
  totalRequirements: string;
  assignedRequirements: string;
}> => {
  const result = (await sequelize.query(
    `SELECT
       COUNT(*) AS "totalRequirements",
       SUM(CASE WHEN owner IS NOT NULL THEN 1 ELSE 0 END) AS "assignedRequirements"
     FROM "${tenant}".requirements_law25
     WHERE projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }
  )) as [{ totalRequirements: string; assignedRequirements: string }[], number];

  return result[0][0];
};

/**
 * Get all topics structure
 */
export const getAllTopicsLaw25Query = async (
  _tenant: string,
  transaction: Transaction | null = null
) => {
  const topics = await sequelize.query(
    `SELECT * FROM public.topics_struct_law25 ORDER BY order_no;`,
    {
      ...(transaction ? { transaction } : {}),
    }
  );
  return topics[0];
};

/**
 * Get all topics with their requirements for a project
 */
export const getAllTopicsWithRequirementsLaw25Query = async (
  projectFrameworkId: number,
  tenant: string,
  transaction: Transaction | null = null
) => {
  const topics = (await sequelize.query(
    `SELECT * FROM public.topics_struct_law25 ORDER BY order_no;`,
    {
      ...(transaction ? { transaction } : {}),
    }
  )) as [any[], number];

  for (let topic of topics[0]) {
    const requirements = (await sequelize.query(
      `SELECT rs.id as struct_id, rs.requirement_id, rs.name, rs.order_no, rs.summary,
              r.id, r.status, r.owner, r.reviewer, r.due_date
       FROM public.requirements_struct_law25 rs
       LEFT JOIN "${tenant}".requirements_law25 r ON rs.id = r.requirement_meta_id
         AND r.projects_frameworks_id = :projects_frameworks_id
       WHERE rs.topic_id = :topic_id
       ORDER BY rs.order_no;`,
      {
        replacements: {
          topic_id: topic.id,
          projects_frameworks_id: projectFrameworkId,
        },
        ...(transaction ? { transaction } : {}),
      }
    )) as [any[], number];
    topic.requirements = requirements[0];
  }
  return topics[0];
};

/**
 * Get a single requirement by ID
 */
export const getRequirementByIdLaw25Query = async (
  requirementId: number,
  tenant: string,
  transaction: Transaction | null = null
) => {
  const requirements = (await sequelize.query(
    `SELECT
      rs.requirement_id AS requirement_id,
      rs.name AS name,
      rs.summary AS summary,
      rs.key_questions AS key_questions,
      rs.evidence_examples AS evidence_examples,
      rs.topic_id AS topic_id,
      r.id AS id,
      r.implementation_description AS implementation_description,
      r.evidence_links AS evidence_links,
      r.status AS status,
      r.owner AS owner,
      r.reviewer AS reviewer,
      r.approver AS approver,
      r.due_date AS due_date,
      r.auditor_feedback AS auditor_feedback,
      r.created_at AS created_at
    FROM public.requirements_struct_law25 rs
    JOIN "${tenant}".requirements_law25 r ON rs.id = r.requirement_meta_id
    WHERE r.id = :id
    ORDER BY r.created_at DESC, r.id ASC;`,
    {
      replacements: { id: requirementId },
      ...(transaction ? { transaction } : {}),
    }
  )) as [any[], number];

  const requirement = requirements[0][0];
  if (!requirement) {
    return null;
  }

  // Get linked risks
  (requirement as any).risks = [];
  const risks = (await sequelize.query(
    `SELECT projects_risks_id FROM "${tenant}".requirements_law25__risks WHERE requirement_id = :id`,
    {
      replacements: { id: requirementId },
      transaction,
    }
  )) as [{ projects_risks_id: number }[], number];

  for (let risk of risks[0]) {
    (requirement as any).risks.push(risk.projects_risks_id);
  }

  return requirement;
};

/**
 * Get requirement by ID for a specific project
 */
export const getRequirementByIdForProjectLaw25Query = async (
  requirementStructId: number,
  projectFrameworkId: number,
  tenant: string
) => {
  const requirementIdResult = (await sequelize.query(
    `SELECT id FROM "${tenant}".requirements_law25 WHERE requirement_meta_id = :id AND projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: {
        id: requirementStructId,
        projects_frameworks_id: projectFrameworkId,
      },
    }
  )) as [{ id: number }[], number];

  if (!requirementIdResult[0][0]) {
    return null;
  }

  return await getRequirementByIdLaw25Query(requirementIdResult[0][0].id, tenant);
};

/**
 * Create new requirements for a project
 */
export const createNewRequirementsLaw25Query = async (
  projectId: number,
  enable_ai_data_insertion: boolean,
  tenant: string,
  transaction: Transaction,
  is_mock_data: boolean = false
) => {
  // Get project framework ID
  const projectFrameworkId = (await sequelize.query(
    `SELECT id FROM "${tenant}".projects_frameworks WHERE project_id = :project_id AND framework_id = ${LAW25_FRAMEWORK_ID}`,
    {
      replacements: { project_id: projectId },
      transaction,
    }
  )) as [{ id: number }[], number];

  // Get all requirements structure
  const requirementsStruct = (await sequelize.query(
    `SELECT id FROM public.requirements_struct_law25 ORDER BY id;`,
    { transaction }
  )) as [{ id: number }[], number];

  const demoRequirements = getDemoRequirements() as {
    implementation_description: string;
    auditor_feedback: string;
  }[];

  const requirementIds = [];
  let ctr = 0;

  for (let reqStruct of requirementsStruct[0]) {
    const requirementId = (await sequelize.query(
      `INSERT INTO "${tenant}".requirements_law25 (
        requirement_meta_id, projects_frameworks_id, implementation_description, auditor_feedback, status
      ) VALUES (
        :requirement_meta_id, :projects_frameworks_id, :implementation_description, :auditor_feedback, :status
      ) RETURNING id;`,
      {
        replacements: {
          requirement_meta_id: reqStruct.id,
          projects_frameworks_id: projectFrameworkId[0][0].id,
          implementation_description: enable_ai_data_insertion
            ? demoRequirements[ctr].implementation_description
            : null,
          auditor_feedback: enable_ai_data_insertion
            ? demoRequirements[ctr].auditor_feedback
            : null,
          status: is_mock_data
            ? STATUSES[Math.floor(Math.random() * STATUSES.length)]
            : "Not started",
        },
        transaction,
      }
    )) as [{ id: number }[], number];
    requirementIds.push(requirementId[0][0].id);
    ctr++;
  }

  return requirementIds;
};

/**
 * Create Law 25 framework for a project
 */
export const createLaw25FrameworkQuery = async (
  projectId: number,
  enable_ai_data_insertion: boolean,
  tenant: string,
  transaction: Transaction,
  is_mock_data: boolean = false
) => {
  const requirementIds = await createNewRequirementsLaw25Query(
    projectId,
    enable_ai_data_insertion,
    tenant,
    transaction,
    is_mock_data
  );

  return {
    requirements: requirementIds,
  };
};

/**
 * Update a requirement
 */
export const updateRequirementLaw25Query = async (
  id: number,
  requirement: Partial<any>,
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
  // Get current files
  const files = (await sequelize.query(
    `SELECT evidence_links FROM "${tenant}".requirements_law25 WHERE id = :id`,
    {
      replacements: { id },
      transaction,
    }
  )) as [{ evidence_links: any }[], number];

  let currentFiles = (files[0][0]?.evidence_links || []) as {
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

  const updateRequirement: Record<string, any> = { id };
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
        updateRequirement["evidence_links"] = JSON.stringify(currentFiles);
        acc.push(`${field} = :${field}`);
      } else if (requirement[field] !== undefined) {
        let value = requirement[field];

        // Handle empty strings for integer fields
        if (["owner", "reviewer", "approver"].includes(field)) {
          if (value === "" || value === null || value === undefined) {
            return acc;
          }
          const numValue = parseInt(value as string);
          if (isNaN(numValue)) {
            return acc;
          }
          value = numValue;
        }

        if (value === "") {
          return acc;
        }

        updateRequirement[field] = value;
        acc.push(`${field} = :${field}`);
      }
      return acc;
    }, [])
    .join(", ");

  if (setClause.length === 0) {
    return requirement;
  }

  const query = `UPDATE "${tenant}".requirements_law25 SET ${setClause} WHERE id = :id RETURNING *;`;

  const result = (await sequelize.query(query, {
    replacements: updateRequirement,
    transaction,
  })) as [any[], number];

  const requirementResult = result[0][0];
  (requirementResult as any).risks = [];

  // Update risks
  const risksDeletedRaw = JSON.parse(requirement.risksDelete || "[]");
  const risksMitigatedRaw = JSON.parse(requirement.risksMitigated || "[]");

  const risksDeleted = validateRiskArray(risksDeletedRaw, "risksDelete");
  const risksMitigated = validateRiskArray(risksMitigatedRaw, "risksMitigated");

  const risks = (await sequelize.query(
    `SELECT projects_risks_id FROM "${tenant}".requirements_law25__risks WHERE requirement_id = :id`,
    {
      replacements: { id },
      transaction,
    }
  )) as [{ projects_risks_id: number }[], number];

  let currentRisks = risks[0].map((r) => r.projects_risks_id);
  currentRisks = currentRisks.filter((r) => !risksDeleted.includes(r));
  currentRisks = currentRisks.concat(risksMitigated);

  await sequelize.query(
    `DELETE FROM "${tenant}".requirements_law25__risks WHERE requirement_id = :id;`,
    {
      replacements: { id },
      transaction,
    }
  );

  if (currentRisks.length > 0) {
    const placeholders = currentRisks
      .map((_, i) => `(:requirement_id${i}, :projects_risks_id${i})`)
      .join(", ");
    const replacements: Record<string, any> = {};

    currentRisks.forEach((risk, i) => {
      replacements[`requirement_id${i}`] = id;
      replacements[`projects_risks_id${i}`] = risk;
    });

    const risksInsertResult = (await sequelize.query(
      `INSERT INTO "${tenant}".requirements_law25__risks (requirement_id, projects_risks_id) VALUES ${placeholders} RETURNING projects_risks_id;`,
      {
        replacements,
        transaction,
      }
    )) as [{ projects_risks_id: number }[], number];

    for (let risk of risksInsertResult[0]) {
      (requirementResult as any).risks.push(risk.projects_risks_id);
    }
  }

  return requirementResult;
};

/**
 * Delete requirements by project framework ID
 */
export const deleteRequirementsLaw25ByProjectIdQuery = async (
  projectFrameworkId: number,
  tenant: string,
  transaction: Transaction
) => {
  // Delete risks first
  await sequelize.query(
    `DELETE FROM "${tenant}".requirements_law25__risks WHERE requirement_id IN (SELECT id FROM "${tenant}".requirements_law25 WHERE projects_frameworks_id = :projects_frameworks_id)`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      transaction,
    }
  );

  await sequelize.query(
    `DELETE FROM "${tenant}".requirements_law25 WHERE projects_frameworks_id = :projects_frameworks_id`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return true;
};

/**
 * Delete Law 25 framework from a project
 */
export const deleteProjectFrameworkLaw25Query = async (
  projectId: number,
  tenant: string,
  transaction: Transaction
) => {
  const projectFrameworkId = (await sequelize.query(
    `SELECT id FROM "${tenant}".projects_frameworks WHERE project_id = :project_id AND framework_id = ${LAW25_FRAMEWORK_ID}`,
    {
      replacements: { project_id: projectId },
      transaction,
    }
  )) as [{ id: number }[], number];

  if (!projectFrameworkId[0][0]) {
    return false;
  }

  await deleteRequirementsLaw25ByProjectIdQuery(
    projectFrameworkId[0][0].id,
    tenant,
    transaction
  );

  await sequelize.query(
    `DELETE FROM "${tenant}".projects_frameworks WHERE project_id = :project_id AND framework_id = ${LAW25_FRAMEWORK_ID}`,
    {
      replacements: { project_id: projectId },
      type: QueryTypes.DELETE,
      transaction,
    }
  );

  return true;
};

/**
 * Get all risks linked to a Law 25 requirement
 */
export const getRequirementRisksLaw25Query = async (
  requirementId: number,
  tenant: string
): Promise<any[]> => {
  const risks = await sequelize.query(
    `SELECT pr.*
     FROM "${tenant}".risks pr
     INNER JOIN "${tenant}".requirements_law25__risks rlr
       ON pr.id = rlr.projects_risks_id
     WHERE rlr.requirement_id = :requirementId
     ORDER BY pr.id ASC`,
    {
      replacements: { requirementId },
      type: QueryTypes.SELECT,
    }
  );
  return risks as any[];
};
