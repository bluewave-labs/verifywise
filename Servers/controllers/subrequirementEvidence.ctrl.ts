import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";

import {
  createMockSubrequirementEvidence,
  deleteMockSubrequirementEvidenceById,
  getMockSubrequirementEvidenceById,
  getAllMockSubrequirementEvidences,
  updateMockSubrequirementEvidenceById,
} from "../mocks/tools/subrequirementEvidence.mock.db";

import {
  createNewSubrequirementEvidenceQuery,
  deleteSubrequirementEvidenceByIdQuery,
  getSubrequirementEvidenceByIdQuery,
  getAllSubrequirementEvidencesQuery,
  updateSubrequirementEvidenceByIdQuery,
} from "../utils/subrequirementEvidence.util";

export async function getSubrequirementEvidenceById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const subrequirementEvidenceId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const subrequirementEvidence = getMockSubrequirementEvidenceById(
        subrequirementEvidenceId
      );

      if (subrequirementEvidence) {
        return res.status(200).json(STATUS_CODE[200](subrequirementEvidence));
      }

      return res.status(404).json(STATUS_CODE[404](subrequirementEvidence));
    } else {
      const subrequirementEvidence = await getSubrequirementEvidenceByIdQuery(
        subrequirementEvidenceId
      );

      if (subrequirementEvidence) {
        return res.status(200).json(STATUS_CODE[200](subrequirementEvidence));
      }

      return res.status(404).json(STATUS_CODE[404](subrequirementEvidence));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllSubrequirementEvidences(
  req: Request,
  res: Response
): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const subrequirementEvidences = getAllMockSubrequirementEvidences();

      return res.status(200).json(STATUS_CODE[200](subrequirementEvidences));
    } else {
      const subrequirementEvidences =
        await getAllSubrequirementEvidencesQuery();

      return res.status(200).json(STATUS_CODE[200](subrequirementEvidences));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createSubrequirementEvidence(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const newSubrequirementEvidence = req.body;

    if (MOCK_DATA_ON === "true") {
      const subrequirementEvidence = createMockSubrequirementEvidence(
        newSubrequirementEvidence
      );

      return res.status(201).json(STATUS_CODE[201](subrequirementEvidence));
    } else {
      const subrequirementEvidence = await createNewSubrequirementEvidenceQuery(
        newSubrequirementEvidence
      );

      return res.status(201).json(STATUS_CODE[201](subrequirementEvidence));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateSubrequirementEvidenceById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const subrequirementEvidenceId = parseInt(req.params.id);
    const updatedSubrequirementEvidence = req.body;

    if (MOCK_DATA_ON === "true") {
      const subrequirementEvidence = updateMockSubrequirementEvidenceById(
        subrequirementEvidenceId,
        updatedSubrequirementEvidence
      );

      if (subrequirementEvidence) {
        return res.status(200).json(STATUS_CODE[200](subrequirementEvidence));
      }

      return res.status(404).json(STATUS_CODE[404](subrequirementEvidence));
    } else {
      const subrequirementEvidence =
        await updateSubrequirementEvidenceByIdQuery(
          subrequirementEvidenceId,
          updatedSubrequirementEvidence
        );

      if (subrequirementEvidence) {
        return res.status(200).json(STATUS_CODE[200](subrequirementEvidence));
      }

      return res.status(404).json(STATUS_CODE[404](subrequirementEvidence));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteSubrequirementEvidenceById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const subrequirementEvidenceId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const subrequirementEvidence = deleteMockSubrequirementEvidenceById(
        subrequirementEvidenceId
      );

      if (subrequirementEvidence) {
        return res.status(200).json(STATUS_CODE[200](subrequirementEvidence));
      }

      return res.status(404).json(STATUS_CODE[404](subrequirementEvidence));
    } else {
      const subrequirementEvidence =
        await deleteSubrequirementEvidenceByIdQuery(subrequirementEvidenceId);

      if (subrequirementEvidence) {
        return res.status(200).json(STATUS_CODE[200](subrequirementEvidence));
      }

      return res.status(404).json(STATUS_CODE[404](subrequirementEvidence));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
