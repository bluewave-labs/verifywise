import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockAssessmentTracker,
  deleteMockAssessmentTrackerById,
  getAllMockAssessmentTrackers,
  getMockAssessmentTrackerById,
  updateMockAssessmentTrackerById
} from "../mocks/tools/assessmentTracker.mock.db"
import {
  createNewAssessmentTrackerQuery,
  deleteAssessmentTrackerByIdQuery,
  getAllAssessmentTrackersQuery,
  getAssessmentTrackerByIdQuery,
  updateAssessmentTrackerByIdQuery
} from "../utils/assessmentTracker.util";

export async function getAllAssessmentTrackers(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const assessmentTrackers = getAllMockAssessmentTrackers();

      if (assessmentTrackers) {
        return res.status(200).json(STATUS_CODE[200](assessmentTrackers));
      }

      return res.status(204).json(STATUS_CODE[204](assessmentTrackers));
    } else {
      const assessmentTrackers = await getAllAssessmentTrackersQuery();

      if (assessmentTrackers) {
        return res.status(200).json(STATUS_CODE[200](assessmentTrackers));
      }

      return res.status(204).json(STATUS_CODE[204](assessmentTrackers));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAssessmentTrackerById(req: Request, res: Response): Promise<any> {
  try {
    const assessmentTrackerId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const assessmentTracker = getMockAssessmentTrackerById(assessmentTrackerId);

      if (assessmentTracker) {
        return res.status(200).json(STATUS_CODE[200](assessmentTracker));
      }

      return res.status(404).json(STATUS_CODE[404](assessmentTracker));
    } else {
      const assessmentTracker = await getAssessmentTrackerByIdQuery(assessmentTrackerId);

      if (assessmentTracker) {
        return res.status(200).json(STATUS_CODE[200](assessmentTracker));
      }

      return res.status(404).json(STATUS_CODE[404](assessmentTracker));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createAssessmentTracker(req: Request, res: Response): Promise<any> {
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
      const newAssessmentTracker = createMockAssessmentTracker({ name, description });

      if (newAssessmentTracker) {
        return res.status(201).json(STATUS_CODE[201](newAssessmentTracker));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const newAssessmentTracker = await createNewAssessmentTrackerQuery({ name, description });

      if (newAssessmentTracker) {
        return res.status(201).json(STATUS_CODE[201](newAssessmentTracker));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateAssessmentTrackerById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("updateAssessmentTrackerById");
  try {
    const assessmentTrackerId = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "name and description are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const updatedAssessmentTracker = updateMockAssessmentTrackerById(assessmentTrackerId, { name, description });

      if (updatedAssessmentTracker) {
        return res.status(202).json(STATUS_CODE[202](updatedAssessmentTracker));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const updatedAssessmentTracker = await updateAssessmentTrackerByIdQuery(assessmentTrackerId, {
        name,
        description,
      });

      if (updatedAssessmentTracker) {
        return res.status(202).json(STATUS_CODE[202](updatedAssessmentTracker));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteAssessmentTrackerById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const assessmentTrackerId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const deletedAssessmentTracker = deleteMockAssessmentTrackerById(assessmentTrackerId);

      if (deletedAssessmentTracker) {
        return res.status(202).json(STATUS_CODE[202](deletedAssessmentTracker));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedAssessmentTracker = await deleteAssessmentTrackerByIdQuery(assessmentTrackerId);

      if (deletedAssessmentTracker) {
        return res.status(202).json(STATUS_CODE[202](deletedAssessmentTracker));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
