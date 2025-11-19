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
    "evidence_links",
    "tags",
  ]
    .filter((f) => {
      if (f === "evidence_links") {
        updateSubcategory["evidence_links"] = JSON.stringify(
          subcategory.evidence_links
        );
        return true;
      }
      if (f === "tags") {
        updateSubcategory["tags"] = subcategory.tags;
        return true;
      }
      if (
        subcategory[f as keyof NISTAIMRFSubcategoryModel] !== undefined &&
        subcategory[f as keyof NISTAIMRFSubcategoryModel]
      ) {
        updateSubcategory[f as keyof NISTAIMRFSubcategoryModel] =
          subcategory[f as keyof NISTAIMRFSubcategoryModel];
        return true;
      }
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");

  const query = `UPDATE "${tenant}".nist_ai_rmf_subcategories SET ${setClause}, updated_at = NOW() WHERE id = :id RETURNING *;`;

  updateSubcategory.id = id;

  const result = (await sequelize.query(query, {
    replacements: updateSubcategory,
    transaction,
  })) as [NISTAIMRFSubcategoryModel[], number];
  return result[0][0] as NISTAIMRFSubcategoryModel;
};
