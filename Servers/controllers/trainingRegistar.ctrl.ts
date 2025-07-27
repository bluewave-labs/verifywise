import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";

import {
  createNewTrainingRegistarQuery,
  getAllTrainingRegistarQuery,
  getTrainingRegistarByIdQuery,
  updateTrainingRegistarByIdQuery,
  deleteTrainingRegistarByIdQuery,
} from "../utils/trainingRegistar.utils";

import { sequelize } from "../database/db";
import { TrainingRegistarModel } from "../domain.layer/models/trainingRegistar/trainingRegistar.model";
import {
  ValidationException,
  BusinessLogicException,
  NotFoundException,
} from "../domain.layer/exceptions/custom.exception";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";

// get ALL training registry api
export async function getAllTrainingRegistar(
  req: Request,
  res: Response
): Promise<any> {
  logProcessing({
    description: "starting getAllTrainingRegistar",
    functionName: "getAllTrainingRegistar",
    fileName: "trainingRegistar.ctrl.ts",
  });
  logStructured(
    "processing",
    "starting getAllTrainingRegistar",
    "getAllTrainingRegistar",
    "trainingRegistar.ctrl.ts"
  );
  logger.debug("🔍 Fetching all training registers");

  try {
    const trainingRegistars = await getAllTrainingRegistarQuery(req.tenantId!);
    if (trainingRegistars && trainingRegistars.length > 0) {
      await logSuccess({
        eventType: "Read",
        description: "Retrieved all training registers",
        functionName: "getAllTrainingRegistar",
        fileName: "trainingRegistar.ctrl.ts",
      });
      logStructured(
        "successful",
        `${trainingRegistars.length} training registers found`,
        "getAllTrainingRegistar",
        "trainingRegistar.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](trainingRegistars));
    }

    logStructured(
      "successful",
      "no training registers found",
      "getAllTrainingRegistar",
      "trainingRegistar.ctrl.ts"
    );
    return res.status(204).json(STATUS_CODE[204](trainingRegistars));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve training registers",
      functionName: "getAllTrainingRegistar",
      fileName: "trainingRegistar.ctrl.ts",
      error: error as Error,
    });
    logStructured(
      "error",
      "failed to retrieve training registers",
      "getAllTrainingRegistar",
      "trainingRegistar.ctrl.ts"
    );
    logger.error("❌ Error in getAllTrainingRegistar:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// get BY ID training registry api
export async function getTrainingRegistarById(
  req: Request,
  res: Response
): Promise<any> {
  const trainingRegistarId = parseInt(req.params.id);

  logProcessing({
    description: `starting getTrainingRegistarById for ID ${trainingRegistarId}`,
    functionName: "getTrainingRegistarById",
    fileName: "trainingRegistar.ctrl.ts",
  });
  logStructured(
    "processing",
    `fetching training register by ID: ${trainingRegistarId}`,
    "getTrainingRegistarById",
    "trainingRegistar.ctrl.ts"
  );
  logger.debug(
    `🔍 Looking up training register with ID: ${trainingRegistarId}`
  );

  try {
    const trainingRegistar = await getTrainingRegistarByIdQuery(
      trainingRegistarId,
      req.tenantId!
    );

    if (trainingRegistar) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved training register ID ${trainingRegistarId}`,
        functionName: "getTrainingRegistarById",
        fileName: "trainingRegistar.ctrl.ts",
      });
      logStructured(
        "successful",
        `training register found: ID ${trainingRegistarId}`,
        "getTrainingRegistarById",
        "trainingRegistar.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](trainingRegistar));
    }

    logStructured(
      "successful",
      `no training register found: ID ${trainingRegistarId}`,
      "getTrainingRegistarById",
      "trainingRegistar.ctrl.ts"
    );
    return res.status(404).json(STATUS_CODE[404](trainingRegistar));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve training register by ID",
      functionName: "getTrainingRegistarById",
      fileName: "trainingRegistar.ctrl.ts",
      error: error as Error,
    });
    logStructured(
      "error",
      `failed to fetch training register: ID ${trainingRegistarId}`,
      "getTrainingRegistarById",
      "trainingRegistar.ctrl.ts"
    );
    logger.error("❌ Error in getTrainingRegistarById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// create new training registar
export async function createNewTrainingRegistar(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const trainingData = req.body;

  logProcessing({
    description: "starting createNewTrainingRegistar",
    functionName: "createNewTrainingRegistar",
    fileName: "trainingRegistar.ctrl.ts",
  });
  logStructured(
    "processing",
    `starting training register creation`,
    "createNewTrainingRegistar",
    "trainingRegistar.ctrl.ts"
  );
  logger.debug(`🛠️ Creating training register: ${trainingData.training_name}`);

  try {
    // Ensure duration is treated as a string
    const duration = String(trainingData.duration || "");

    // Create training register using the enhanced TrainingRegistarModel method
    const trainingRegistarModel =
      await TrainingRegistarModel.createNewTrainingRegister(
        trainingData.training_name,
        duration,
        trainingData.provider,
        trainingData.department,
        trainingData.status || "Planned",
        trainingData.numberOfPeople,
        trainingData.description
      );

    // Validate training register data before saving
    await trainingRegistarModel.validateTrainingRegisterData();

    const createdNewTrainingRegistar = await createNewTrainingRegistarQuery(
      trainingRegistarModel,
      req.tenantId!,
      transaction
    );

    if (createdNewTrainingRegistar) {
      await transaction.commit();

      await logSuccess({
        eventType: "Create",
        description: "Created new training register",
        functionName: "createNewTrainingRegistar",
        fileName: "trainingRegistar.ctrl.ts",
      });
      logStructured(
        "successful",
        `training register created successfully`,
        "createNewTrainingRegistar",
        "trainingRegistar.ctrl.ts"
      );
      await logEvent(
        "Create",
        `Training register created: name: ${trainingData.training_name}`
      );
      return res
        .status(201)
        .json(STATUS_CODE[201](trainingRegistarModel.toJSON()));
    }

    logStructured(
      "error",
      "failed to create training register",
      "createNewTrainingRegistar",
      "trainingRegistar.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Training register creation failed: ${trainingData.training_name}`
    );
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Failed to create training register"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation failed: ${error.message}`,
        "createNewTrainingRegistar",
        "trainingRegistar.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during training register creation: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "createNewTrainingRegistar",
        "trainingRegistar.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during training register creation: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    await logFailure({
      eventType: "Create",
      description: "Failed to create training register",
      functionName: "createNewTrainingRegistar",
      fileName: "trainingRegistar.ctrl.ts",
      error: error as Error,
    });
    logStructured(
      "error",
      `unexpected error during training register creation`,
      "createNewTrainingRegistar",
      "trainingRegistar.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during training register creation: ${(error as Error).message}`
    );
    logger.error("❌ Error in createNewTrainingRegistar:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

//update a particular training registar by id
export async function updateTrainingRegistarById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const trainingRegistarId = parseInt(req.params.id);
  const updateData = req.body;

  logProcessing({
    description: `starting updateTrainingRegistarById for ID ${trainingRegistarId}`,
    functionName: "updateTrainingRegistarById",
    fileName: "trainingRegistar.ctrl.ts",
  });
  logStructured(
    "processing",
    `updating training register ID ${trainingRegistarId}`,
    "updateTrainingRegistarById",
    "trainingRegistar.ctrl.ts"
  );
  logger.debug(
    `✏️ Update requested for training register ID ${trainingRegistarId}`
  );

  try {
    // Find existing training register with validation
    const existingTrainingRegistar =
      await TrainingRegistarModel.findByIdWithValidation(trainingRegistarId);

    if (!existingTrainingRegistar) {
      logStructured(
        "error",
        `training register not found: ID ${trainingRegistarId}`,
        "updateTrainingRegistarById",
        "trainingRegistar.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Update failed — training register not found: ID ${trainingRegistarId}`
      );
      await transaction.rollback();
      return res
        .status(404)
        .json(STATUS_CODE[404]("Training register not found"));
    }

    // Ensure duration is treated as a string if provided
    const duration =
      updateData.duration !== undefined
        ? String(updateData.duration)
        : undefined;

    // Update training register using the enhanced method
    await existingTrainingRegistar.updateTrainingRegister({
      training_name: updateData.training_name,
      duration: duration,
      provider: updateData.provider,
      department: updateData.department,
      status: updateData.status,
      numberOfPeople: updateData.numberOfPeople,
      description: updateData.description,
    });

    // Validate updated data
    await existingTrainingRegistar.validateTrainingRegisterData();

    const trainingRegistar = await updateTrainingRegistarByIdQuery(
      trainingRegistarId,
      existingTrainingRegistar.toJSON(),
      req.tenantId!,
      transaction
    );

    if (trainingRegistar) {
      await transaction.commit();

      await logSuccess({
        eventType: "Update",
        description: `Updated training register ID ${trainingRegistarId}`,
        functionName: "updateTrainingRegistarById",
        fileName: "trainingRegistar.ctrl.ts",
      });
      logStructured(
        "successful",
        `training register updated: ID ${trainingRegistarId}`,
        "updateTrainingRegistarById",
        "trainingRegistar.ctrl.ts"
      );
      await logEvent(
        "Update",
        `Training register updated: ID ${trainingRegistarId}, name: ${existingTrainingRegistar.training_name}`
      );
      return res.status(202).json(STATUS_CODE[202](trainingRegistar));
    }

    logStructured(
      "error",
      `failed to update training register: ID ${trainingRegistarId}`,
      "updateTrainingRegistarById",
      "trainingRegistar.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Training register update failed: ID ${trainingRegistarId}`
    );
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Failed to update training register"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "updateTrainingRegistarById",
        "trainingRegistar.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during training register update: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "updateTrainingRegistarById",
        "trainingRegistar.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during training register update: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    if (error instanceof NotFoundException) {
      logStructured(
        "error",
        `training register not found: ID ${trainingRegistarId}`,
        "updateTrainingRegistarById",
        "trainingRegistar.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Update failed — training register not found: ID ${trainingRegistarId}`
      );
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    await logFailure({
      eventType: "Update",
      description: "Failed to update training register",
      functionName: "updateTrainingRegistarById",
      fileName: "trainingRegistar.ctrl.ts",
      error: error as Error,
    });
    logStructured(
      "error",
      `unexpected error for training register ID ${trainingRegistarId}`,
      "updateTrainingRegistarById",
      "trainingRegistar.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during training register update for ID ${trainingRegistarId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in updateTrainingRegistarById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteTrainingRegistarById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const trainingRegistarId = parseInt(req.params.id);

  logProcessing({
    description: `starting deleteTrainingRegistarById for ID ${trainingRegistarId}`,
    functionName: "deleteTrainingRegistarById",
    fileName: "trainingRegistar.ctrl.ts",
  });
  logStructured(
    "processing",
    `attempting to delete training register ID ${trainingRegistarId}`,
    "deleteTrainingRegistarById",
    "trainingRegistar.ctrl.ts"
  );
  logger.debug(
    `🗑️ Delete request for training register ID ${trainingRegistarId}`
  );

  try {
    const deleteTrainingRegistar = await deleteTrainingRegistarByIdQuery(
      trainingRegistarId,
      req.tenantId!,
      transaction
    );

    if (deleteTrainingRegistar) {
      await transaction.commit();

      await logSuccess({
        eventType: "Delete",
        description: `Deleted training register ID ${trainingRegistarId}`,
        functionName: "deleteTrainingRegistarById",
        fileName: "trainingRegistar.ctrl.ts",
      });
      logStructured(
        "successful",
        `training register deleted: ID ${trainingRegistarId}`,
        "deleteTrainingRegistarById",
        "trainingRegistar.ctrl.ts"
      );
      await logEvent(
        "Delete",
        `Training register deleted: ID ${trainingRegistarId}`
      );
      return res.status(202).json(STATUS_CODE[202](deleteTrainingRegistar));
    }

    logStructured(
      "error",
      `training register not found: ID ${trainingRegistarId}`,
      "deleteTrainingRegistarById",
      "trainingRegistar.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Delete failed — training register not found: ID ${trainingRegistarId}`
    );
    await transaction.rollback();
    return res
      .status(404)
      .json(STATUS_CODE[404]("Training register not found"));
  } catch (error) {
    await transaction.rollback();

    await logFailure({
      eventType: "Delete",
      description: "Failed to delete training register",
      functionName: "deleteTrainingRegistarById",
      fileName: "trainingRegistar.ctrl.ts",
      error: error as Error,
    });
    logStructured(
      "error",
      `unexpected error deleting training register ID ${trainingRegistarId}`,
      "deleteTrainingRegistarById",
      "trainingRegistar.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during training register delete for ID ${trainingRegistarId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in deleteTrainingRegistarById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
