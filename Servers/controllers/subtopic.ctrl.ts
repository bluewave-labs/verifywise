import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewSubtopicQuery,
  deleteSubtopicByIdQuery,
  getAllSubtopicsQuery,
  getSubtopicByIdQuery,
  getSubTopicByTopicIdQuery,
  updateSubtopicByIdQuery,
} from "../utils/subtopic.utils";
import { Subtopic } from "../domain.layer/models/subtopic/subtopic.model";
import { sequelize } from "../database/db";

export async function getAllSubtopics(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const subtopics = await getAllSubtopicsQuery();

    if (subtopics) {
      return res.status(200).json(STATUS_CODE[200](subtopics));
    }

    return res.status(204).json(STATUS_CODE[204](subtopics));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getSubtopicById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const subtopicId = parseInt(req.params.id);

    const subtopic = await getSubtopicByIdQuery(subtopicId);

    if (subtopic) {
      return res.status(200).json(STATUS_CODE[200](subtopic));
    }

    return res.status(204).json(STATUS_CODE[204](subtopic));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createNewSubtopic(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const subtopic = await createNewSubtopicQuery(
      req.body as Subtopic,
      transaction
    );

    if (subtopic) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](subtopic));
    }

    return res.status(204).json(STATUS_CODE[204](subtopic));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateSubtopicById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const subtopicId = parseInt(req.params.id);

    const subtopic = await updateSubtopicByIdQuery(
      subtopicId,
      req.body as Subtopic,
      transaction
    );

    if (subtopic) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](subtopic));
    }

    return res.status(204).json(STATUS_CODE[204](subtopic));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteSubtopicById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const subtopicId = parseInt(req.params.id);

    const subtopic = await deleteSubtopicByIdQuery(subtopicId, transaction);

    if (subtopic) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](subtopic));
    }

    return res.status(204).json(STATUS_CODE[204](subtopic));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getSubtopicByTopicId(
  req: Request,
  res: Response
): Promise<any> {
  const topicId = parseInt(req.params.id);
  try {
    if (isNaN(topicId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid topic ID"));
    }

    const subtopics = await getSubTopicByTopicIdQuery(topicId);

    if (subtopics && subtopics.length !== 0) {
      return res.status(200).json(STATUS_CODE[200](subtopics));
    }

    return res.status(204).json(STATUS_CODE[204](subtopics));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
