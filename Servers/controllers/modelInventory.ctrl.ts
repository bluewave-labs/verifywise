import { Request, Response } from "express";
import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { ModelInventoryModel } from "../domain.layer/models/modelInventory/modelInventory.model";
import {
  getAllModelInventoriesQuery,
  getModelInventoryByIdQuery,
  createNewModelInventoryQuery,
  updateModelInventoryByIdQuery,
  deleteModelInventoryByIdQuery,
} from "../utils/modelInventory.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";

export async function getAllModelInventories(req: Request, res: Response) {
  logStructured(
    "processing",
    "starting getAllModelInventories",
    "getAllModelInventories",
    "modelInventory.ctrl.ts"
  );
  logger.debug("🔍 Fetching all model inventories");

  try {
    const modelInventories = (await getAllModelInventoriesQuery(
      req.tenantId!
    )) as unknown as ModelInventoryModel[];
    if (modelInventories && modelInventories.length > 0) {
      logStructured(
        "successful",
        "model inventories found",
        "getAllModelInventories",
        "modelInventory.ctrl.ts"
      );
      return res
        .status(200)
        .json(
          STATUS_CODE[200](
            modelInventories.map((modelInventory) =>
              modelInventory.toSafeJSON()
            )
          )
        );
    }

    logStructured(
      "successful",
      "no model inventories found",
      "getAllModelInventories",
      "modelInventory.ctrl.ts"
    );
    return res.status(204).json(STATUS_CODE[204](modelInventories));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve model inventories",
      "getAllModelInventories",
      "modelInventory.ctrl.ts"
    );
    logger.error("❌ Error in getAllModelInventories:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getModelInventoryById(req: Request, res: Response) {
  const id = req.params.id;
  logStructured(
    "processing",
    `fetching model inventory by id: ${id}`,
    "getModelInventoryById",
    "modelInventory.ctrl.ts"
  );
  logger.debug(`🔍 Looking up model inventory with id: ${id}`);

  try {
    const modelInventory = (await getModelInventoryByIdQuery(
      Number(id),
      req.tenantId!
    )) as unknown as ModelInventoryModel;
    if (modelInventory) {
      logStructured(
        "successful",
        `model inventory found: ${id}`,
        "getModelInventoryById",
        "modelInventory.ctrl.ts"
      );
      return res
        .status(200)
        .json(STATUS_CODE[200](modelInventory.toSafeJSON()));
    }
    logStructured(
      "successful",
      `no model inventory found: ${id}`,
      "getModelInventoryById",
      "modelInventory.ctrl.ts"
    );
    return res.status(204).json(STATUS_CODE[204](modelInventory));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve model inventory",
      "getModelInventoryById",
      "modelInventory.ctrl.ts"
    );
    logger.error("❌ Error in getModelInventoryById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createNewModelInventory(req: Request, res: Response) {
  const {
    provider_model,
    version,
    approver,
    capabilities,
    security_assessment,
    status,
    status_date,
    is_demo,
  } = req.body;

  logStructured(
    "processing",
    "starting createNewModelInventory",
    "createNewModelInventory",
    "modelInventory.ctrl.ts"
  );
  logger.debug("🔍 Creating new model inventory");

  let transaction: Transaction | null = null;

  try {
    // Create new model inventory instance using the static method for validation
    const modelInventory = ModelInventoryModel.createNewModelInventory({
      provider_model,
      version,
      approver,
      capabilities,
      security_assessment,
      status,
      status_date,
      is_demo,
    });

    // Create transaction and use the existing database query approach
    transaction = await sequelize.transaction();
    const savedModelInventory = await createNewModelInventoryQuery(
      modelInventory,
      req.tenantId!,
      transaction
    );
    await transaction.commit();

    logStructured(
      "successful",
      "new model inventory created",
      "createNewModelInventory",
      "modelInventory.ctrl.ts"
    );
    return res
      .status(201)
      .json(STATUS_CODE[201](savedModelInventory.toSafeJSON()));
  } catch (error) {
    // Rollback transaction if it exists
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        // Transaction might already be committed, ignore rollback errors
        console.warn("Transaction rollback failed:", rollbackError);
      }
    }

    logStructured(
      "error",
      "failed to create new model inventory",
      "createNewModelInventory",
      "modelInventory.ctrl.ts"
    );
    logger.error("❌ Error in createNewModelInventory:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateModelInventoryById(req: Request, res: Response) {
  const id = req.params.id;
  const {
    provider_model,
    version,
    approver,
    capabilities,
    security_assessment,
    status,
    status_date,
    is_demo,
  } = req.body;

  logStructured(
    "processing",
    "starting updateModelInventoryById",
    "updateModelInventoryById",
    "modelInventory.ctrl.ts"
  );
  logger.debug("🔍 Updating model inventory by id");

  let transaction: Transaction | null = null;

  try {
    // Get existing model inventory
    const existingModelInventory = (await getModelInventoryByIdQuery(
      Number(id),
      req.tenantId!
    )) as unknown as ModelInventoryModel;

    if (!existingModelInventory) {
      logStructured(
        "successful",
        "no model inventory found",
        "updateModelInventoryById",
        "modelInventory.ctrl.ts"
      );
      return res
        .status(404)
        .json(STATUS_CODE[404]("Model inventory not found"));
    }

    // Update the model inventory using the static method
    const updatedModelInventory = ModelInventoryModel.updateModelInventory(
      existingModelInventory,
      {
        provider_model,
        version,
        approver,
        capabilities,
        security_assessment,
        status,
        status_date,
        is_demo,
      }
    );

    // Use the existing database query approach for updating
    transaction = await sequelize.transaction();
    const savedModelInventory = await updateModelInventoryByIdQuery(
      Number(id),
      updatedModelInventory,
      req.tenantId!,
      transaction
    );
    await transaction.commit();

    logStructured(
      "successful",
      "model inventory updated",
      "updateModelInventoryById",
      "modelInventory.ctrl.ts"
    );
    return res
      .status(200)
      .json(STATUS_CODE[200](savedModelInventory.toSafeJSON()));
  } catch (error) {
    // Rollback transaction if it exists
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        // Transaction might already be committed, ignore rollback errors
        console.warn("Transaction rollback failed:", rollbackError);
      }
    }

    logStructured(
      "error",
      "failed to update model inventory",
      "updateModelInventoryById",
      "modelInventory.ctrl.ts"
    );
    logger.error("❌ Error in updateModelInventoryById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteModelInventoryById(req: Request, res: Response) {
  const id = req.params.id;

  logStructured(
    "processing",
    "starting deleteModelInventoryById",
    "deleteModelInventoryById",
    "modelInventory.ctrl.ts"
  );
  logger.debug("🔍 Deleting model inventory by id");

  let transaction: Transaction | null = null;

  try {
    // Check if model inventory exists
    const existingModelInventory = (await getModelInventoryByIdQuery(
      Number(id),
      req.tenantId!
    )) as unknown as ModelInventoryModel;

    if (!existingModelInventory) {
      logStructured(
        "successful",
        "no model inventory found",
        "deleteModelInventoryById",
        "modelInventory.ctrl.ts"
      );
      return res
        .status(404)
        .json(STATUS_CODE[404]("Model inventory not found"));
    }

    // Use the existing database query approach for deleting
    transaction = await sequelize.transaction();
    await deleteModelInventoryByIdQuery(Number(id), req.tenantId!, transaction);
    await transaction.commit();

    logStructured(
      "successful",
      "model inventory deleted",
      "deleteModelInventoryById",
      "modelInventory.ctrl.ts"
    );
    return res
      .status(200)
      .json(STATUS_CODE[200]("Model inventory deleted successfully"));
  } catch (error) {
    // Rollback transaction if it exists
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        // Transaction might already be committed, ignore rollback errors
        console.warn("Transaction rollback failed:", rollbackError);
      }
    }

    logStructured(
      "error",
      "failed to delete model inventory",
      "deleteModelInventoryById",
      "modelInventory.ctrl.ts"
    );
    logger.error("❌ Error in deleteModelInventoryById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
