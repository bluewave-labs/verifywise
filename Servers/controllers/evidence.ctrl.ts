import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockEvidence,
  deleteMockEvidenceById,
  getAllMockEvidences,
  getMockEvidenceById,
  updateMockEvidenceById
} from "../mocks/tools/evidence.mock.db"
import {
  createNewEvidenceQuery,
  deleteEvidenceByIdQuery,
  getAllEvidencesQuery,
  getEvidenceByIdQuery,
  updateEvidenceByIdQuery
} from "../utils/evidence.util";

export async function getAllEvidences(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const evidences = getAllMockEvidences();

      if (evidences) {
        return res.status(200).json(STATUS_CODE[200](evidences));
      }

      return res.status(204).json(STATUS_CODE[204](evidences));
    } else {
      const evidences = await getAllEvidencesQuery();

      if (evidences) {
        return res.status(200).json(STATUS_CODE[200](evidences));
      }

      return res.status(204).json(STATUS_CODE[204](evidences));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getEvidenceById(req: Request, res: Response): Promise<any> {
  try {
    const evidenceId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const evidence = getMockEvidenceById(evidenceId);

      if (evidence) {
        return res.status(200).json(STATUS_CODE[200](evidence));
      }

      return res.status(404).json(STATUS_CODE[404](evidence));
    } else {
      const evidence = await getEvidenceByIdQuery(evidenceId);

      if (evidence) {
        return res.status(200).json(STATUS_CODE[200](evidence));
      }

      return res.status(404).json(STATUS_CODE[404](evidence));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createEvidence(req: Request, res: Response): Promise<any> {
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
      const newEvidence = createMockEvidence({ name, description });

      if (newEvidence) {
        return res.status(201).json(STATUS_CODE[201](newEvidence));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const newEvidence = await createNewEvidenceQuery({ name, description });

      if (newEvidence) {
        return res.status(201).json(STATUS_CODE[201](newEvidence));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateEvidenceById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("updateEvidenceById");
  try {
    const evidenceId = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "name and description are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const updatedEvidence = updateMockEvidenceById(evidenceId, { name, description });

      if (updatedEvidence) {
        return res.status(202).json(STATUS_CODE[202](updatedEvidence));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const updatedEvidence = await updateEvidenceByIdQuery(evidenceId, {
        name,
        description,
      });

      if (updatedEvidence) {
        return res.status(202).json(STATUS_CODE[202](updatedEvidence));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteEvidenceById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const evidenceId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const deletedEvidence = deleteMockEvidenceById(evidenceId);

      if (deletedEvidence) {
        return res.status(202).json(STATUS_CODE[202](deletedEvidence));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedEvidence = await deleteEvidenceByIdQuery(evidenceId);

      if (deletedEvidence) {
        return res.status(202).json(STATUS_CODE[202](deletedEvidence));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
