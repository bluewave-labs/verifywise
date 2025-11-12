import { sequelize } from "../database/db";
import { NISTAIMRFCategoryModel } from "../domain.layer/frameworks/NIST-AI-RMF/nist_ai_rmf_category.model";

export const getAllNISTAIRMFCategoriesByfunctionIdQuery = async (
  functionId: string,
  tenant: string
): Promise<NISTAIMRFCategoryModel[]> => {
  const categories = await sequelize.query(
    `SELECT * FROM "${tenant}".nist_ai_rmf_categories WHERE function_id = :functionId ORDER BY created_at DESC, id ASC`,
    {
      replacements: { functionId: functionId },
      mapToModel: true,
      model: NISTAIMRFCategoryModel,
    }
  );
  return categories;
};
