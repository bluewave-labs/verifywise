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
import { RequestWithFile } from "../utils/question.utils";
import { sequelize } from "../database/db";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";
import { TopicModel } from "../domain.layer/models/topic/topic.model";
import {
  ValidationException,
  BusinessLogicException,
} from "../domain.layer/exceptions/custom.exception";

export async function getAllTopics(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getAllTopics",
    functionName: "getAllTopics",
    fileName: "topic.ctrl.ts",
  });

  try {
    const topics = await getAllTopicsQuery(req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: "Retrieved all topics",
      functionName: "getAllTopics",
      fileName: "topic.ctrl.ts",
    });

    if (topics) {
      return res.status(200).json(STATUS_CODE[200](topics));
    }

    return res.status(204).json(STATUS_CODE[204](topics));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve topics",
      functionName: "getAllTopics",
      fileName: "topic.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getTopicById(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getTopicById",
    functionName: "getTopicById",
    fileName: "topic.ctrl.ts",
  });

  try {
    const topicId = parseInt(req.params.id);

    const topic = await getTopicByIdQuery(topicId, req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: `Retrieved topic ID ${topicId}`,
      functionName: "getTopicById",
      fileName: "topic.ctrl.ts",
    });

    if (topic) {
      return res.status(200).json(STATUS_CODE[200](topic));
    }

    return res.status(204).json(STATUS_CODE[204](topic));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve topic by ID",
      functionName: "getTopicById",
      fileName: "topic.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createNewTopic(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();

  logProcessing({
    description: "starting createNewTopic",
    functionName: "createNewTopic",
    fileName: "topic.ctrl.ts",
  });

  try {
    const topicData = req.body;

    // Create topic using the enhanced TopicModel method
    const topicModel = await TopicModel.createNewTopic(
      topicData.title,
      topicData.assessment_id,
      topicData.order_no,
      topicData.is_demo || false
    );

    const createdTopic = await createNewTopicQuery(
      topicModel,
      req.tenantId!,
      transaction
    );

    if (createdTopic) {
      await transaction.commit();

      await logSuccess({
        eventType: "Create",
        description: "Created new topic",
        functionName: "createNewTopic",
        fileName: "topic.ctrl.ts",
      });

      return res.status(201).json(STATUS_CODE[201](createdTopic));
    }

    await logSuccess({
      eventType: "Create",
      description: "Topic creation returned null",
      functionName: "createNewTopic",
      fileName: "topic.ctrl.ts",
    });

    return res.status(204).json(STATUS_CODE[204]({}));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    await logFailure({
      eventType: "Create",
      description: "Failed to create topic",
      functionName: "createNewTopic",
      fileName: "topic.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateTopicById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();

  logProcessing({
    description: "starting updateTopicById",
    functionName: "updateTopicById",
    fileName: "topic.ctrl.ts",
  });

  try {
    const topicId = parseInt(req.params.id);
    const updateData = req.body;

    // Find existing topic
    const existingTopic = await getTopicByIdQuery(topicId, req.tenantId!);

    if (!existingTopic) {
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Topic not found"));
    }

    // Create TopicModel instance and update it
    const topicModel = new TopicModel(existingTopic);
    await topicModel.updateTopic({
      title: updateData.title,
      order_no: updateData.order_no,
    });

    const topic = await updateTopicByIdQuery(
      topicId,
      topicModel,
      req.tenantId!,
      transaction
    );

    if (topic) {
      await transaction.commit();

      await logSuccess({
        eventType: "Update",
        description: `Updated topic ID ${topicId}`,
        functionName: "updateTopicById",
        fileName: "topic.ctrl.ts",
      });

      return res.status(200).json(STATUS_CODE[200](topic));
    }

    await logSuccess({
      eventType: "Update",
      description: `Topic not found for update: ID ${topicId}`,
      functionName: "updateTopicById",
      fileName: "topic.ctrl.ts",
    });

    return res.status(204).json(STATUS_CODE[204](topic));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    await logFailure({
      eventType: "Update",
      description: "Failed to update topic",
      functionName: "updateTopicById",
      fileName: "topic.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteTopicById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();

  logProcessing({
    description: "starting deleteTopicById",
    functionName: "deleteTopicById",
    fileName: "topic.ctrl.ts",
  });

  try {
    const topicId = parseInt(req.params.id);

    const topic = await deleteTopicByIdQuery(
      topicId,
      req.tenantId!,
      transaction
    );

    if (topic) {
      await transaction.commit();

      await logSuccess({
        eventType: "Delete",
        description: `Deleted topic ID ${topicId}`,
        functionName: "deleteTopicById",
        fileName: "topic.ctrl.ts",
      });

      return res.status(200).json(STATUS_CODE[200](topic));
    }

    await logSuccess({
      eventType: "Delete",
      description: `Topic not found for deletion: ID ${topicId}`,
      functionName: "deleteTopicById",
      fileName: "topic.ctrl.ts",
    });

    return res.status(204).json(STATUS_CODE[204](topic));
  } catch (error) {
    await transaction.rollback();

    await logFailure({
      eventType: "Delete",
      description: "Failed to delete topic",
      functionName: "deleteTopicById",
      fileName: "topic.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getTopicByAssessmentId(
  req: Request,
  res: Response
): Promise<any> {
  const assessmentId = parseInt(req.params.id);

  logProcessing({
    description: `starting getTopicByAssessmentId for assessment ID ${assessmentId}`,
    functionName: "getTopicByAssessmentId",
    fileName: "topic.ctrl.ts",
  });

  try {
    if (isNaN(assessmentId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid assessment ID"));
    }

    const topics = await getTopicByAssessmentIdQuery(
      assessmentId,
      req.tenantId!
    );

    await logSuccess({
      eventType: "Read",
      description: `Retrieved topics for assessment ID ${assessmentId}`,
      functionName: "getTopicByAssessmentId",
      fileName: "topic.ctrl.ts",
    });

    if (topics && topics.length > 0) {
      return res.status(200).json(STATUS_CODE[200](topics));
    }

    return res.status(204).json(STATUS_CODE[204](topics));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve topics by assessment ID",
      functionName: "getTopicByAssessmentId",
      fileName: "topic.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
