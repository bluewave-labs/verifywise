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
  const transaction = await sequelize.transaction();
  try {
    const trainingRegistarId = parseInt(req.params.id);
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
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "All the fields are required to be updated",
        })
      );
    }
    const trainingRegistar = await updateTrainingRegistarByIdQuery(
      trainingRegistarId,
      updatedTrainingRegistar,
      transaction
    );
    if (trainingRegistar) {
      await transaction.commit();
      return res.status(202).json(STATUS_CODE[202](trainingRegistar));
    }
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteTrainingRegistarById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("ID from the params.id:", req.params.id);
  console.log("Request body:", req.body);
  console.log("deleteTrainingRegistarById 1");
  const transaction = await sequelize.transaction();
  try {
    const trainingRegistarId = parseInt(req.params.id);
    console.log("deleteTrainingRegistarById 2");
    const deleteTrainingRegistar = await deleteTrainingRegistarByIdQuery(
      trainingRegistarId,
      transaction
    );
    console.log("deleteTrainingRegistarById 3");
    if (deleteTrainingRegistar) {
      console.log("deleteTrainingRegistarById 4");
      await transaction.commit();
      console.log("deleteTrainingRegistarById 5");
      return res.status(202).json(STATUS_CODE[202](deleteTrainingRegistar));
    }
    console.log("deleteTrainingRegistarById 6");
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    console.log("deleteTrainingRegistarById 7");
    await transaction.rollback();
    console.log("deleteTrainingRegistarById 8");
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
