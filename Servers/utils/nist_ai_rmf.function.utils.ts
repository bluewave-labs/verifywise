import { sequelize } from "../database/db";
import { NISTAIMRFFunctionModel } from "../domain.layer/frameworks/NIST-AI-RMF/nist_ai_rmf_function.model";

export const getAllNISTAIRMFfunctionsQuery = async (
  tenant: string
): Promise<NISTAIMRFFunctionModel[]> => {
  const functions = await sequelize.query(
    `SELECT * FROM "${tenant}".nist_ai_rmf_functions ORDER BY created_at DESC, id ASC`,
    {
      mapToModel: true,
      model: NISTAIMRFFunctionModel,
    }
  );
  return functions;
};
