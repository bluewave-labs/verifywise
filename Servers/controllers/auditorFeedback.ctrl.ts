import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockAuditorFeedback,
  deleteMockAuditorFeedbackById,
  getAllMockAuditorFeedbacks,
  getMockAuditorFeedbackById,
  updateMockAuditorFeedbackById
} from "../mocks/tools/auditorFeedback.mock.db"
import {
  createNewAuditorFeedbackQuery,
  deleteAuditorFeedbackByIdQuery,
  getAllAuditorFeedbacksQuery,
  getAuditorFeedbackByIdQuery,
  updateAuditorFeedbackByIdQuery
} from "../utils/auditorFeedback.util";

export async function getAllAuditorFeedbacks(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const auditorFeedbacks = getAllMockAuditorFeedbacks();

      if (auditorFeedbacks) {
        return res.status(200).json(STATUS_CODE[200](auditorFeedbacks));
      }

      return res.status(204).json(STATUS_CODE[204](auditorFeedbacks));
    } else {
      const auditorFeedbacks = await getAllAuditorFeedbacksQuery();

      if (auditorFeedbacks) {
        return res.status(200).json(STATUS_CODE[200](auditorFeedbacks));
      }

      return res.status(204).json(STATUS_CODE[204](auditorFeedbacks));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAuditorFeedbackById(req: Request, res: Response): Promise<any> {
  try {
    const auditorFeedbackId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const auditorFeedback = getMockAuditorFeedbackById(auditorFeedbackId);

      if (auditorFeedback) {
        return res.status(200).json(STATUS_CODE[200](auditorFeedback));
      }

      return res.status(404).json(STATUS_CODE[404](auditorFeedback));
    } else {
      const auditorFeedback = await getAuditorFeedbackByIdQuery(auditorFeedbackId);

      if (auditorFeedback) {
        return res.status(200).json(STATUS_CODE[200](auditorFeedback));
      }

      return res.status(404).json(STATUS_CODE[404](auditorFeedback));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createAuditorFeedback(req: Request, res: Response): Promise<any> {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "name and description are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const newAuditorFeedback = createMockAuditorFeedback({ name, description });

      if (newAuditorFeedback) {
        return res.status(201).json(STATUS_CODE[201](newAuditorFeedback));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const newAuditorFeedback = await createNewAuditorFeedbackQuery({ name, description });

      if (newAuditorFeedback) {
        return res.status(201).json(STATUS_CODE[201](newAuditorFeedback));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateAuditorFeedbackById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("updateAuditorFeedbackById");
  try {
    const auditorFeedbackId = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "name and description are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const updatedAuditorFeedback = updateMockAuditorFeedbackById(auditorFeedbackId, { name, description });

      if (updatedAuditorFeedback) {
        return res.status(202).json(STATUS_CODE[202](updatedAuditorFeedback));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const updatedAuditorFeedback = await updateAuditorFeedbackByIdQuery(auditorFeedbackId, {
        name,
        description,
      });

      if (updatedAuditorFeedback) {
        return res.status(202).json(STATUS_CODE[202](updatedAuditorFeedback));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteAuditorFeedbackById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const auditorFeedbackId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const deletedAuditorFeedback = deleteMockAuditorFeedbackById(auditorFeedbackId);

      if (deletedAuditorFeedback) {
        return res.status(202).json(STATUS_CODE[202](deletedAuditorFeedback));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedAuditorFeedback = await deleteAuditorFeedbackByIdQuery(auditorFeedbackId);

      if (deletedAuditorFeedback) {
        return res.status(202).json(STATUS_CODE[202](deletedAuditorFeedback));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
