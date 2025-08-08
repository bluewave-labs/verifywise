import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";

import{
    createNewModelInventoryQuery,
    getAllModelInventoryQuery,
    getModelInventoryByIdQuery,
    updateModelInventoryByIdQuery,
    deleteModelInventoryByIdQuery
    
} from "../utils/modelInventory.utils";

import { ModelInventory } from "../domain.layer/models/modelInventory/modelInventory.model";
import { sequelize } from "../database/db";

import {
    logProcessing,
    logSuccess,
    logFailure
} from "../utils/logger/logHelper";

import logger,{ logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";

// get ALL model Inventory
export async function getAllModelInventory(
    req: Request,
    res: Response
): Promise<any>{
    logProcessing({
        description: "starting getAllModelInventory",
        functionName: "getAllModelInventory",
        fileName: "modelInventory.ctrl.ts"
    });
    logger.debug("📚 Fetching all the model Inventory");

    try{
        const modelInventories = await getAllModelInventoryQuery(req.tenantId!);
        if(modelInventories){
            await logSuccess({
                eventType: "Read",
                description: `Retrieved ${modelInventories.length} model inventories`,
                functionName: "getAllModelInventory",
                fileName: "modelInventory.ctrl.ts"
            })

            return res.status(200).json(STATUS_CODE[200](modelInventories)); 
        }

        await logSuccess({
            eventType: "Read",
            description: "No model inventory found",
            functionName: "getAllModelInventory",
            fileName:"modelInventory.ctrl.ts"
        });
        return res.status(204).json(STATUS_CODE[204](modelInventories))
    } catch(error){
        await logFailure({
            eventType:"Read",
            description: "Failed to retrieve model inventories",
            functionName: "getAllModelInventory",
            fileName: "modelInventory.ctrl.ts",
            error: error as Error,
        })

        return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
}

// get By ID model Inventory api
export async function getModelInventoryById(
    req: Request,
    res: Response
): Promise<any> {
    const modelInventoryId = parseInt(req.params.id);

    logProcessing({
        description: `starting getModelInventoryById for model inventory ID ${modelInventoryId}`,
        functionName: "getModelInventoryId",
        fileName: "modelInventory.ctrl.ts"
    });
    logger.debug(`🔍 Looking up model inventory ID ${modelInventoryId}`);

    try{
        const modelInventory = await getModelInventoryByIdQuery(
            modelInventoryId,
            req.tenantId!
        );

        if(modelInventory){
            await logSuccess({
                eventType: "Read",
                description: `Retrieved model Inventory ID ${modelInventoryId}`,
                functionName: "getModelInventoryById",
                fileName: "modelInventory.ctrl.ts"
            });
            return res.status(200).json(STATUS_CODE[200](modelInventory));
        }

        await logSuccess({
            eventType: "Read",
            description: `Model Inventory not found: ID ${modelInventoryId}`,
            functionName: "getModelInventoryById",
            fileName: "modelInventory.ctrl.ts"
        });
        return res.status(404).json(STATUS_CODE[404](modelInventory));
    } catch (error){
        await logFailure({
            eventType: "Read",
            description: `Failed to retrieve model inventory ID ${modelInventoryId}`,
            functionName: "getModelInventoryById",
            fileName: "modelInventory.ctr.ts",
            error: error as Error
        });
        return res.status(500).json(STATUS_CODE[500]((error as Error).message));

    }
}

// create new Model inventory
export async function createNewModelInventory(
    req: Request,
    res: Response
): Promise<any>{
    const transaction = await sequelize.transaction();

    logProcessing({
        description: "starting createNewModelInventory",
        functionName: "createNewModelInventory",
        fileName: "modelInventory.ctrl.ts"
    });
    logger.debug("🛠️ Creating new Model Inventory");
    
    try{
        const newModelInventory: ModelInventory = req.body;
        
        if(
            !newModelInventory.model ||
            !newModelInventory.approver ||
            !newModelInventory.capabilities ||
            !newModelInventory.security_assessments ||
            !newModelInventory.status ||
            !newModelInventory.status_date
        ) {
            await logFailure({
                eventType: "Create",
                description: "Missing fields for model Inventory",
                functionName: "createNewModelInventory",
                fileName: "modelInventory.ctrl.ts",
                error: new Error("Missing required fields")
            });
            return res.status(400).json(
                STATUS_CODE[400]({
                    message: "Missing field from model Inventory",
                })
            );
        }

        const createNewModelInventory = await createNewModelInventoryQuery(
            newModelInventory,
            req.tenantId!,
            transaction
        );

        if(createNewModelInventory){
            await transaction.commit();
            await logSuccess({
                eventType: "Create",
                description: `Successfully created model Inventory: ${newModelInventory.model}`,
                functionName: "createNewModelInventory",
                fileName: "modelInventory.ctrl.ts"
            });

            return res.status(201).json(STATUS_CODE[201](createNewModelInventory));
        }

        await transaction.rollback();
        await logFailure({
            eventType: "Create",
            description: "Failed to create model Inventory",
            functionName: "createNewModelInventory",
            fileName: "modelInventory.ctrl.ts",
            error: new Error("Creation failed")
        })
        return res.status(503).json(STATUS_CODE[503]({}));
    } catch(error){
        await transaction.rollback();
        await logFailure({
            eventType:"Create",
            description: "Failed to create model Inventory",
            functionName: "createNewModelInventory",
            fileName: "modelInventory.ctrl.ts",
            error : error as Error,
        })
        return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
}

/**
 * Update a particular model Inventory
 */
export async function updateModelInventoryById(
    req: Request,
    res: Response
): Promise<any>{
    const transaction = await sequelize.transaction();
    const modelInventoryId = parseInt(req.params.id);

    logProcessing({
        description: `starting updateModelInventoryById for model Inventory ID ${modelInventoryId}`,
        functionName: "updateModelInventoryById",
        fileName: "modelInventory.ctrl.ts"
    });
    logger.debug(`✏️ Updating model Inventory ID ${modelInventoryId}`);

    try{
        const updatedModelInventory = req.body;

        if(
            !updatedModelInventory.model ||
            !updatedModelInventory.approver ||
            !updatedModelInventory.capabilities ||
            !updatedModelInventory.security_assessments ||
            !updatedModelInventory.status ||
            !updatedModelInventory.status_date
        ) {
            await logFailure({
                eventType: "Update",
                description: `Missing required fields for updating model inventory ID ${modelInventoryId}`,
                functionName: "updateModelInventoryById",
                fileName: "modelInventory.ctrl.ts",
                error: new Error("Missing required fields")
            });
            await transaction.rollback();
            return res.status(400).json(
                STATUS_CODE[400]({
                    message: "Missing required fields for model Inventory update",
                })
            );
        }

        const modelInventory = await updateModelInventoryByIdQuery(
            modelInventoryId,
            updatedModelInventory,
            req.tenantId!,
            transaction
        );

        if(modelInventory) {
            await transaction.commit();
            await logSuccess({
                eventType: "Update",
                description: `Successfully updated model Inventory ID ${modelInventoryId}`,
                functionName: "updateModelInventoryById",
                fileName: "modelInventory.ctrl.ts"
            });

            return res.status(200).json(STATUS_CODE[200](modelInventory));
        } else {
            await transaction.rollback();
            await logFailure({
                eventType: "Update",
                description: `Model Inventory not found: ID ${modelInventoryId}`,
                functionName: "updateModelInventoryById",
                fileName: "modelInventory.ctrl.ts",
                error: new Error("Model inventory not found")
            });
            return res.status(404).json(
                STATUS_CODE[404]({
                    message: `Model inventory with ID ${modelInventoryId} not found`,
                })
            );
        }
    } catch(error) {
        await transaction.rollback();
        await logFailure({
            eventType: "Update",
            description: `Failed to update model inventory ID ${modelInventoryId}`,
            functionName: "updateModelInventoryById",
            fileName: "modelInventory.ctrl.ts",
            error: error as Error
        });
        return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
}