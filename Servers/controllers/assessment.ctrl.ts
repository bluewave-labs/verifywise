import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";

import {
  createNewAssessmentQuery,
  deleteAssessmentByIdQuery,
  getAllAssessmentsQuery,
  getAssessmentByIdQuery,
  getAssessmentByProjectIdQuery,
  updateAssessmentByIdQuery,
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
import {
  Assessment,
  AssessmentModel,
} from "../domain.layer/models/assessment/assessment.model";
import { TopicModel } from "../domain.layer/models/topic/topic.model";
import { SubtopicModel } from "../domain.layer/models/subtopic/subtopic.model";
import { sequelize } from "../database/db";

export async function getAllAssessments(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const assessments = await getAllAssessmentsQuery(req.tenantId!);

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
    const assessment = await getAssessmentByIdQuery(assessmentId, req.tenantId!);

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
    const newAssessment: Assessment = req.body;

    if (!newAssessment.project_id) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "projectId is required",
        })
      );
    }
    const createdAssessment = await createNewAssessmentQuery(
      newAssessment,
      false,
      req.tenantId!,
      transaction
    );

    if (createdAssessment) {
      await transaction.commit();
      return res.status(201).json(STATUS_CODE[201](createdAssessment));
    }

    return res.status(503).json(STATUS_CODE[503]({}));
  } catch (error) {
    await transaction.rollback();
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
    const updatedAssessment: Assessment = req.body;

    if (!updatedAssessment.project_id) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "projectId is required",
        })
      );
    }
    const assessment = await updateAssessmentByIdQuery(
      assessmentId,
      updatedAssessment,
      req.tenantId!,
      transaction
    );

    if (assessment) {
      await transaction.commit();
      return res.status(202).json(STATUS_CODE[202](assessment));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
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
      req.tenantId!,
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
      assessmentId, req.tenantId!
    )) as AssessmentModel;
    const topics = (await getTopicByAssessmentIdQuery(
      assessment!.id!, req.tenantId!
    )) as TopicModel[];
    for (let topic of topics) {
      const subTopics = (await getSubTopicByTopicIdQuery(
        topic.id!, req.tenantId!
      )) as SubtopicModel[];

      for (let subTopic of subTopics) {
        const questions = await getQuestionBySubTopicIdQuery(subTopic.id!, req.tenantId!);
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
    const assessments = await getAssessmentByProjectIdQuery(projectId, req.tenantId!);
    if (assessments && assessments.length !== 0) {
      return res.status(200).json(STATUS_CODE[200](assessments));
    } else {
      return res.status(204).json(STATUS_CODE[204]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
