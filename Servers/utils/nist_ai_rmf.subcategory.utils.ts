import { sequelize } from "../database/db";
import { NISTAIMRFSubcategoryModel } from "../domain.layer/frameworks/NIST-AI-RMF/nist_ai_rmf_subcategory.model";

export const getAllNISTAIRMFSubcategoriesBycategoryIdQuery = async (
  categoryId: string,
  tenant: string
): Promise<NISTAIMRFSubcategoryModel[]> => {
  const subcategories = await sequelize.query(
    `SELECT * FROM "${tenant}".nist_ai_rmf_subcategories WHERE category_id = :categoryId ORDER BY created_at DESC, id ASC`,
    {
      replacements: { categoryId: categoryId },
      mapToModel: true,
      model: NISTAIMRFSubcategoryModel,
    }
  );
  return subcategories;
};
