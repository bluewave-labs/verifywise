import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewTopicQuery,
  deleteTopicByIdQuery,
  getAllTopicsQuery,
  getTopicByAssessmentIdQuery,
  getTopicByIdQuery,
  updateTopicByIdQuery,
} from "../utils/topic.utils";
import {
  createNewQuestionQuery,
  RequestWithFile,
} from "../utils/question.utils";
import { createNewSubtopicQuery } from "../utils/subtopic.utils";
import { Topic } from "../domain.layer/models/topic/topic.model";
import { sequelize } from "../database/db";

export async function getAllTopics(req: Request, res: Response): Promise<any> {
  try {
    const topics = await getAllTopicsQuery();

    if (topics) {
      return res.status(200).json(STATUS_CODE[200](topics));
    }

    return res.status(204).json(STATUS_CODE[204](topics));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getTopicById(req: Request, res: Response): Promise<any> {
  try {
    const topicId = parseInt(req.params.id);

    const topic = await getTopicByIdQuery(topicId);

    if (topic) {
      return res.status(200).json(STATUS_CODE[200](topic));
    }

    return res.status(204).json(STATUS_CODE[204](topic));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createNewTopic(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const newTopic: Topic = req.body;

    const createdTopic = await createNewTopicQuery(newTopic, transaction);

    if (createdTopic) {
      await transaction.commit();
      return res.status(201).json(STATUS_CODE[201](createdTopic));
    }

    return res.status(204).json(STATUS_CODE[204]({}));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateTopicById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const topicId = parseInt(req.params.id);
    const updatedTopic: Topic = req.body;

    const topic = await updateTopicByIdQuery(
      topicId,
      updatedTopic,
      transaction
    );

    if (topic) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](topic));
    }

    return res.status(204).json(STATUS_CODE[204](topic));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteTopicById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const topicId = parseInt(req.params.id);

    const topic = await deleteTopicByIdQuery(topicId, transaction);

    if (topic) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](topic));
    }

    return res.status(204).json(STATUS_CODE[204](topic));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getTopicByAssessmentId(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const assessmentId = parseInt(req.params.id);

    if (isNaN(assessmentId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid assessment ID"));
    }

    const topics = await getTopicByAssessmentIdQuery(assessmentId);

    if (topics && topics.length > 0) {
      return res.status(200).json(STATUS_CODE[200](topics));
    }

    return res.status(204).json(STATUS_CODE[204](topics));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
