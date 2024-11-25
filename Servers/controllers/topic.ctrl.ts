import { Request, Response } from "express";
import { Topic } from "../models/topic.model";
const MOCK_DATA_ON = true;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockTopic,
  deleteMockTopicById,
  getAllMockTopics,
  getMockTopicById,
  updateMockTopicById,
} from "../mocks/tools/topic.mock.db";
import {
  createNewTopicQuery,
  deleteTopicByIdQuery,
  getAllTopicsQuery,
  getTopicByIdQuery,
  updateTopicByIdQuery,
} from "../utils/topic.utils";

export async function getAllTopics(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === true) {
      const topics = getAllMockTopics();

      if (topics) {
        return res.status(200).json(STATUS_CODE[200](topics));
      }

      return res.status(204).json(STATUS_CODE[204](topics));
    } else {
      const topics = await getAllTopicsQuery();

      if (topics) {
        return res.status(200).json(STATUS_CODE[200](topics));
      }

      return res.status(204).json(STATUS_CODE[204](topics));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getTopicById(req: Request, res: Response): Promise<any> {
  try {
    const topicId = parseInt(req.params.id);

    if (MOCK_DATA_ON === true) {
      const topic = getMockTopicById(topicId);

      if (topic) {
        return res.status(200).json(STATUS_CODE[200](topic));
      }

      return res.status(204).json(STATUS_CODE[204](topic));
    } else {
      const topic = await getTopicByIdQuery(topicId);

      if (topic) {
        return res.status(200).json(STATUS_CODE[200](topic));
      }

      return res.status(204).json(STATUS_CODE[204](topic));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createNewTopic(
  req: Request,
  res: Response
): Promise<any> {
  console.log("Create topics", req.body);
  try {
    const newTopic: {
      assessmentId: number;
      title: string;
    } = req.body;

    if (MOCK_DATA_ON === true) {
      const topic = createMockTopic(newTopic);

      if (topic) {
        return res.status(201).json(STATUS_CODE[201](topic));
      }

      return res.status(204).json(STATUS_CODE[204](topic));
    } else {
      const topic = await createNewTopicQuery(newTopic);

      if (topic) {
        return res.status(201).json(STATUS_CODE[201](topic));
      }

      return res.status(204).json(STATUS_CODE[204](topic));
    }
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

    if (MOCK_DATA_ON === true) {
      const topic = updateMockTopicById(topicId, updatedTopic);

      if (topic) {
        return res.status(200).json(STATUS_CODE[200](topic));
      }

      return res.status(204).json(STATUS_CODE[204](topic));
    } else {
      const topic = await updateTopicByIdQuery(topicId, updatedTopic);

      if (topic) {
        return res.status(200).json(STATUS_CODE[200](topic));
      }

      return res.status(204).json(STATUS_CODE[204](topic));
    }
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

    if (MOCK_DATA_ON === true) {
      const topic = deleteMockTopicById(topicId);

      if (topic) {
        return res.status(200).json(STATUS_CODE[200](topic));
      }

      return res.status(204).json(STATUS_CODE[204](topic));
    } else {
      const topic = await deleteTopicByIdQuery(topicId);

      if (topic) {
        return res.status(200).json(STATUS_CODE[200](topic));
      }

      return res.status(204).json(STATUS_CODE[204](topic));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
