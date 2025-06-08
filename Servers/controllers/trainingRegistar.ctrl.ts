import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";

import {
  createNewTrainingRegistarQuery,
  getAllTrainingRegistarQuery,
  getTrainingRegistarByIdQuery,
  updateTrainingRegistarByIdQuery,
  deleteTrainingRegistarByIdQuery,
} from "../utils/trainingRegistar.utils";

import { TrainingRegistar } from "../models/trainingRegistar.model";
import { sequelize } from "../database/db";

// get ALL training registry api
export async function getAllTrainingRegistar(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const trainingRegistars = await getAllTrainingRegistarQuery();
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
      trainingRegistarId
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

  try {
    const newTrainingRegistar: TrainingRegistar = req.body;

    if (
      !newTrainingRegistar.training_name ||
      !newTrainingRegistar.duration ||
      !newTrainingRegistar.department ||
      !newTrainingRegistar.numberOfPeople ||
      !newTrainingRegistar.provider ||
      !newTrainingRegistar.status
    ) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "Missing field from Training Registar",
        })
      );
    }

    const createdNewTrainingRegistar = await createNewTrainingRegistarQuery(
      newTrainingRegistar,
      transaction
    );

    if (createdNewTrainingRegistar) {
      await transaction.commit();
      return res.status(201).json(STATUS_CODE[201](createdNewTrainingRegistar));
    }

    return res.status(503).json(STATUS_CODE[503]({}));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

//update a particular training registar by id

export async function updateTrainingRegistarById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("updateTrainingRegistarById 1");
  const transaction = await sequelize.transaction();
  console.log("updateTrainingRegistarById 2");
  try {
    console.log("updateTrainingRegistarById 3");
    const trainingRegistarId = parseInt(req.params.id);
    console.log("updateTrainingRegistarById 4");
    // Map numberOfPeople to people for DB
    const updatedTrainingRegistar: any = {
      ...req.body,
      people: req.body.numberOfPeople,
    };
    delete updatedTrainingRegistar.numberOfPeople;
    console.log("updateTrainingRegistarById 5");
    console.log("Request body:", updatedTrainingRegistar);
    if (
      !updatedTrainingRegistar.training_name ||
      !updatedTrainingRegistar.department ||
      !updatedTrainingRegistar.duration ||
      !updatedTrainingRegistar.people ||
      !updatedTrainingRegistar.provider ||
      !updatedTrainingRegistar.status
    ) {
      console.log("updateTrainingRegistarById 6");
      console.log("Validation failed. Missing fields:", {
        training_name: !updatedTrainingRegistar.training_name,
        department: !updatedTrainingRegistar.department,
        duration: !updatedTrainingRegistar.duration,
        people: !updatedTrainingRegistar.people,
        provider: !updatedTrainingRegistar.provider,
        status: !updatedTrainingRegistar.status,
      });
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "All the fields are required to be updated",
        })
      );
    }
    console.log("updateTrainingRegistarById 7");
    console.log("Updating training with ID:", trainingRegistarId);
    const trainingRegistar = await updateTrainingRegistarByIdQuery(
      trainingRegistarId,
      updatedTrainingRegistar,
      transaction
    );
    console.log("updateTrainingRegistarById 8");
    if (trainingRegistar) {
      await transaction.commit();
      console.log("updateTrainingRegistarById 9");
      return res.status(202).json(STATUS_CODE[202](trainingRegistar));
    }
    console.log("updateTrainingRegistarById 10");
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    console.log("updateTrainingRegistarById 11");
    console.log("Error details:", error);
    await transaction.rollback();
    console.log("updateTrainingRegistarById 12");
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
