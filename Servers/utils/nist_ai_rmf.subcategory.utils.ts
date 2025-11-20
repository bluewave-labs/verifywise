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
  subcategory: NISTAIMRFSubcategoryModel,
  tenant: string,
  transaction: Transaction
) => {
  const updateSubcategory: Partial<
    Record<keyof NISTAIMRFSubcategoryModel, any>
  > = {};
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
  ]
    .filter((f) => {
      if (f === "tags") {
        // Handle tags array specifically
        const tags = subcategory[f as keyof NISTAIMRFSubcategoryModel] as string[];
        if (tags !== undefined && tags !== null) {
          // For empty arrays, use PostgreSQL explicit type casting
          if (tags.length === 0) {
            updateSubcategory[f as keyof NISTAIMRFSubcategoryModel] = [];
            return `${f} = ARRAY[]::TEXT[]`;  // Explicit type for empty array
          } else {
            updateSubcategory[f as keyof NISTAIMRFSubcategoryModel] = tags;
            return `${f} = ARRAY[:${f}]`;  // Array with content
          }
        }
        return false;
      }

      // Handle other fields
      if (
        subcategory[f as keyof NISTAIMRFSubcategoryModel] !== undefined &&
        subcategory[f as keyof NISTAIMRFSubcategoryModel] !== null &&
        subcategory[f as keyof NISTAIMRFSubcategoryModel] !== ""
      ) {
        updateSubcategory[f as keyof NISTAIMRFSubcategoryModel] =
          subcategory[f as keyof NISTAIMRFSubcategoryModel];
        return true;
      }
      return false;
    })
    .map((f) => {
      if (f === "tags") {
        const tags = subcategory[f as keyof NISTAIMRFSubcategoryModel] as string[];
        if (tags && tags.length === 0) {
          return `${f} = ARRAY[]::TEXT[]`;  // Already handled in filter
        } else {
          return `${f} = ARRAY[:${f}]`;
        }
      }
      return `${f} = :${f}`;
    })
    .join(", ");

  const query = `UPDATE "${tenant}".nist_ai_rmf_subcategories SET ${setClause}, updated_at = NOW() WHERE id = :id RETURNING *;`;

  updateSubcategory.id = id;

  const result = (await sequelize.query(query, {
    replacements: updateSubcategory,
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
    "Needs rework"
  ];

  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status value: ${status}. Must be one of: ${validStatuses.join(", ")}`);
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
