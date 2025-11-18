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
