import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";

import {
  deleteAssessmentByIdQuery,
  getAllAssessmentsQuery,
  getAssessmentByIdQuery,
  getAssessmentByProjectIdQuery,
} from "../utils/assessment.utils";
import {
  createNewTopicQuery,
  getTopicByAssessmentIdQuery,
  updateTopicByIdQuery,
} from "../utils/topic.utils";
import {
  createNewSubtopicQuery,
  getSubTopicByTopicIdQuery,
  updateSubtopicByIdQuery,
} from "../utils/subtopic.utils";
import {
  createNewQuestionQuery,
  getQuestionBySubTopicIdQuery,
  RequestWithFile,
  updateQuestionByIdQuery,
  UploadedFile,
} from "../utils/question.utils";
import { AssessmentModel } from "../domain.layer/models/assessment/assessment.model";
import { TopicModel } from "../domain.layer/models/topic/topic.model";
import { SubtopicModel } from "../domain.layer/models/subtopic/subtopic.model";
import { sequelize } from "../database/db";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";

export async function getAllAssessments(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const assessments = await getAllAssessmentsQuery();

    if (assessments) {
      return res.status(200).json(STATUS_CODE[200](assessments));
    }

    return res.status(204).json(STATUS_CODE[204](assessments));
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
    const assessment = await getAssessmentByIdQuery(assessmentId);

    if (assessment) {
      return res.status(200).json(STATUS_CODE[200](assessment));
    }

    return res.status(404).json(STATUS_CODE[404](assessment));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createAssessment(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const assessmentData = req.body;

    // Validate required fields
    if (!assessmentData.project_id) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "project_id is required",
          field: "project_id",
        })
      );
    }

    // Use AssessmentModel's CreateNewAssessment method
    const createdAssessment = await AssessmentModel.CreateNewAssessment(
      assessmentData
    );

    if (createdAssessment) {
      await transaction.commit();
      return res.status(201).json(
        STATUS_CODE[201]({
          message: "Assessment created successfully",
          assessment: createdAssessment.toSafeJSON(),
        })
      );
    }

    await transaction.rollback();
    return res.status(503).json(
      STATUS_CODE[503]({
        message: "Failed to create assessment",
      })
    );
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating assessment:", error);

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error));
    }

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateAssessmentById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const assessmentId = parseInt(req.params.id);
    const assessmentData = req.body;

    if (isNaN(assessmentId)) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "Invalid assessment ID provided",
          field: "id",
          value: req.params.id,
        })
      );
    }

    // Validate required fields
    if (!assessmentData.project_id) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "project_id is required",
          field: "project_id",
        })
      );
    }

    // Use AssessmentModel's UpdateAssessment method
    const [updatedCount, updatedAssessments] =
      await AssessmentModel.UpdateAssessment(assessmentId, assessmentData);

    if (updatedCount > 0 && updatedAssessments.length > 0) {
      await transaction.commit();
      return res.status(202).json(
        STATUS_CODE[202]({
          message: "Assessment updated successfully",
          assessment: updatedAssessments[0].toSafeJSON(),
        })
      );
    }

    await transaction.rollback();
    return res.status(404).json(
      STATUS_CODE[404]({
        message: "Assessment not found or no changes made",
        assessmentId: assessmentId,
      })
    );
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating assessment:", error);

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error));
    }

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteAssessmentById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const assessmentId = parseInt(req.params.id);
    const deletedAssessment = await deleteAssessmentByIdQuery(
      assessmentId,
      transaction
    );

    if (deletedAssessment) {
      await transaction.commit();
      return res.status(202).json(STATUS_CODE[202](deletedAssessment));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAnswers(req: Request, res: Response): Promise<any> {
  try {
    const assessmentId = parseInt(req.params.id);
    const assessment = (await getAssessmentByIdQuery(
      assessmentId
    )) as AssessmentModel;
    const topics = (await getTopicByAssessmentIdQuery(
      assessment!.id!
    )) as TopicModel[];
    for (let topic of topics) {
      const subTopics = (await getSubTopicByTopicIdQuery(
        topic.id!
      )) as SubtopicModel[];

      for (let subTopic of subTopics) {
        const questions = await getQuestionBySubTopicIdQuery(subTopic.id!);
        (subTopic.dataValues as any)["questions"] = questions;
      }
      (topic.dataValues as any)["subTopics"] = subTopics;
    }
    (assessment.dataValues as any)["topics"] = topics;

    return res.status(200).json(STATUS_CODE[200]({ message: assessment }));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAssessmentByProjectId(req: Request, res: Response) {
  const projectId = parseInt(req.params.id);
  try {
    const assessments = await getAssessmentByProjectIdQuery(projectId);
    if (assessments && assessments.length !== 0) {
      return res.status(200).json(STATUS_CODE[200](assessments));
    } else {
      return res.status(204).json(STATUS_CODE[204]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
