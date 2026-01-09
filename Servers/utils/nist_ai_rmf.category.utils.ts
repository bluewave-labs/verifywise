import { sequelize } from "../database/db";
import { NISTAIMRFCategoryModel } from "../domain.layer/frameworks/NIST-AI-RMF/nist_ai_rmf_category.model";

export const getAllNISTAIRMFCategoriesBytitleQuery = async (
  title: string,
  _tenant: string
): Promise<NISTAIMRFCategoryModel[]> => {
  const categories = await sequelize.query(
    `SELECT * FROM "public".nist_ai_rmf_categories WHERE title = :title ORDER BY created_at DESC, id ASC`,
    {
      replacements: { title: title },
      mapToModel: true,
      model: NISTAIMRFCategoryModel,
    }
  );
  return categories;
};
