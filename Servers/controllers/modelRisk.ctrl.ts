import { Request, Response } from "express";
import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import {
  getAllModelRisksQuery,
  getModelRiskByIdQuery,
  createNewModelRiskQuery,
  updateModelRiskByIdQuery,
  deleteModelRiskByIdQuery,
} from "../utils/modelRisk.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import {
  recordEntityCreation,
  trackEntityChanges,
  recordMultipleFieldChanges,
  recordEntityDeletion,
} from "../utils/changeHistory.base.utils";

export async function getAllModelRisks(req: Request, res: Response) {
  const filter = (req.query.filter as "active" | "deleted" | "all") || "active";

  logStructured(
    "processing",
    `starting getAllModelRisks with filter: ${filter}`,
    "getAllModelRisks",
    "modelRisk.ctrl.ts"
  );
  logger.debug(`🔍 Fetching all model risks with filter: ${filter}`);

  try {
    const modelRisks = await getAllModelRisksQuery(req.tenantId!, filter);
    if (modelRisks && modelRisks.length > 0) {
      logStructured(
        "successful",
        "model risks found",
        "getAllModelRisks",
        "modelRisk.ctrl.ts"
      );
      return res
        .status(200)
        .json(
          STATUS_CODE[200](
            modelRisks.map((modelRisk) => modelRisk.toSafeJSON())
          )
        );
    }

    logStructured(
      "successful",
      "no model risks found",
      "getAllModelRisks",
      "modelRisk.ctrl.ts"
    );
    return res.status(200).json(STATUS_CODE[200]([]));
  } catch (error) {
    logStructured(
      "error",
      `Failed to retrieve model risks: ${error}`,
      "getAllModelRisks",
      "modelRisk.ctrl.ts"
    );
    logger.error(`❌ Failed to retrieve model risks: ${error}`);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getModelRiskById(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const modelRiskId = parseInt(id, 10);

  logStructured(
    "processing",
    `fetching model risk by ID: ${id}`,
    "getModelRiskById",
    "modelRisk.ctrl.ts"
  );
  logger.debug(`🔍 Looking up model risk with ID: ${id}`);

  try {
    const modelRisk = await getModelRiskByIdQuery(modelRiskId, req.tenantId!);
    if (modelRisk) {
      logStructured(
        "successful",
        `model risk found: ID ${id}`,
        "getModelRiskById",
        "modelRisk.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](modelRisk.toSafeJSON()));
    }

    logStructured(
      "error",
      `model risk not found: ID ${id}`,
      "getModelRiskById",
      "modelRisk.ctrl.ts"
    );
    return res.status(404).json(STATUS_CODE[404]("Model risk not found."));
  } catch (error) {
    logStructured(
      "error",
      `Failed to retrieve model risk: ${error}`,
      "getModelRiskById",
      "modelRisk.ctrl.ts"
    );
    logger.error(`❌ Failed to retrieve model risk: ${error}`);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createNewModelRisk(req: Request, res: Response) {
  logStructured(
    "processing",
    "creating new model risk",
    "createNewModelRisk",
    "modelRisk.ctrl.ts"
  );
  logger.debug("🆕 Creating new model risk");

  const transaction: Transaction = await sequelize.transaction();

  try {
    const modelRisk = await createNewModelRiskQuery(req.body, req.tenantId!, transaction);

    // Record creation in change history
    if (modelRisk.id && req.userId) {
      await recordEntityCreation(
        "model_risk",
        modelRisk.id,
        req.userId,
        req.tenantId!,
        req.body,
        transaction
      );
    }

    await transaction.commit();

    logStructured(
      "successful",
      `model risk created: ID ${modelRisk.id}`,
      "createNewModelRisk",
      "modelRisk.ctrl.ts"
    );
    logger.debug(`✅ Model risk created with ID: ${modelRisk.id}`);
    return res.status(201).json(STATUS_CODE[201](modelRisk.toSafeJSON()));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `Failed to create model risk: ${error}`,
      "createNewModelRisk",
      "modelRisk.ctrl.ts"
    );
    logger.error(`❌ Failed to create model risk: ${error}`);
    return res.status(400).json(STATUS_CODE[400]((error as Error).message));
  }
}

export async function updateModelRiskById(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const modelRiskId = parseInt(id, 10);

  // Get existing model risk for change tracking
  let existingModelRiskData: Record<string, unknown> | null = null;
  try {
    const existingModelRisk = await getModelRiskByIdQuery(modelRiskId, req.tenantId!);
    if (existingModelRisk) {
      existingModelRiskData = existingModelRisk.toSafeJSON ? existingModelRisk.toSafeJSON() : existingModelRisk;
    }
  } catch (error) {
    // Continue without existing data if query fails
  }

  logStructured(
    "processing",
    `updating model risk: ID ${id}`,
    "updateModelRiskById",
    "modelRisk.ctrl.ts"
  );
  logger.debug(`🔄 Updating model risk with ID: ${id}`);

  const transaction: Transaction = await sequelize.transaction();

  try {
    const modelRisk = await updateModelRiskByIdQuery(
      modelRiskId,
      req.body,
      req.tenantId!
    );

    if (!modelRisk) {
      await transaction.rollback();
      logStructured(
        "error",
        `model risk not found for update: ID ${id}`,
        "updateModelRiskById",
        "modelRisk.ctrl.ts"
      );
      return res.status(404).json(STATUS_CODE[404]("Model risk not found."));
    }

    // Record changes in change history
    if (existingModelRiskData && req.userId) {
      const changes = await trackEntityChanges(
        "model_risk",
        existingModelRiskData,
        req.body
      );
      if (changes.length > 0) {
        await recordMultipleFieldChanges(
          "model_risk",
          modelRiskId,
          req.userId,
          req.tenantId!,
          changes,
          transaction
        );
      }
    }

    await transaction.commit();
    logStructured(
      "successful",
      `model risk updated: ID ${id}`,
      "updateModelRiskById",
      "modelRisk.ctrl.ts"
    );
    logger.debug(`✅ Model risk updated with ID: ${id}`);
    return res.status(200).json(STATUS_CODE[200](modelRisk.toSafeJSON()));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `Failed to update model risk: ${error}`,
      "updateModelRiskById",
      "modelRisk.ctrl.ts"
    );
    logger.error(`❌ Failed to update model risk: ${error}`);
    return res.status(400).json(STATUS_CODE[400]((error as Error).message));
  }
}

export async function deleteModelRiskById(req: Request, res: Response) {
  const { id } = req.params;

  logStructured(
    "processing",
    `deleting model risk: ID ${id}`,
    "deleteModelRiskById",
    "modelRisk.ctrl.ts"
  );
  logger.debug(`🗑️ Deleting model risk with ID: ${id}`);

  const transaction: Transaction = await sequelize.transaction();

  try {
    const success = await deleteModelRiskByIdQuery(
      parseInt(Array.isArray(id) ? id[0] : id, 10),
      req.tenantId!
    );

    if (!success) {
      await transaction.rollback();
      logStructured(
        "error",
        `model risk not found for deletion: ID ${id}`,
        "deleteModelRiskById",
        "modelRisk.ctrl.ts"
      );
      return res.status(404).json(STATUS_CODE[404]("Model risk not found."));
    }

    // Record deletion in change history
    const modelRiskId = parseInt(Array.isArray(id) ? id[0] : id, 10);
    if (req.userId) {
      await recordEntityDeletion("model_risk", modelRiskId, req.userId, req.tenantId!, transaction);
    }

    await transaction.commit();
    logStructured(
      "successful",
      `model risk deleted: ID ${id}`,
      "deleteModelRiskById",
      "modelRisk.ctrl.ts"
    );
    logger.debug(`✅ Model risk deleted with ID: ${id}`);
    return res
      .status(200)
      .json(STATUS_CODE[200]("Model risk deleted successfully."));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `Failed to delete model risk: ${error}`,
      "deleteModelRiskById",
      "modelRisk.ctrl.ts"
    );
    logger.error(`❌ Failed to delete model risk: ${error}`);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
