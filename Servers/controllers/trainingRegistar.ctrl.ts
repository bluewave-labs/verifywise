import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";

import {
  createNewTrainingRegistarQuery,
  getAllTrainingRegistarQuery,
  getTrainingRegistarByIdQuery,
  updateTrainingRegistarByIdQuery,
  deleteTrainingRegistarByIdQuery,
} from "../utils/trainingRegistar.utils";

import { TrainingRegistarModel } from "../domain.layer/models/trainingRegistar/trainingRegistar.model";
import { sequelize } from "../database/db";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";

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
  logger.debug("📚 Fetching all training registrars");

  try {
    const trainingRegistars = await getAllTrainingRegistarQuery(req.tenantId!);
    if (trainingRegistars) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved ${trainingRegistars.length} training registrars`,
        functionName: "getAllTrainingRegistar",
        fileName: "trainingRegistar.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](trainingRegistars));
    }

    await logSuccess({
      eventType: "Read",
      description: "No training registrars found",
      functionName: "getAllTrainingRegistar",
      fileName: "trainingRegistar.ctrl.ts",
    });
    return res.status(204).json(STATUS_CODE[204](trainingRegistars));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve training registrars",
      functionName: "getAllTrainingRegistar",
      fileName: "trainingRegistar.ctrl.ts",
      error: error as Error,
    });
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
    description: `starting getTrainingRegistarById for training registrar ID ${trainingRegistarId}`,
    functionName: "getTrainingRegistarById",
    fileName: "trainingRegistar.ctrl.ts",
  });
  logger.debug(`🔍 Looking up training registrar ID ${trainingRegistarId}`);

  try {
    const trainingRegistar = await getTrainingRegistarByIdQuery(
      trainingRegistarId,
      req.tenantId!
    );

    if (trainingRegistar) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved training registrar ID ${trainingRegistarId}`,
        functionName: "getTrainingRegistarById",
        fileName: "trainingRegistar.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](trainingRegistar));
    }

    await logSuccess({
      eventType: "Read",
      description: `Training registrar not found: ID ${trainingRegistarId}`,
      functionName: "getTrainingRegistarById",
      fileName: "trainingRegistar.ctrl.ts",
    });
    return res.status(404).json(STATUS_CODE[404](trainingRegistar));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to retrieve training registrar ID ${trainingRegistarId}`,
      functionName: "getTrainingRegistarById",
      fileName: "trainingRegistar.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// create new training registar
export async function createNewTrainingRegistar(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();

  logProcessing({
    description: "starting createNewTrainingRegistar",
    functionName: "createNewTrainingRegistar",
    fileName: "trainingRegistar.ctrl.ts",
  });
  logger.debug("🛠️ Creating new training registrar");

  try {
    const newTrainingRegistar: TrainingRegistarModel = req.body;

    if (
      !newTrainingRegistar.training_name ||
      !newTrainingRegistar.duration ||
      !newTrainingRegistar.department ||
      !newTrainingRegistar.numberOfPeople ||
      !newTrainingRegistar.provider ||
      !newTrainingRegistar.status
    ) {
      await logFailure({
        eventType: "Create",
        description: "Missing required fields for training registrar creation",
        functionName: "createNewTrainingRegistar",
        fileName: "trainingRegistar.ctrl.ts",
        error: new Error("Missing required fields"),
      });
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "Missing field from Training Registar",
        })
      );
    }

    const createdNewTrainingRegistar = await createNewTrainingRegistarQuery(
      newTrainingRegistar,
      req.tenantId!,
      transaction
    );

    if (createdNewTrainingRegistar) {
      await transaction.commit();
      await logSuccess({
        eventType: "Create",
        description: `Successfully created training registrar: ${newTrainingRegistar.training_name}`,
        functionName: "createNewTrainingRegistar",
        fileName: "trainingRegistar.ctrl.ts",
      });
      return res.status(201).json(STATUS_CODE[201](createdNewTrainingRegistar));
    }

    await transaction.rollback();
    await logFailure({
      eventType: "Create",
      description: "Failed to create training registrar",
      functionName: "createNewTrainingRegistar",
      fileName: "trainingRegistar.ctrl.ts",
      error: new Error("Creation failed"),
    });
    return res.status(503).json(STATUS_CODE[503]({}));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: "Create",
      description: "Failed to create training registrar",
      functionName: "createNewTrainingRegistar",
      fileName: "trainingRegistar.ctrl.ts",
      error: error as Error,
    });
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

  logProcessing({
    description: `starting updateTrainingRegistarById for training registrar ID ${trainingRegistarId}`,
    functionName: "updateTrainingRegistarById",
    fileName: "trainingRegistar.ctrl.ts",
  });
  logger.debug(`✏️ Updating training registrar ID ${trainingRegistarId}`);

  try {
    // Map numberOfPeople to people for DB
    const updatedTrainingRegistar: any = {
      ...req.body,
      people: req.body.numberOfPeople,
    };
    delete updatedTrainingRegistar.numberOfPeople;

    if (
      !updatedTrainingRegistar.training_name ||
      !updatedTrainingRegistar.department ||
      !updatedTrainingRegistar.duration ||
      !updatedTrainingRegistar.people ||
      !updatedTrainingRegistar.provider ||
      !updatedTrainingRegistar.status
    ) {
      await logFailure({
        eventType: "Update",
        description: `Missing required fields for updating training registrar ID ${trainingRegistarId}`,
        functionName: "updateTrainingRegistarById",
        fileName: "trainingRegistar.ctrl.ts",
        error: new Error("Missing required fields"),
      });
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "All the fields are required to be updated",
        })
      );
    }

    const trainingRegistar = await updateTrainingRegistarByIdQuery(
      trainingRegistarId,
      updatedTrainingRegistar,
      req.tenantId!,
      transaction
    );

    if (trainingRegistar) {
      await transaction.commit();
      await logSuccess({
        eventType: "Update",
        description: `Successfully updated training registrar ID ${trainingRegistarId}`,
        functionName: "updateTrainingRegistarById",
        fileName: "trainingRegistar.ctrl.ts",
      });
      return res.status(202).json(STATUS_CODE[202](trainingRegistar));
    }

    await transaction.rollback();
    await logFailure({
      eventType: "Update",
      description: `Training registrar not found: ID ${trainingRegistarId}`,
      functionName: "updateTrainingRegistarById",
      fileName: "trainingRegistar.ctrl.ts",
      error: new Error("Training registrar not found"),
    });
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: "Update",
      description: `Failed to update training registrar ID ${trainingRegistarId}`,
      functionName: "updateTrainingRegistarById",
      fileName: "trainingRegistar.ctrl.ts",
      error: error as Error,
    });
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
    description: `starting deleteTrainingRegistarById for training registrar ID ${trainingRegistarId}`,
    functionName: "deleteTrainingRegistarById",
    fileName: "trainingRegistar.ctrl.ts",
  });
  logger.debug(`🗑️ Deleting training registrar ID ${trainingRegistarId}`);

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
        description: `Successfully deleted training registrar ID ${trainingRegistarId}`,
        functionName: "deleteTrainingRegistarById",
        fileName: "trainingRegistar.ctrl.ts",
      });
      return res.status(202).json(STATUS_CODE[202](deleteTrainingRegistar));
    }

    await transaction.rollback();
    await logFailure({
      eventType: "Delete",
      description: `Training registrar not found: ID ${trainingRegistarId}`,
      functionName: "deleteTrainingRegistarById",
      fileName: "trainingRegistar.ctrl.ts",
      error: new Error("Training registrar not found"),
    });
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: "Delete",
      description: `Failed to delete training registrar ID ${trainingRegistarId}`,
      functionName: "deleteTrainingRegistarById",
      fileName: "trainingRegistar.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
