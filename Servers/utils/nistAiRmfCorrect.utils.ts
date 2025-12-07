import { QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { NISTAIMRFSubcategoryModel } from "../domain.layer/frameworks/NIST-AI-RMF/nist_ai_rmf_subcategory.model";
import { STATUSES } from "../types/status.type";
import { NIST_AI_RMF_Structure } from "../structures/NIST-AI-RMF/nist-ai-rmf.structure";

/**
 * Pre-check function to ensure NIST AI RMF infrastructure exists before starting main transaction
 */
export const ensureNISTAI_RMFDInfrastructure = async (
  tenant: string
): Promise<void> => {
  const setupTransaction = await sequelize.transaction();

  try {
    // 1. Create tenant schema if it doesn't exist
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${tenant}";`, {
      transaction: setupTransaction,
    });

    // 2. Create NIST AI RMF subcategories table in tenant schema matching the exact model structure
    await sequelize.query(
      `
      CREATE TABLE IF NOT EXISTS "${tenant}".nist_ai_rmf_subcategories (
        id SERIAL PRIMARY KEY,
        subcategory_meta_id INTEGER NOT NULL,
        projects_frameworks_id INTEGER NOT NULL,
        index INTEGER,
        title VARCHAR(255),
        description TEXT,
        implementation_description TEXT,
        category_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_demo BOOLEAN DEFAULT FALSE,
        status VARCHAR(255) DEFAULT 'Not started',
        auditor_feedback TEXT,
        owner INTEGER,
        reviewer INTEGER,
        approver INTEGER,
        due_date DATE,
        evidence_links JSONB,
        tags TEXT[]
      );
    `,
      { transaction: setupTransaction }
    );

    await setupTransaction.commit();
    console.log(
      `[NIST AI RMF Utils] Infrastructure setup completed for tenant ${tenant}`
    );
  } catch (error) {
    await setupTransaction.rollback();
    console.error(
      `[NIST AI RMF Utils] Infrastructure setup failed for tenant ${tenant}:`,
      error
    );
    throw error;
  }
};

/**
 * Count total and completed subcategories for a project
 */
export const countSubcategoriesNISTByProjectId = async (
  projectFrameworkId: number,
  tenant: string
): Promise<{
  totalSubcategories: string;
  doneSubcategories: string;
}> => {
  const result = (await sequelize.query(
    `SELECT COUNT(*) AS "totalSubcategories", SUM(CASE WHEN status = 'Implemented' THEN 1 ELSE 0 END) AS "doneSubcategories"
     FROM "${tenant}".nist_ai_rmf_subcategories
     WHERE projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }
  )) as [{ totalSubcategories: string; doneSubcategories: string }[], number];
  return result[0][0];
};

/**
 * Count assigned subcategories for a project
 */
export const countSubcategoryAssignmentsNISTByProjectId = async (
  projectFrameworkId: number,
  tenant: string
): Promise<{
  totalSubcategories: string;
  assignedSubcategories: string;
}> => {
  const result = (await sequelize.query(
    `SELECT
       COUNT(*) AS "totalSubcategories",
       SUM(CASE WHEN owner IS NOT NULL THEN 1 ELSE 0 END) AS "assignedSubcategories"
     FROM "${tenant}".nist_ai_rmf_subcategories
     WHERE projects_frameworks_id = :projects_frameworks_id;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
    }
  )) as [
    { totalSubcategories: string; assignedSubcategories: string }[],
    number,
  ];

  return result[0][0];
};

/**
 * Get all functions with their categories
 */
export const getAllFunctionsWithCategoriesQuery = async (
  tenant: string,
  transaction: Transaction | null = null
) => {
  const functions = (await sequelize.query(
    `SELECT * FROM public.nist_ai_rmf_functions ORDER BY index;`,
    {
      mapToModel: true,
      ...(transaction ? { transaction } : {}),
    }
  )) as [any[], number];

  for (let func of functions[0]) {
    const categories = (await sequelize.query(
      `SELECT nc.id, nc.title, nc.description, nc.index, ns.status, ns.owner
       FROM public.nist_ai_rmf_categories nc
       LEFT JOIN "${tenant}".nist_ai_rmf_subcategories ns
         ON nc.id = (SELECT category_id FROM public.nist_ai_rmf_subcategories WHERE id = ns.subcategory_meta_id LIMIT 1)
       WHERE nc.function_id = :id
       ORDER BY nc.index;`,
      {
        replacements: { id: func.id },
        mapToModel: true,
        ...(transaction ? { transaction } : {}),
      }
    )) as [any[], number];

    func.categories = categories[0];
  }
  return functions[0];
};

/**
 * Get all categories with subcategories for a project
 */
export const getAllCategoriesWithSubcategoriesQuery = async (
  projectFrameworkId: number,
  tenant: string,
  transaction: Transaction | null = null
) => {
  const subcategories = (await sequelize.query(
    `SELECT ns.id as id, ns.title as title, ns.description as description, ns.implementation_description as implementation_description, ns.index as index,
            ns.category_id as category_id, nc.title as category_title, nc.description as category_description,
            ns.status, ns.owner, ns.reviewer, ns.approver, ns.due_date,
            ns.auditor_feedback, ns.evidence_links, ns.projects_frameworks_id, ns.created_at, ns.is_demo
       FROM "${tenant}".nist_ai_rmf_subcategories ns
       JOIN public.nist_ai_rmf_categories nc ON ns.category_id = nc.id
       WHERE ns.projects_frameworks_id = :projects_frameworks_id
       ORDER BY nc.function_id, nc.index, ns.index;`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      mapToModel: false,
      ...(transaction ? { transaction } : {}),
    }
  )) as [any[], number];

  return subcategories[0];
};

/**
 * Get a specific subcategory by ID
 */
export const getSubcategoryByIdQuery = async (
  subcategoryId: number,
  tenant: string,
  transaction: Transaction | null = null
) => {
  const subcategory = (await sequelize.query(
    `SELECT
      ns.title AS title,
      ns.description AS description,
      ns.implementation_description AS implementation_description,
      ns.index AS index,
      ns.id AS id,
      ns.status AS status,
      ns.owner AS owner,
      ns.reviewer AS reviewer,
      ns.approver AS approver,
      ns.due_date AS due_date,
      ns.auditor_feedback AS auditor_feedback,
      ns.evidence_links AS evidence_links,
      ns.created_at AS created_at,
      ns.updated_at AS updated_at
    FROM "${tenant}".nist_ai_rmf_subcategories ns
    WHERE ns.id = :id;`,
    {
      replacements: { id: subcategoryId },
      ...(transaction ? { transaction } : {}),
    }
  )) as [any[], number];

  const result = subcategory[0][0];
  return result;
};

/**
 * Create NIST AI RMF framework for a project
 */
export const createNISTAI_RMFFrameworkQuery = async (
  projectId: number,
  _enable_ai_data_insertion: boolean,
  tenant: string,
  transaction: Transaction,
  is_mock_data: boolean = false
) => {
  const projectFrameworkId = (await sequelize.query(
    `SELECT id FROM "${tenant}".projects_frameworks WHERE project_id = :project_id AND framework_id = 4`,
    {
      replacements: { project_id: projectId },
      transaction,
    }
  )) as [{ id: number }[], number];

  const subcategoryIds = await createNewSubcategoriesQuery(
    projectFrameworkId[0][0].id,
    tenant,
    transaction,
    is_mock_data
  );

  return {
    subcategoryIds,
  };
};

/**
 * Create new subcategories for a project using description from structure
 */
export const createNewSubcategoriesQuery = async (
  projectFrameworkId: number,
  tenant: string,
  transaction: Transaction,
  is_mock_data: boolean
) => {
  const subcategoryIds = [];
  let subcategoryMetaId = 1;

  // Get all categories from the database to map structure categories to DB IDs
  const dbCategories = (await sequelize.query(
    `SELECT id, title, index, function_id FROM public.nist_ai_rmf_categories ORDER BY function_id, index;`,
    {
      type: QueryTypes.SELECT,
      transaction,
    }
  )) as Array<{ id: number; title: string; index: number; function_id: number }>;

  let categoryIndex = 0;

  // Get all subcategories from the NIST AI RMF structure
  for (let func of NIST_AI_RMF_Structure.functions) {
    for (let category of func.categories) {
      const currentCategory = dbCategories[categoryIndex];

      for (let subcategory of category.subcategories) {
        const subcategoryId = (await sequelize.query(
          `INSERT INTO "${tenant}".nist_ai_rmf_subcategories (
            subcategory_meta_id, projects_frameworks_id, index, title, description, category_id, status, is_demo
          ) VALUES (
            :subcategory_meta_id, :projects_frameworks_id, :index, :title, :description, :category_id, :status, :is_demo
          ) RETURNING id;`,
          {
            replacements: {
              subcategory_meta_id: subcategoryMetaId,
              projects_frameworks_id: projectFrameworkId,
              index: subcategory.index,
              title: subcategory.title || `${func.type}.${category.index}.${subcategory.index}`,
              description: subcategory.description, // Use description from structure
              category_id: currentCategory.id,
              status: is_mock_data
                ? STATUSES[Math.floor(Math.random() * STATUSES.length)]
                : "Not started",
              is_demo: is_mock_data,
            },
            transaction,
          }
        )) as [{ id: number }[], number];

        subcategoryIds.push(subcategoryId[0][0].id);
        subcategoryMetaId++;
      }
      categoryIndex++;
    }
  }

  return subcategoryIds;
};

/**
 * Update a subcategory implementation
 */
export const updateSubcategoryQuery = async (
  id: number,
  subcategory: Partial<NISTAIMRFSubcategoryModel>,
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
    `SELECT evidence_links FROM "${tenant}".nist_ai_rmf_subcategories WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: NISTAIMRFSubcategoryModel,
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

  const updateSubcategory: Partial<
    Record<keyof NISTAIMRFSubcategoryModel, any>
  > = { id };
  const setClause = [
    "description",
    "implementation_description",
    "evidence_links",
    "status",
    "owner",
    "reviewer",
    "approver",
    "due_date",
    "auditor_feedback",
    "tags",
  ]
    .reduce((acc: string[], field) => {
      if (field === "evidence_links") {
        updateSubcategory["evidence_links"] = JSON.stringify(currentFiles);
        acc.push(`${field} = :${field}`);
      } else if (
        subcategory[field as keyof NISTAIMRFSubcategoryModel] != undefined
      ) {
        let value = subcategory[field as keyof NISTAIMRFSubcategoryModel];

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

        updateSubcategory[field as keyof NISTAIMRFSubcategoryModel] = value;
        acc.push(`${field} = :${field}`);
      }
      return acc;
    }, [])
    .join(", ");

  if (setClause.length === 0) {
    return subcategory as NISTAIMRFSubcategoryModel;
  }

  const query = `UPDATE "${tenant}".nist_ai_rmf_subcategories SET ${setClause}, updated_at = NOW() WHERE id = :id RETURNING *;`;

  updateSubcategory.id = id;

  const result = (await sequelize.query(query, {
    replacements: updateSubcategory,
    transaction,
  })) as [NISTAIMRFSubcategoryModel[], number];

  return result[0][0];
};

/**
 * Delete subcategories for a project
 */
export const deleteSubcategoriesNISTByProjectIdQuery = async (
  projectFrameworkId: number,
  tenant: string,
  transaction: Transaction
) => {
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".nist_ai_rmf_subcategories WHERE projects_frameworks_id = :projects_frameworks_id RETURNING *`,
    {
      replacements: { projects_frameworks_id: projectFrameworkId },
      mapToModel: true,
      model: NISTAIMRFSubcategoryModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0;
};

/**
 * Delete NIST AI RMF project framework
 */
export const deleteProjectFrameworkNISTQuery = async (
  projectId: number,
  tenant: string,
  transaction: Transaction
) => {
  const projectFrameworkId = (await sequelize.query(
    `SELECT id FROM "${tenant}".projects_frameworks WHERE project_id = :project_id AND framework_id = 4`,
    {
      replacements: { project_id: projectId },
      transaction,
      type: QueryTypes.SELECT,
    }
  )) as Array<{ id: number }>;

  // Check if the project has a NIST AI RMF framework before trying to delete subcategories
  if (projectFrameworkId && projectFrameworkId.length > 0) {
    await deleteSubcategoriesNISTByProjectIdQuery(
      projectFrameworkId[0].id,
      tenant,
      transaction
    );
  }

  const result = await sequelize.query(
    `DELETE FROM "${tenant}".projects_frameworks WHERE project_id = :project_id AND framework_id = 4 RETURNING *`,
    {
      replacements: { project_id: projectId },
      transaction,
    }
  );
  return result.length > 0;
};