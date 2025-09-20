import { ModelRiskModel } from "../domain.layer/models/modelRisk/modelRisk.model";
import { IModelRisk } from "../domain.layer/interfaces/i.modelRisk";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";

/**
 * Get all model risks for a tenant
 */
export async function getAllModelRisksQuery(tenantId: number): Promise<ModelRiskModel[]> {
  try {
    const modelRisks = await ModelRiskModel.findAll({
      where: { tenantId },
      order: [['created_at', 'DESC']],
      attributes: [
        'id',
        'riskName',
        'riskCategory',
        'riskLevel',
        'status',
        'owner',
        'targetDate',
        'description',
        'mitigationPlan',
        'impact',
        'likelihood',
        'keyMetrics',
        'currentValues',
        'threshold',
        'modelId',
        'modelName',
        'tenantId',
        'created_at',
        'updated_at'
      ],
    });
    return modelRisks;
  } catch (error) {
    throw new ValidationException(
      `Failed to retrieve model risks: ${error}`,
      "getAllModelRisks",
      error
    );
  }
}

/**
 * Get a model risk by ID
 */
export async function getModelRiskByIdQuery(
  id: number,
  tenantId: number
): Promise<ModelRiskModel | null> {
  try {
    const modelRisk = await ModelRiskModel.findOne({
      where: { id, tenantId },
    });
    return modelRisk;
  } catch (error) {
    throw new ValidationException(
      `Failed to retrieve model risk: ${error}`,
      "getModelRiskById",
      error
    );
  }
}

/**
 * Create a new model risk
 */
export async function createNewModelRiskQuery(
  data: Partial<IModelRisk>,
  tenantId: number
): Promise<ModelRiskModel> {
  try {
    const modelRiskData = {
      ...data,
      tenantId,
    };

    const modelRisk = ModelRiskModel.createNewModelRisk(modelRiskData);
    await modelRisk.validateModelRiskData();
    await modelRisk.save();
    return modelRisk;
  } catch (error) {
    throw new ValidationException(
      `Failed to create model risk: ${error}`,
      "createNewModelRisk",
      error
    );
  }
}

/**
 * Update a model risk by ID
 */
export async function updateModelRiskByIdQuery(
  id: number,
  data: Partial<IModelRisk>,
  tenantId: number
): Promise<ModelRiskModel | null> {
  try {
    const modelRisk = await ModelRiskModel.findOne({
      where: { id, tenantId },
    });

    if (!modelRisk) {
      return null;
    }

    // Use update method instead of save to avoid INSERT
    const updatedData = { ...data, updated_at: new Date() };

    await ModelRiskModel.update(updatedData, {
      where: { id, tenantId },
    });

    // Fetch the updated record
    const updatedModelRisk = await ModelRiskModel.findOne({
      where: { id, tenantId },
    });

    return updatedModelRisk;
  } catch (error) {
    throw new ValidationException(
      `Failed to update model risk: ${error}`,
      "updateModelRiskById",
      error
    );
  }
}

/**
 * Delete a model risk by ID
 */
export async function deleteModelRiskByIdQuery(
  id: number,
  tenantId: number
): Promise<boolean> {
  try {
    const result = await ModelRiskModel.destroy({
      where: { id, tenantId },
    });
    return result > 0;
  } catch (error) {
    throw new ValidationException(
      `Failed to delete model risk: ${error}`,
      "deleteModelRiskById",
      error
    );
  }
}