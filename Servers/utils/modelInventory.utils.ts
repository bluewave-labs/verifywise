import { ModelInventoryModel } from "../domain.layer/models/modelInventory/modelInventory.model";
import { sequelize } from "../database/db";
import { Transaction } from "sequelize";

export const getAllModelInventoriesQuery = async (tenant: string) => {
  const modelInventories = await sequelize.query(
    `SELECT * FROM model_inventories ORDER BY created_at DESC, id ASC`,
    {
      mapToModel: true,
      model: ModelInventoryModel,
    }
  );
  return modelInventories;
};

export const getModelInventoryByIdQuery = async (
  id: number,
  tenant: string
) => {
  const modelInventory = await sequelize.query(
    `SELECT * FROM model_inventories WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: ModelInventoryModel,
    }
  );

  if (!modelInventory.length) return null;

  return modelInventory[0];
};

export const createNewModelInventoryQuery = async (
  modelInventory: ModelInventoryModel,
  tenant: string,
  transaction: Transaction
) => {
  const created_at = new Date();
  const status_date = new Date();

  try {
    const result = await sequelize.query(
      `INSERT INTO model_inventories (provider_model, version, approver, capabilities, security_assessment, status, status_date, is_demo, created_at, updated_at)
        VALUES (:provider_model, :version, :approver, :capabilities, :security_assessment, :status, :status_date, :is_demo, :created_at, :updated_at) RETURNING *`,
      {
        replacements: {
          provider_model: modelInventory.provider_model,
          version: modelInventory.version,
          approver: modelInventory.approver,
          capabilities: Array.isArray(modelInventory.capabilities)
            ? modelInventory.capabilities.join(", ")
            : modelInventory.capabilities,
          security_assessment: modelInventory.security_assessment,
          status: modelInventory.status,
          status_date: status_date,
          is_demo: modelInventory.is_demo,
          created_at: created_at,
          updated_at: created_at,
        },
        mapToModel: true,
        model: ModelInventoryModel,
        transaction,
      }
    );

    return result[0];
  } catch (error) {
    console.error("Error creating new model inventory:", error);
    throw error;
  }
};

export const updateModelInventoryByIdQuery = async (
  id: number,
  modelInventory: ModelInventoryModel,
  tenant: string,
  transaction: Transaction
) => {
  const updated_at = new Date();

  try {
    // First update the record
    await sequelize.query(
      `UPDATE model_inventories SET provider_model = :provider_model, version = :version, approver = :approver, capabilities = :capabilities, security_assessment = :security_assessment, status = :status, status_date = :status_date, is_demo = :is_demo, updated_at = :updated_at WHERE id = :id`,
      {
        replacements: {
          id,
          provider_model: modelInventory.provider_model,
          version: modelInventory.version,
          approver: modelInventory.approver,
          capabilities: Array.isArray(modelInventory.capabilities)
            ? modelInventory.capabilities.join(", ")
            : modelInventory.capabilities,
          security_assessment: modelInventory.security_assessment,
          status: modelInventory.status,
          status_date: modelInventory.status_date,
          is_demo: modelInventory.is_demo,
          updated_at,
        },
        transaction,
      }
    );

    // Then fetch the updated record
    const result = await sequelize.query(
      `SELECT * FROM model_inventories WHERE id = :id`,
      {
        replacements: { id },
        mapToModel: true,
        model: ModelInventoryModel,
        transaction,
      }
    );

    return result[0];
  } catch (error) {
    console.error("Error updating model inventory:", error);
    throw error;
  }
};

export const deleteModelInventoryByIdQuery = async (
  id: number,
  tenant: string,
  transaction: Transaction
) => {
  try {
    const result = await sequelize.query(
      `DELETE FROM model_inventories WHERE id = :id`,
      {
        replacements: { id },
        transaction,
      }
    );

    return result[0];
  } catch (error) {
    console.error("Error deleting model inventory:", error);
    throw error;
  }
};
