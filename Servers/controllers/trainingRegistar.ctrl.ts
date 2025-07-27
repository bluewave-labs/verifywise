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

// get ALL training registry api
export async function getAllTrainingRegistar(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const trainingRegistars = await getAllTrainingRegistarQuery(req.tenantId!);
    if (trainingRegistars) {
      return res.status(200).json(STATUS_CODE[200](trainingRegistars));
    }

    return res.status(204).json(STATUS_CODE[204](trainingRegistars));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// get BY ID training registry api
export async function getTrainingRegistarById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const trainingRegistarId = parseInt(req.params.id);

    const trainingRegistar = await getTrainingRegistarByIdQuery(
      trainingRegistarId,
      req.tenantId!
    );

    if (trainingRegistar) {
      return res.status(200).json(STATUS_CODE[200](trainingRegistar));
    }

    return res.status(404).json(STATUS_CODE[404](trainingRegistar));
  } catch (error) {
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

  try {
    // Create training register using the enhanced TrainingRegistarModel method
    const trainingRegistarModel =
      await TrainingRegistarModel.createNewTrainingRegister(
        trainingData.training_name,
        trainingData.duration,
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
      return res
        .status(201)
        .json(STATUS_CODE[201](trainingRegistarModel.toJSON()));
    }

    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Failed to create training register"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

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

  try {
    // Find existing training register with validation
    const existingTrainingRegistar =
      await TrainingRegistarModel.findByIdWithValidation(trainingRegistarId);

    if (!existingTrainingRegistar) {
      await transaction.rollback();
      return res
        .status(404)
        .json(STATUS_CODE[404]("Training register not found"));
    }

    // Update training register using the enhanced method
    await existingTrainingRegistar.updateTrainingRegister({
      training_name: updateData.training_name,
      duration: updateData.duration,
      provider: updateData.provider,
      department: updateData.department,
      status: updateData.status,
      numberOfPeople: updateData.numberOfPeople,
      description: updateData.description,
    });

    // Validate updated data
    await existingTrainingRegistar.validateTrainingRegisterData();

    // Map numberOfPeople to people for DB (if needed by the query)
    const updatedTrainingRegistar: any = {
      ...existingTrainingRegistar.toJSON(),
      people: existingTrainingRegistar.numberOfPeople,
    };
    delete updatedTrainingRegistar.numberOfPeople;

    const trainingRegistar = await updateTrainingRegistarByIdQuery(
      trainingRegistarId,
      updatedTrainingRegistar,
      req.tenantId!,
      transaction
    );

    if (trainingRegistar) {
      await transaction.commit();
      return res.status(202).json(STATUS_CODE[202](trainingRegistar));
    }

    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Failed to update training register"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    if (error instanceof NotFoundException) {
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteTrainingRegistarById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const trainingRegistarId = parseInt(req.params.id);
    const deleteTrainingRegistar = await deleteTrainingRegistarByIdQuery(
      trainingRegistarId,
      req.tenantId!,
      transaction
    );
    if (deleteTrainingRegistar) {
      await transaction.commit();
      return res.status(202).json(STATUS_CODE[202](deleteTrainingRegistar));
    }
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
