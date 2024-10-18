import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";

import {
  createMockQuestionEvidence,
  deleteMockQuestionEvidenceById,
  getMockQuestionEvidenceById,
  getAllMockQuestionEvidence,
  updateMockQuestionEvidenceById,
} from "../mocks/tools/questionEvidence.mock.db";

import {
  createNewQuestionEvidenceQuery,
  deleteQuestionEvidenceByIdQuery,
  getQuestionEvidenceByIdQuery,
  getAllQuestionEvidencesQuery,
  updateQuestionEvidenceByIdQuery,
} from "../utils/questionEvidence.util";

export async function getQuestionEvidenceById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const questionEvidenceId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const questionEvidence = getMockQuestionEvidenceById(questionEvidenceId);

      if (questionEvidence) {
        return res.status(200).json(STATUS_CODE[200](questionEvidence));
      }

      return res.status(404).json(STATUS_CODE[404](questionEvidence));
    } else {
      const questionEvidence = await getQuestionEvidenceByIdQuery(
        questionEvidenceId
      );

      if (questionEvidence) {
        return res.status(200).json(STATUS_CODE[200](questionEvidence));
      }

      return res.status(404).json(STATUS_CODE[404](questionEvidence));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllQuestionEvidences(
  req: Request,
  res: Response
): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const questionEvidences = getAllMockQuestionEvidence();

      if (questionEvidences) {
        return res.status(200).json(STATUS_CODE[200](questionEvidences));
      }

      return res.status(204).json(STATUS_CODE[204](questionEvidences));
    } else {
      const questionEvidences = await getAllQuestionEvidencesQuery();

      if (questionEvidences) {
        return res.status(200).json(STATUS_CODE[200](questionEvidences));
      }

      return res.status(204).json(STATUS_CODE[204](questionEvidences));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createQuestionEvidence(
  req: Request,
  res: Response
): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const newQuestionEvidence = createMockQuestionEvidence(req.body);

      if (newQuestionEvidence) {
        return res.status(201).json(STATUS_CODE[201](newQuestionEvidence));
      }

      return res.status(400).json(STATUS_CODE[400](newQuestionEvidence));
    } else {
      const newQuestionEvidence = await createNewQuestionEvidenceQuery(
        req.body
      );

      if (newQuestionEvidence) {
        return res.status(201).json(STATUS_CODE[201](newQuestionEvidence));
      }

      return res.status(400).json(STATUS_CODE[400](newQuestionEvidence));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateQuestionEvidenceById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const questionEvidenceId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const updatedQuestionEvidence = updateMockQuestionEvidenceById(
        questionEvidenceId,
        req.body
      );

      if (updatedQuestionEvidence) {
        return res.status(200).json(STATUS_CODE[200](updatedQuestionEvidence));
      }

      return res.status(400).json(STATUS_CODE[400](updatedQuestionEvidence));
    } else {
      const updatedQuestionEvidence = await updateQuestionEvidenceByIdQuery(
        questionEvidenceId,
        req.body
      );

      if (updatedQuestionEvidence) {
        return res.status(200).json(STATUS_CODE[200](updatedQuestionEvidence));
      }

      return res.status(400).json(STATUS_CODE[400](updatedQuestionEvidence));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteQuestionEvidenceById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const questionEvidenceId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const deletedQuestionEvidence =
        deleteMockQuestionEvidenceById(questionEvidenceId);

      if (deletedQuestionEvidence) {
        return res.status(200).json(STATUS_CODE[200](deletedQuestionEvidence));
      }

      return res.status(400).json(STATUS_CODE[400](deletedQuestionEvidence));
    } else {
      const deletedQuestionEvidence = await deleteQuestionEvidenceByIdQuery(
        questionEvidenceId
      );

      if (deletedQuestionEvidence) {
        return res.status(200).json(STATUS_CODE[200](deletedQuestionEvidence));
      }

      return res.status(400).json(STATUS_CODE[400](deletedQuestionEvidence));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
