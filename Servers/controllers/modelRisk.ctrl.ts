import { Request, Response } from "express";
import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { ModelRiskModel } from "../domain.layer/models/modelRisk/modelRisk.model";
import {
  getAllModelRisksQuery,
  getModelRiskByIdQuery,
  createNewModelRiskQuery,
  updateModelRiskByIdQuery,
  deleteModelRiskByIdQuery,
} from "../utils/modelRisk.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";

export async function getAllModelRisks(req: Request, res: Response) {
  logStructured(
    "processing",
    "starting getAllModelRisks",
    "getAllModelRisks",
    "modelRisk.ctrl.ts"
  );
  logger.debug("🔍 Fetching all model risks");

  try {
    const modelRisks = await getAllModelRisksQuery(
      req.organizationId!
    );
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
            modelRisks.map((modelRisk) =>
              modelRisk.toSafeJSON()
            )
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
  const { id } = req.params;
  logStructured(
    "processing",
    `fetching model risk by ID: ${id}`,
    "getModelRiskById",
    "modelRisk.ctrl.ts"
  );
  logger.debug(`🔍 Looking up model risk with ID: ${id}`);

  try {
    const modelRisk = await getModelRiskByIdQuery(parseInt(id, 10), req.organizationId!);
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
    const modelRisk = await createNewModelRiskQuery(req.body, req.organizationId!);
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
  const { id } = req.params;
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
      parseInt(id, 10),
      req.body,
      req.organizationId!
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
    const success = await deleteModelRiskByIdQuery(parseInt(id, 10), req.organizationId!);

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

    await transaction.commit();
    logStructured(
      "successful",
      `model risk deleted: ID ${id}`,
      "deleteModelRiskById",
      "modelRisk.ctrl.ts"
    );
    logger.debug(`✅ Model risk deleted with ID: ${id}`);
    return res.status(200).json(STATUS_CODE[200]("Model risk deleted successfully."));
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