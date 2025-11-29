import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { NISTAIMRFSubcategoryModel } from "../domain.layer/frameworks/NIST-AI-RMF/nist_ai_rmf_subcategory.model";

export const getAllNISTAIRMFSubcategoriesBycategoryIdAndtitleQuery = async (
  categoryId: number,
  title: string,
  tenant: string
): Promise<NISTAIMRFSubcategoryModel[]> => {
  const subcategories = await sequelize.query(
    `SELECT * FROM "${tenant}".nist_ai_rmf_subcategories WHERE category_id = :categoryId AND title = :title ORDER BY created_at DESC, id ASC`,
    {
      replacements: { categoryId: categoryId, title: title },
      mapToModel: true,
      model: NISTAIMRFSubcategoryModel,
    }
  );
  return subcategories;
};

export const getNISTAIRMFSubcategoryByIdQuery = async (
  id: number,
  tenant: string
) => {
  const subcategory = await sequelize.query(
    `SELECT * FROM "${tenant}".nist_ai_rmf_subcategories WHERE id = :id`,
    {
      replacements: { id: id },
      mapToModel: true,
      model: NISTAIMRFSubcategoryModel,
    }
  );
  return subcategory[0];
};

/**
 * Get all risks linked to a NIST AI RMF subcategory
 */
export const getNISTAIRMFSubcategoryRisksQuery = async (
  subcategoryId: number,
  tenant: string
): Promise<any[]> => {
  const risks = await sequelize.query(
    `SELECT pr.*
     FROM "${tenant}".risks pr
     INNER JOIN "${tenant}".nist_ai_rmf_subcategories__risks nsr
       ON pr.id = nsr.projects_risks_id
     WHERE nsr.nist_ai_rmf_subcategory_id = :subcategoryId
     ORDER BY pr.id ASC`,
    {
      replacements: { subcategoryId },
    }
  );
  return risks[0] as any[];
};

// Helper function to validate risk array (copied from ISO 27001 pattern)
const validateRiskArray = (arr: any[], fieldName: string): number[] => {
  if (!Array.isArray(arr)) {
    throw new Error(`${fieldName} must be an array`);
  }
  return arr.map((item, index) => {
    const num = typeof item === "string" ? parseInt(item, 10) : item;
    if (typeof num !== "number" || isNaN(num) || !Number.isInteger(num)) {
      throw new Error(`${fieldName}[${index}] must be a valid integer`);
    }
    return num;
  });
};

export const updateNISTAIRMFSubcategoryByIdQuery = async (
  id: number,
  subcategory: Partial<NISTAIMRFSubcategoryModel> & {
    risksDelete?: string;
    risksMitigated?: string;
  },
  uploadedFiles: {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: string;
    type: string;
    source: string;
  }[] = [],
  deletedFiles: string[] = [],
  tenant: string,
  transaction: Transaction
) => {
  const updateFields: Partial<Record<keyof NISTAIMRFSubcategoryModel, any>> =
    {};
  // Get current evidence_links for this subcategory
  const currentCategoryFiles = await sequelize.query(
    `SELECT evidence_links FROM "${tenant}".nist_ai_rmf_subcategories WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: NISTAIMRFSubcategoryModel,
      transaction,
    }
  );

  let currentFiles = (
    currentCategoryFiles[0]?.evidence_links
      ? currentCategoryFiles[0].evidence_links
      : []
  ) as {
    id: string;
    fileName: string;
    project_id: number;
    uploaded_by: number;
    uploaded_time: string;
    type: string;
    source: string;
  }[];

  // Filter out deleted files
  currentFiles = currentFiles.filter((f) => !deletedFiles.includes(f.id));

  // Add new uploaded files
  currentFiles = currentFiles.concat(uploadedFiles);
  const setClause = [
    "title",
    "description",
    "implementation_description",
    "status",
    "owner",
    "reviewer",
    "approver",
    "due_date",
    "auditor_feedback",
    "tags",
    "evidence_links",
  ]
    .filter((f) => {
      if (f === "tags") {
        // Handle tags array specifically
        const tags = subcategory[
          f as keyof NISTAIMRFSubcategoryModel
        ] as string[];
        if (tags !== undefined && tags !== null) {
          // For empty arrays, use PostgreSQL explicit type casting
          if (tags.length === 0) {
            updateFields[f as keyof NISTAIMRFSubcategoryModel] = [];
            return `${f} = ARRAY[]::TEXT[]`; // Explicit type for empty array
          } else {
            updateFields[f as keyof NISTAIMRFSubcategoryModel] = tags;
            return `${f} = ARRAY[:${f}]`; // Array with content
          }
        }
        return false;
      }

      if (f === "evidence_links") {
        // Handle evidence_links array specifically - use the combined files
        // Must stringify for JSONB fields in PostgreSQL
        updateFields[f as keyof NISTAIMRFSubcategoryModel] =
          JSON.stringify(currentFiles);
        return `${f} = :${f}`; // JSONB field - Sequelize handles the casting
      }

      // Handle other fields
      if (
        subcategory[f as keyof NISTAIMRFSubcategoryModel] !== undefined &&
        subcategory[f as keyof NISTAIMRFSubcategoryModel] !== null &&
        subcategory[f as keyof NISTAIMRFSubcategoryModel] !== ""
      ) {
        let value = subcategory[f as keyof NISTAIMRFSubcategoryModel];

        // Handle empty strings for integer fields (owner, reviewer, approver)
        if (["owner", "reviewer", "approver"].includes(f)) {
          if (value === "" || value === null || value === undefined) {
            return false; // Skip this field if it's empty
          }
          const numValue = parseInt(value as string);
          if (isNaN(numValue)) {
            return false; // Skip this field if it's not a valid number
          }
          value = numValue;
        }

        updateFields[f as keyof NISTAIMRFSubcategoryModel] = value;
        return true;
      }
      return false;
    })
    .map((f) => {
      if (f === "tags") {
        const tags = subcategory[
          f as keyof NISTAIMRFSubcategoryModel
        ] as string[];
        if (tags && tags.length === 0) {
          return `${f} = ARRAY[]::TEXT[]`; // Already handled in filter
        } else {
          return `${f} = ARRAY[:${f}]`;
        }
      }
      if (f === "evidence_links") {
        return `${f} = :${f}`; // Already handled in filter
      }
      return `${f} = :${f}`;
    })
    .join(", ");

  const query = `UPDATE "${tenant}".nist_ai_rmf_subcategories SET ${setClause}, updated_at = NOW() WHERE id = :id RETURNING *;`;

  updateFields.id = id;

  const result = (await sequelize.query(query, {
    replacements: updateFields,
    transaction,
  })) as [NISTAIMRFSubcategoryModel[], number];

  const subcategoryResult = result[0][0] as NISTAIMRFSubcategoryModel & { risks: number[] };
  (subcategoryResult as any).risks = [];

  // Handle risk linking (following ISO 27001 pattern)
  const risksDeletedRaw = JSON.parse(subcategory.risksDelete || "[]");
  const risksMitigatedRaw = JSON.parse(subcategory.risksMitigated || "[]");

  // Validate that both arrays contain only valid integers
  const risksDeleted = validateRiskArray(risksDeletedRaw, "risksDelete");
  const risksMitigated = validateRiskArray(risksMitigatedRaw, "risksMitigated");

  // Get current risks for this subcategory
  const risks = (await sequelize.query(
    `SELECT projects_risks_id FROM "${tenant}".nist_ai_rmf_subcategories__risks WHERE nist_ai_rmf_subcategory_id = :id`,
    {
      replacements: { id },
      transaction,
    }
  )) as [{ projects_risks_id: number }[], number];

  let currentRisks = risks[0].map((r) => r.projects_risks_id);
  currentRisks = currentRisks.filter((r) => !risksDeleted.includes(r));
  currentRisks = currentRisks.concat(risksMitigated);

  // Remove duplicates
  currentRisks = [...new Set(currentRisks)];

  // Delete old associations
  await sequelize.query(
    `DELETE FROM "${tenant}".nist_ai_rmf_subcategories__risks WHERE nist_ai_rmf_subcategory_id = :id;`,
    {
      replacements: { id },
      transaction,
    }
  );

  // Insert new associations
  if (currentRisks.length > 0) {
    const placeholders = currentRisks
      .map((_, i) => `(:subcategory_id${i}, :projects_risks_id${i})`)
      .join(", ");
    const replacements: { [key: string]: any } = {};

    currentRisks.forEach((risk, i) => {
      replacements[`subcategory_id${i}`] = id;
      replacements[`projects_risks_id${i}`] = risk;
    });

    const subCategoryRisksInsertResult = (await sequelize.query(
      `INSERT INTO "${tenant}".nist_ai_rmf_subcategories__risks (nist_ai_rmf_subcategory_id, projects_risks_id) VALUES ${placeholders} RETURNING projects_risks_id;`,
      {
        replacements,
        transaction,
      }
    )) as [{ projects_risks_id: number }[], number];

    for (const risk of subCategoryRisksInsertResult[0]) {
      (subcategoryResult as any).risks.push(risk.projects_risks_id);
    }

    // Add NIST AI RMF framework (id=4) to applicable_frameworks for all linked risks
    // This runs within the same transaction, so it will roll back if the save fails
    const NIST_AI_RMF_FRAMEWORK_ID = 4;
    for (const riskId of currentRisks) {
      // Check if the framework association already exists
      const existingAssoc = await sequelize.query(
        `SELECT 1 FROM "${tenant}".frameworks_risks WHERE risk_id = :riskId AND framework_id = :frameworkId`,
        {
          replacements: { riskId, frameworkId: NIST_AI_RMF_FRAMEWORK_ID },
          transaction,
        }
      );

      // Only insert if association doesn't exist
      if ((existingAssoc[0] as any[]).length === 0) {
        await sequelize.query(
          `INSERT INTO "${tenant}".frameworks_risks (risk_id, framework_id) VALUES (:riskId, :frameworkId)`,
          {
            replacements: { riskId, frameworkId: NIST_AI_RMF_FRAMEWORK_ID },
            transaction,
          }
        );
      }
    }
  }

  return subcategoryResult;
};

/**
 * Count total and completed subcategories for NIST AI RMF framework
 * A subcategory is considered "done" when its status is "Implemented"
 */
export const countNISTAIRMFSubcategoriesProgress = async (
  tenant: string
): Promise<{
  totalSubcategories: number;
  doneSubcategories: number;
}> => {
  const result = (await sequelize.query(
    `SELECT
      COUNT(*) AS "totalSubcategories",
      SUM(CASE WHEN status = 'Implemented' THEN 1 ELSE 0 END) AS "doneSubcategories"
    FROM "${tenant}".nist_ai_rmf_subcategories`,
    {}
  )) as [{ totalSubcategories: string; doneSubcategories: string }[], number];

  return {
    totalSubcategories: parseInt(result[0][0].totalSubcategories) || 0,
    doneSubcategories: parseInt(result[0][0].doneSubcategories) || 0,
  };
};

/**
 * Count total and assigned subcategories for NIST AI RMF framework
 * A subcategory is considered "assigned" when it has an owner
 */
export const countNISTAIRMFSubcategoriesAssignments = async (
  tenant: string
): Promise<{
  totalSubcategories: number;
  assignedSubcategories: number;
}> => {
  const result = (await sequelize.query(
    `SELECT
      COUNT(*) AS "totalSubcategories",
      SUM(CASE WHEN owner IS NOT NULL THEN 1 ELSE 0 END) AS "assignedSubcategories"
    FROM "${tenant}".nist_ai_rmf_subcategories`,
    {}
  )) as [{ totalSubcategories: string; assignedSubcategories: string }[], number];

  return {
    totalSubcategories: parseInt(result[0][0].totalSubcategories) || 0,
    assignedSubcategories: parseInt(result[0][0].assignedSubcategories) || 0,
  };
};

/**
 * Get status breakdown for NIST AI RMF subcategories
 */
export const getNISTAIRMFSubcategoriesStatusBreakdown = async (
  tenant: string
): Promise<{
  notStarted: number;
  draft: number;
  inProgress: number;
  awaitingReview: number;
  awaitingApproval: number;
  implemented: number;
  needsRework: number;
}> => {
  const result = (await sequelize.query(
    `SELECT
      SUM(CASE WHEN status = 'Not started' OR status IS NULL THEN 1 ELSE 0 END) AS "notStarted",
      SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) AS "draft",
      SUM(CASE WHEN status = 'In progress' THEN 1 ELSE 0 END) AS "inProgress",
      SUM(CASE WHEN status = 'Awaiting review' THEN 1 ELSE 0 END) AS "awaitingReview",
      SUM(CASE WHEN status = 'Awaiting approval' THEN 1 ELSE 0 END) AS "awaitingApproval",
      SUM(CASE WHEN status = 'Implemented' THEN 1 ELSE 0 END) AS "implemented",
      SUM(CASE WHEN status = 'Needs rework' THEN 1 ELSE 0 END) AS "needsRework"
    FROM "${tenant}".nist_ai_rmf_subcategories`,
    {}
  )) as [
    {
      notStarted: string;
      draft: string;
      inProgress: string;
      awaitingReview: string;
      awaitingApproval: string;
      implemented: string;
      needsRework: string;
    }[],
    number
  ];

  return {
    notStarted: parseInt(result[0][0].notStarted) || 0,
    draft: parseInt(result[0][0].draft) || 0,
    inProgress: parseInt(result[0][0].inProgress) || 0,
    awaitingReview: parseInt(result[0][0].awaitingReview) || 0,
    awaitingApproval: parseInt(result[0][0].awaitingApproval) || 0,
    implemented: parseInt(result[0][0].implemented) || 0,
    needsRework: parseInt(result[0][0].needsRework) || 0,
  };
};

/**
 * Get all NIST AI RMF functions with their categories and subcategories for dashboard overview
 */
export const getNISTAIRMFDashboardOverview = async (
  tenant: string
): Promise<{
  functions: {
    id: number;
    type: string;
    title: string;
    categories: {
      id: number;
      title: string;
      subcategories: {
        id: number;
        title: string;
        status: string;
        owner: number | null;
      }[];
    }[];
  }[];
}> => {
  // Get all functions (from public schema)
  const functions = (await sequelize.query(
    `SELECT id, type, title FROM public.nist_ai_rmf_functions ORDER BY index ASC, id ASC`,
    {}
  )) as [{ id: number; type: string; title: string }[], number];

  // Get all categories (from public schema)
  const categories = (await sequelize.query(
    `SELECT id, title, function_id FROM public.nist_ai_rmf_categories ORDER BY index ASC, id ASC`,
    {}
  )) as [{ id: number; title: string; function_id: number }[], number];

  // Get all subcategories (from tenant schema)
  const subcategories = (await sequelize.query(
    `SELECT id, title, status, owner, category_id FROM "${tenant}".nist_ai_rmf_subcategories ORDER BY index ASC, id ASC`,
    {}
  )) as [{ id: number; title: string; status: string; owner: number | null; category_id: number }[], number];

  // Build the nested structure
  const result = functions[0].map((func) => ({
    id: func.id,
    type: func.type,
    title: func.title,
    categories: categories[0]
      .filter((cat) => cat.function_id === func.id)
      .map((cat) => ({
        id: cat.id,
        title: cat.title,
        subcategories: subcategories[0]
          .filter((sub) => sub.category_id === cat.id)
          .map((sub) => ({
            id: sub.id,
            title: sub.title,
            status: sub.status || 'Not started',
            owner: sub.owner,
          })),
      })),
  }));

  return { functions: result };
};

export const updateNISTAIRMFSubcategoryStatusByIdQuery = async (
  id: number,
  status: string,
  tenant: string,
  transaction: Transaction
): Promise<NISTAIMRFSubcategoryModel> => {
  // Validate status against allowed values from the frontend StatusDropdown component
  const validStatuses = [
    "Not started",
    "Draft",
    "In progress",
    "Awaiting review",
    "Awaiting approval",
    "Implemented",
    "Needs rework",
  ];

  if (!validStatuses.includes(status)) {
    throw new Error(
      `Invalid status value: ${status}. Must be one of: ${validStatuses.join(", ")}`
    );
  }

  const query = `
    UPDATE "${tenant}".nist_ai_rmf_subcategories
    SET status = :status, updated_at = NOW()
    WHERE id = :id
    RETURNING *
  `;

  const result = (await sequelize.query(query, {
    replacements: { id, status },
    transaction,
    mapToModel: true,
    model: NISTAIMRFSubcategoryModel,
  })) as unknown as [NISTAIMRFSubcategoryModel[], number];

  return result[0][0] as NISTAIMRFSubcategoryModel;
};
