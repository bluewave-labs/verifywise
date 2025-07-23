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
  NotFoundException,
} from "../domain.layer/exceptions/custom.exception";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";

export async function getAllTopics(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getAllTopics",
    functionName: "getAllTopics",
    fileName: "topic.ctrl.ts",
  });
  logStructured(
    "processing",
    "starting getAllTopics",
    "getAllTopics",
    "topic.ctrl.ts"
  );
  logger.debug("🔍 Fetching all topics");

  try {
    const topics = await getAllTopicsQuery(req.tenantId!);

    if (topics && topics.length > 0) {
      await logSuccess({
        eventType: "Read",
        description: "Retrieved all topics",
        functionName: "getAllTopics",
        fileName: "topic.ctrl.ts",
      });
      logStructured(
        "successful",
        `${topics.length} topics found`,
        "getAllTopics",
        "topic.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](topics));
    }

    logStructured(
      "successful",
      "no topics found",
      "getAllTopics",
      "topic.ctrl.ts"
    );
    return res.status(204).json(STATUS_CODE[204](topics));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve topics",
      functionName: "getAllTopics",
      fileName: "topic.ctrl.ts",
      error: error as Error,
    });
    logStructured(
      "error",
      "failed to retrieve topics",
      "getAllTopics",
      "topic.ctrl.ts"
    );
    logger.error("❌ Error in getAllTopics:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getTopicById(req: Request, res: Response): Promise<any> {
  const topicId = parseInt(req.params.id);
  logProcessing({
    description: "starting getTopicById",
    functionName: "getTopicById",
    fileName: "topic.ctrl.ts",
  });
  logStructured(
    "processing",
    `fetching topic by ID: ${topicId}`,
    "getTopicById",
    "topic.ctrl.ts"
  );
  logger.debug(`🔍 Looking up topic with ID: ${topicId}`);

  try {
    const topic = await getTopicByIdQuery(topicId, req.tenantId!);

    if (topic) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved topic ID ${topicId}`,
        functionName: "getTopicById",
        fileName: "topic.ctrl.ts",
      });
      logStructured(
        "successful",
        `topic found: ID ${topicId}`,
        "getTopicById",
        "topic.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](topic));
    }

    logStructured(
      "successful",
      `no topic found: ID ${topicId}`,
      "getTopicById",
      "topic.ctrl.ts"
    );
    return res.status(404).json(STATUS_CODE[404](topic));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve topic by ID",
      functionName: "getTopicById",
      fileName: "topic.ctrl.ts",
      error: error as Error,
    });
    logStructured(
      "error",
      `failed to fetch topic: ID ${topicId}`,
      "getTopicById",
      "topic.ctrl.ts"
    );
    logger.error("❌ Error in getTopicById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createNewTopic(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const topicData = req.body;

  logProcessing({
    description: "starting createNewTopic",
    functionName: "createNewTopic",
    fileName: "topic.ctrl.ts",
  });
  logStructured(
    "processing",
    `starting topic creation`,
    "createNewTopic",
    "topic.ctrl.ts"
  );
  logger.debug(
    `🛠️ Creating topic for assessment ID: ${topicData.assessment_id}`
  );

  try {
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
      logStructured(
        "successful",
        `topic created: ID ${createdTopic.id}`,
        "createNewTopic",
        "topic.ctrl.ts"
      );
      await logEvent(
        "Create",
        `Topic created: ID ${createdTopic.id}, title: ${topicData.title}`
      );
      return res.status(201).json(STATUS_CODE[201](createdTopic));
    }

    logStructured(
      "error",
      "failed to create topic",
      "createNewTopic",
      "topic.ctrl.ts"
    );
    await logEvent("Error", `Topic creation failed: ${topicData.title}`);
    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400]("Failed to create topic"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation failed: ${error.message}`,
        "createNewTopic",
        "topic.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during topic creation: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "createNewTopic",
        "topic.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during topic creation: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    await logFailure({
      eventType: "Create",
      description: "Failed to create topic",
      functionName: "createNewTopic",
      fileName: "topic.ctrl.ts",
      error: error as Error,
    });
    logStructured(
      "error",
      `unexpected error during topic creation`,
      "createNewTopic",
      "topic.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during topic creation: ${(error as Error).message}`
    );
    logger.error("❌ Error in createNewTopic:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateTopicById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const topicId = parseInt(req.params.id);
  const updateData = req.body;

  logProcessing({
    description: "starting updateTopicById",
    functionName: "updateTopicById",
    fileName: "topic.ctrl.ts",
  });
  logStructured(
    "processing",
    `updating topic ID ${topicId}`,
    "updateTopicById",
    "topic.ctrl.ts"
  );
  logger.debug(`✏️ Update requested for topic ID ${topicId}`);

  try {
    // Find existing topic
    const existingTopic = await getTopicByIdQuery(topicId, req.tenantId!);

    if (!existingTopic) {
      logStructured(
        "error",
        `topic not found: ID ${topicId}`,
        "updateTopicById",
        "topic.ctrl.ts"
      );
      await logEvent("Error", `Update failed — topic not found: ID ${topicId}`);
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
      logStructured(
        "successful",
        `topic updated: ID ${topicId}`,
        "updateTopicById",
        "topic.ctrl.ts"
      );
      await logEvent(
        "Update",
        `Topic updated: ID ${topicId}, title: ${topicModel.title}`
      );
      return res.status(200).json(STATUS_CODE[200](topic));
    }

    logStructured(
      "error",
      `failed to update topic: ID ${topicId}`,
      "updateTopicById",
      "topic.ctrl.ts"
    );
    await logEvent("Error", `Topic update failed: ID ${topicId}`);
    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400]("Failed to update topic"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "updateTopicById",
        "topic.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during topic update: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "updateTopicById",
        "topic.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during topic update: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    await logFailure({
      eventType: "Update",
      description: "Failed to update topic",
      functionName: "updateTopicById",
      fileName: "topic.ctrl.ts",
      error: error as Error,
    });
    logStructured(
      "error",
      `unexpected error for topic ID ${topicId}`,
      "updateTopicById",
      "topic.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during topic update for ID ${topicId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in updateTopicById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteTopicById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const topicId = parseInt(req.params.id);

  logProcessing({
    description: "starting deleteTopicById",
    functionName: "deleteTopicById",
    fileName: "topic.ctrl.ts",
  });
  logStructured(
    "processing",
    `attempting to delete topic ID ${topicId}`,
    "deleteTopicById",
    "topic.ctrl.ts"
  );
  logger.debug(`🗑️ Delete request for topic ID ${topicId}`);

  try {
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
      logStructured(
        "successful",
        `topic deleted: ID ${topicId}`,
        "deleteTopicById",
        "topic.ctrl.ts"
      );
      await logEvent("Delete", `Topic deleted: ID ${topicId}`);
      return res.status(200).json(STATUS_CODE[200](topic));
    }

    logStructured(
      "error",
      `topic not found: ID ${topicId}`,
      "deleteTopicById",
      "topic.ctrl.ts"
    );
    await logEvent("Error", `Delete failed — topic not found: ID ${topicId}`);
    await transaction.rollback();
    return res.status(404).json(STATUS_CODE[404]("Topic not found"));
  } catch (error) {
    await transaction.rollback();

    await logFailure({
      eventType: "Delete",
      description: "Failed to delete topic",
      functionName: "deleteTopicById",
      fileName: "topic.ctrl.ts",
      error: error as Error,
    });
    logStructured(
      "error",
      `unexpected error deleting topic ID ${topicId}`,
      "deleteTopicById",
      "topic.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during topic delete for ID ${topicId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in deleteTopicById:", error);
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
  logStructured(
    "processing",
    `fetching topics for assessment ID ${assessmentId}`,
    "getTopicByAssessmentId",
    "topic.ctrl.ts"
  );
  logger.debug(`🔍 Looking up topics for assessment ID: ${assessmentId}`);

  try {
    if (isNaN(assessmentId)) {
      logStructured(
        "error",
        `invalid assessment ID: ${assessmentId}`,
        "getTopicByAssessmentId",
        "topic.ctrl.ts"
      );
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
      logStructured(
        "successful",
        `${topics.length} topics found for assessment ID ${assessmentId}`,
        "getTopicByAssessmentId",
        "topic.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](topics));
    }

    logStructured(
      "successful",
      `no topics found for assessment ID ${assessmentId}`,
      "getTopicByAssessmentId",
      "topic.ctrl.ts"
    );
    return res.status(204).json(STATUS_CODE[204](topics));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve topics by assessment ID",
      functionName: "getTopicByAssessmentId",
      fileName: "topic.ctrl.ts",
      error: error as Error,
    });
    logStructured(
      "error",
      `failed to fetch topics for assessment ID ${assessmentId}`,
      "getTopicByAssessmentId",
      "topic.ctrl.ts"
    );
    logger.error("❌ Error in getTopicByAssessmentId:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
