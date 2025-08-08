import { ModelInventory } from "../domain.layer/models/modelInventory/modelInventory.model";
import { sequelize } from "../database/db";
import { IModelInventory } from "../domain.layer/interfaces/i.modelInventory";
import { QueryTypes, Transaction } from "sequelize";

/**
 * Create a Model Inventory
 */

export const createNewModelInventoryQuery = async(
    modelInventory: ModelInventory,
    tenant: string,
    transaction: Transaction
) => {
    const result = await sequelize.query(
        `INSERT INTO "${tenant}".modelinventory (
        model, version, approver, capabilities, security_assessments, status, status_date
        ) VALUES (
         :model, :version, :approver, :capabilities, :security_assessments, :status, :status_date
         ) RETURNING *`,
          {
            replacements:{
                model: modelInventory.model,
                version: modelInventory.version,
                approver: modelInventory.approver,
                capabilities: modelInventory.capabilities,
                security_assessments: modelInventory.security_assessments,
                status: modelInventory.status,
                status_date: modelInventory.status_date
            },
            mapToModel: true,
            model: ModelInventory,
            transaction
          }
    );
    // Return the created ModelInventory instance
    return Array.isArray(result);
};

/**
 * @returns All the model inventory in the DB
 */
export const getAllModelInventoryQuery = async(
    tenant: string
): Promise<IModelInventory[]> => {
    const modelInventories = await sequelize.query(
        `SELECT * FROM "${tenant}".modelinventory ORDER BY id ASC`,
        {
            mapToModel: true,
            model:ModelInventory
        }
    );
    // Return all model Inventorry or an empty array if none is found
    return Array.isArray(modelInventories)
        ? (modelInventories as ModelInventory[])
        : [];
}

/**
 * Return model Inventories by ID
 */
export const getModelInventoryByIdQuery = async(
    id: number,
    tenant: string
): Promise<IModelInventory> =>{
    const modelInventoriesById = await sequelize.query(
        `SELECT * FROM "${tenant}".modelinventory WHERE id = :id`,
        {
            replacements: {id },
            mapToModel: true,
            model:ModelInventory
        }
    );

    // Return the first model inventory or null if none found
    return Array.isArray(modelInventoriesById) &&
        modelInventoriesById.length > 0
        ? (modelInventoriesById[0] as IModelInventory)
        : (null as any);
};

/**
 * Update all the model Inventory by ID
 */
export const updateModelInventoryByIdQuery = async (
    id: number,
    modelInventory: Partial<ModelInventory>,
    tenant: string,
    transaction: Transaction
): Promise<ModelInventory> => {
    const updateModelInventory: Partial<
      Record<keyof ModelInventory, any> & { people ?: number }
    > = {};
    const setClause = [
        "model",
        "version",
        "approver",
        "capabilities",
        "security_assessments",
        "status",
        "status_date"
    ]
    const query = `UPDATE "${tenant}".modelinventory SET ${setClause} WHERE id = :id RETURNING *;`;
    updateModelInventory.id = id;

    const result = await sequelize.query(query, {
        replacements: updateModelInventory,
        mapToModel: true,
        model: ModelInventory,
        transaction,
    });

    // Return the first updated model inventory or null if none found
    return Array.isArray(result) && result.length > 0
      ? (result[0] as ModelInventory)
      : (null as any);
};

/**
 * Delete model Inventory by ID
 */
export const deleteModelInventoryByIdQuery = async (
    id: number,
    tenant: string,
    transaction: Transaction
): Promise<Boolean> => {
    const result = await sequelize.query(
        `DELETE FROM "${tenant}".modelinventory WHERE id = :id RETURNING id`,
        {
            replacements: {id},
            mapToModel: true,
            model: ModelInventory,
            type: QueryTypes.DELETE,
            transaction,
        }
    );

    // check if all the rows were affected
    return Array.isArray(result) && result.length > 0;
}