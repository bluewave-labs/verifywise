import { ModelRiskModel } from "../domain.layer/models/modelRisk/modelRisk.model";
import { IModelRisk } from "../domain.layer/interfaces/i.modelRisk";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";
import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";

/**
 * Get all model risks for a tenant
 */
export async function getAllModelRisksQuery(
  tenant: string,
  filter: 'active' | 'deleted' | 'all' = 'active'
): Promise<ModelRiskModel[]> {
  let whereClause = '';
  switch (filter) {
    case 'active':
      whereClause = 'WHERE is_deleted = false';
      break;
    case 'deleted':
      whereClause = 'WHERE is_deleted = true';
      break;
    case 'all':
      whereClause = '';
      break;
  }
  
  const modelRisks = await sequelize.query(
    `SELECT * FROM "${tenant}".model_risks ${whereClause} ORDER BY created_at DESC, id ASC`,
    {
      mapToModel: true,
      model: ModelRiskModel,
    }
  );
  return modelRisks;
}

/**
 * Get a model risk by ID
 */
export async function getModelRiskByIdQuery(
  id: number,
  tenant: string,
  includeDeleted: boolean = false
): Promise<ModelRiskModel | null> {
  const whereClause = includeDeleted ? 'WHERE id = :id' : 'WHERE id = :id AND is_deleted = false';
  const modelRisk = await sequelize.query(
    `SELECT * FROM "${tenant}".model_risks ${whereClause}`,
    {
      replacements: { id },
      mapToModel: true,
      model: ModelRiskModel,
    }
  );

  if (!modelRisk.length) return null;

  return modelRisk[0];
}

/**
 * Create a new model risk
 */
export async function createNewModelRiskQuery(
  data: Partial<IModelRisk>,
  tenant: string
): Promise<ModelRiskModel> {
  const created_at = new Date();
  const result = await sequelize.query(
    `INSERT INTO "${tenant}".model_risks (risk_name, risk_category, risk_level, status, owner, target_date, description, mitigation_plan, impact, likelihood, key_metrics, current_values, threshold, model_id, created_at, updated_at)
        VALUES (:risk_name, :risk_category, :risk_level, :status, :owner, :target_date, :description, :mitigation_plan, :impact, :likelihood, :key_metrics, :current_values, :threshold, :model_id, :created_at, :updated_at) RETURNING *`,
    {
      replacements: {
        risk_name: data.risk_name || '',
        risk_category: data.risk_category,
        risk_level: data.risk_level,
        status: data.status || 'Open',
        owner: data.owner,
        target_date: data.target_date,
        description: data.description || '',
        mitigation_plan: data.mitigation_plan || '',
        impact: data.impact || '',
        likelihood: data.likelihood || '',
        key_metrics: data.key_metrics || '',
        current_values: data.current_values || '',
        threshold: data.threshold || '',
        model_id: data.model_id || null,
        created_at: created_at,
        updated_at: created_at,
      },
      mapToModel: true,
      model: ModelRiskModel,
    }
  );

  return result[0];
}

/**
 * Update a model risk by ID
 */
export async function updateModelRiskByIdQuery(
  id: number,
  updatedModelRisk: Partial<IModelRisk>,
  tenant: string
): Promise<ModelRiskModel | null> {
  const updated_at = new Date();
  const updateModelRisk: Partial<IModelRisk> = { updated_at };
  const setClause = [
    "risk_name",
    "risk_category",
    "risk_level",
    "status",
    "owner",
    "target_date",
    "description",
    "mitigation_plan",
    "impact",
    "likelihood",
    "key_metrics",
    "current_values",
    "threshold",
    "model_id",
  ].filter((field) => {
    if (updatedModelRisk[field as keyof IModelRisk] !== undefined) {
      (updateModelRisk as any)[field] = updatedModelRisk[field as keyof IModelRisk];
      return true;
    }
    return false;
  }).map((field) => `${field} = :${field}`).join(", ");

  if (!setClause) {
    return getModelRiskByIdQuery(id, tenant); // No fields to update, return current state
  }

  updateModelRisk.id = id;

  const query = `UPDATE "${tenant}".model_risks SET ${setClause} WHERE id = :id RETURNING *`;

  const result = await sequelize.query(query, {
    replacements: updateModelRisk,
    mapToModel: true,
    model: ModelRiskModel,
  });
  return result[0] || null;
}

/**
 * Delete a model risk by ID (soft delete)
 */
export async function deleteModelRiskByIdQuery(
  id: number,
  tenant: string
): Promise<boolean> {
  const result = await sequelize.query(
    `UPDATE "${tenant}".model_risks SET is_deleted = true, deleted_at = NOW(), updated_at = NOW() WHERE id = :id AND is_deleted = false RETURNING *`,
    {
      replacements: { id },
      mapToModel: true,
      model: ModelRiskModel,
      type: QueryTypes.UPDATE,
    }
  );
  return result.length > 0; // Returns true if a row was updated
}