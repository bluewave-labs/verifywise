import { Request, Response } from "express";
import { Assessment } from "../models/assessment.model";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockAssessment,
  deleteMockAssessmentById,
  getAllMockAssessments,
  getMockAssessmentById,
  updateMockAssessmentById,
} from "../mocks/tools/assessment.mock.db";
import {
  createNewAssessmentQuery,
  deleteAssessmentByIdQuery,
  getAllAssessmentsQuery,
  getAssessmentByIdQuery,
  updateAssessmentByIdQuery,
} from "../utils/assessment.utils";

export async function getAllAssessments(
  req: Request,
  res: Response
): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const assessments = getAllMockAssessments();

      if (assessments) {
        return res.status(200).json(STATUS_CODE[200](assessments));
      }

      return res.status(204).json(STATUS_CODE[204](assessments));
    } else {
      const assessments = await getAllAssessmentsQuery();

      if (assessments) {
        return res.status(200).json(STATUS_CODE[200](assessments));
      }

      return res.status(204).json(STATUS_CODE[204](assessments));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAssessmentById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const assessmentId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const assessment = getMockAssessmentById(assessmentId);

      if (assessment) {
        return res.status(200).json(STATUS_CODE[200](assessment));
      }

      return res.status(404).json(STATUS_CODE[404](assessment));
    } else {
      const assessment = await getAssessmentByIdQuery(assessmentId);

      if (assessment) {
        return res.status(200).json(STATUS_CODE[200](assessment));
      }

      return res.status(404).json(STATUS_CODE[404](assessment));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createAssessment(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const newAssessment: {
      projectId: number;
    } = req.body;

    if (!newAssessment.projectId) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "projectId is required",
        })
      );
    }

    if (MOCK_DATA_ON === "true") {
      const createdAssessment = createMockAssessment(newAssessment);

      if (createdAssessment) {
        return res.status(201).json(STATUS_CODE[201](createdAssessment));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const createdAssessment = await createNewAssessmentQuery(newAssessment);

      if (createdAssessment) {
        return res.status(201).json(STATUS_CODE[201](createdAssessment));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateAssessmentById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const assessmentId = parseInt(req.params.id);
    const updatedAssessment: {
      projectId: number;
    } = req.body;

    if (!updatedAssessment.projectId) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "projectId is required",
        })
      );
    }

    if (MOCK_DATA_ON === "true") {
      const assessment = updateMockAssessmentById(
        assessmentId,
        updatedAssessment
      );

      if (assessment) {
        return res.status(202).json(STATUS_CODE[202](assessment));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const assessment = await updateAssessmentByIdQuery(
        assessmentId,
        updatedAssessment
      );

      if (assessment) {
        return res.status(202).json(STATUS_CODE[202](assessment));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteAssessmentById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const assessmentId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const deletedAssessment = deleteMockAssessmentById(assessmentId);

      if (deletedAssessment) {
        return res.status(202).json(STATUS_CODE[202](deletedAssessment));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedAssessment = await deleteAssessmentByIdQuery(assessmentId);

      if (deletedAssessment) {
        return res.status(202).json(STATUS_CODE[202](deletedAssessment));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
