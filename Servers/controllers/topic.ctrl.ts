import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewTopicQuery,
  deleteTopicByIdQuery,
  getAllTopicsQuery,
  getTopicByIdQuery,
  updateTopicByIdQuery,
} from "../utils/topic.utils";
import {
  createNewQuestionQuery,
  RequestWithFile,
} from "../utils/question.utils";
import { createNewSubtopicQuery } from "../utils/subtopic.utils";

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
  console.log("Create topics", req.body);
  try {
    const newTopic: {
      id: number;
      assessmentId: number;
      title: string;
    } = req.body;

    const createdTopic = await createNewTopicQuery(newTopic);

    if (createdTopic) {
      return res.status(201).json(STATUS_CODE[201](createdTopic));
    }

    return res.status(204).json(STATUS_CODE[204]({}));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateTopicById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const topicId = parseInt(req.params.id);
    const updatedTopic: {
      assessmentId: number;
      title: string;
    } = req.body;

    const topic = await updateTopicByIdQuery(topicId, updatedTopic);

    if (topic) {
      return res.status(200).json(STATUS_CODE[200](topic));
    }

    return res.status(204).json(STATUS_CODE[204](topic));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteTopicById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const topicId = parseInt(req.params.id);

    const topic = await deleteTopicByIdQuery(topicId);

    if (topic) {
      return res.status(200).json(STATUS_CODE[200](topic));
    }

    return res.status(204).json(STATUS_CODE[204](topic));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
