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

export const updateNISTAIRMFSubcategoryByIdQuery = async (
  id: number,
  subcategory: Partial<NISTAIMRFSubcategoryModel>,
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
  return result[0][0] as NISTAIMRFSubcategoryModel;
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
