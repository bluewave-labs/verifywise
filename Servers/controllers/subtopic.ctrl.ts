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
import { sequelize } from "../database/db";
import { SubtopicModel } from "../domain.layer/models/subtopic/subtopic.model";
import {
  ValidationException,
  BusinessLogicException,
  NotFoundException,
} from "../domain.layer/exceptions/custom.exception";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";

export async function getAllSubtopics(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "starting getAllSubtopics",
    "getAllSubtopics",
    "subtopic.ctrl.ts"
  );
  logger.debug("🔍 Fetching all subtopics");

  try {
    const subtopics = await getAllSubtopicsQuery(req.tenantId!);

    if (subtopics && subtopics.length > 0) {
      logStructured(
        "successful",
        `${subtopics.length} subtopics found`,
        "getAllSubtopics",
        "subtopic.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](subtopics));
    }

    logStructured(
      "successful",
      "no subtopics found",
      "getAllSubtopics",
      "subtopic.ctrl.ts"
    );
    return res.status(204).json(STATUS_CODE[204](subtopics));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve subtopics",
      "getAllSubtopics",
      "subtopic.ctrl.ts"
    );
    logger.error("❌ Error in getAllSubtopics:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getSubtopicById(
  req: Request,
  res: Response
): Promise<any> {
  const subtopicId = parseInt(req.params.id);
  logStructured(
    "processing",
    `fetching subtopic by ID: ${subtopicId}`,
    "getSubtopicById",
    "subtopic.ctrl.ts"
  );
  logger.debug(`🔍 Looking up subtopic with ID: ${subtopicId}`);

  try {
    const subtopic = await SubtopicModel.findByIdWithValidation(subtopicId);

    if (subtopic) {
      logStructured(
        "successful",
        `subtopic found: ID ${subtopicId}`,
        "getSubtopicById",
        "subtopic.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](subtopic.toJSON()));
    }

    logStructured(
      "successful",
      `no subtopic found: ID ${subtopicId}`,
      "getSubtopicById",
      "subtopic.ctrl.ts"
    );
    return res.status(404).json(STATUS_CODE[404](subtopic));
  } catch (error) {
    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "getSubtopicById",
        "subtopic.ctrl.ts"
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof NotFoundException) {
      logStructured(
        "error",
        `subtopic not found: ID ${subtopicId}`,
        "getSubtopicById",
        "subtopic.ctrl.ts"
      );
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    logStructured(
      "error",
      `failed to fetch subtopic: ID ${subtopicId}`,
      "getSubtopicById",
      "subtopic.ctrl.ts"
    );
    logger.error("❌ Error in getSubtopicById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createNewSubtopic(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const subtopicData = req.body;

  logStructured(
    "processing",
    `starting subtopic creation`,
    "createNewSubtopic",
    "subtopic.ctrl.ts"
  );
  logger.debug(`🛠️ Creating subtopic for topic ID: ${subtopicData.topic_id}`);

  try {
    // Create subtopic using the enhanced SubtopicModel method
    const subtopicModel = await SubtopicModel.createNewSubtopic(
      subtopicData.title,
      subtopicData.topic_id,
      subtopicData.order_no,
      subtopicData.is_demo || false
    );

    // Validate subtopic data before saving
    await subtopicModel.validateSubtopicData();

    // Check if subtopic can be modified (demo restrictions)
    subtopicModel.canBeModified();

    const newSubtopic = await createNewSubtopicQuery(
      subtopicModel,
      req.tenantId!,
      transaction
    );

    if (newSubtopic) {
      await transaction.commit();
      logStructured(
        "successful",
        `subtopic created: ID ${newSubtopic.id}`,
        "createNewSubtopic",
        "subtopic.ctrl.ts"
      );
      await logEvent(
        "Create",
        `Subtopic created: ID ${newSubtopic.id}, title: ${subtopicData.title}`
      );
      return res.status(201).json(STATUS_CODE[201](newSubtopic));
    }

    logStructured(
      "error",
      "failed to create subtopic",
      "createNewSubtopic",
      "subtopic.ctrl.ts"
    );
    await logEvent("Error", `Subtopic creation failed: ${subtopicData.title}`);
    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400]("Failed to create subtopic"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation failed: ${error.message}`,
        "createNewSubtopic",
        "subtopic.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during subtopic creation: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "createNewSubtopic",
        "subtopic.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during subtopic creation: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error during subtopic creation`,
      "createNewSubtopic",
      "subtopic.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during subtopic creation: ${(error as Error).message}`
    );
    logger.error("❌ Error in createNewSubtopic:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateSubtopicById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const subtopicId = parseInt(req.params.id);
  const updateData = req.body;

  logStructured(
    "processing",
    `updating subtopic ID ${subtopicId}`,
    "updateSubtopicById",
    "subtopic.ctrl.ts"
  );
  logger.debug(`✏️ Update requested for subtopic ID ${subtopicId}`);

  try {
    // Find existing subtopic with validation
    const existingSubtopic =
      await SubtopicModel.findByIdWithValidation(subtopicId);

    if (!existingSubtopic) {
      logStructured(
        "error",
        `subtopic not found: ID ${subtopicId}`,
        "updateSubtopicById",
        "subtopic.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Update failed — subtopic not found: ID ${subtopicId}`
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Subtopic not found"));
    }

    // Check if subtopic can be modified (demo restrictions)
    existingSubtopic.canBeModified();

    // Update subtopic using the enhanced method
    await existingSubtopic.updateSubtopic({
      title: updateData.title,
      order_no: updateData.order_no,
    });

    // Validate updated data
    await existingSubtopic.validateSubtopicData();

    const updatedSubtopic = await updateSubtopicByIdQuery(
      subtopicId,
      existingSubtopic,
      req.tenantId!,
      transaction
    );

    if (updatedSubtopic) {
      await transaction.commit();
      logStructured(
        "successful",
        `subtopic updated: ID ${subtopicId}`,
        "updateSubtopicById",
        "subtopic.ctrl.ts"
      );
      await logEvent(
        "Update",
        `Subtopic updated: ID ${subtopicId}, title: ${existingSubtopic.title}`
      );
      return res.status(202).json(STATUS_CODE[202](updatedSubtopic));
    }

    logStructured(
      "error",
      `failed to update subtopic: ID ${subtopicId}`,
      "updateSubtopicById",
      "subtopic.ctrl.ts"
    );
    await logEvent("Error", `Subtopic update failed: ID ${subtopicId}`);
    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400]("Failed to update subtopic"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "updateSubtopicById",
        "subtopic.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during subtopic update: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "updateSubtopicById",
        "subtopic.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during subtopic update: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    if (error instanceof NotFoundException) {
      logStructured(
        "error",
        `subtopic not found: ID ${subtopicId}`,
        "updateSubtopicById",
        "subtopic.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Update failed — subtopic not found: ID ${subtopicId}`
      );
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    logStructured(
      "error",
      `unexpected error for subtopic ID ${subtopicId}`,
      "updateSubtopicById",
      "subtopic.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during subtopic update for ID ${subtopicId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in updateSubtopicById:", error);
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

    const subtopic = await deleteSubtopicByIdQuery(
      subtopicId,
      req.tenantId!,
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

export async function getSubtopicByTopicId(
  req: Request,
  res: Response
): Promise<any> {
  const topicId = parseInt(req.params.id);
  try {
    if (isNaN(topicId)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid topic ID"));
    }

    const subtopics = await getSubTopicByTopicIdQuery(topicId, req.tenantId!);

    if (subtopics && subtopics.length !== 0) {
      return res.status(200).json(STATUS_CODE[200](subtopics));
    }

    return res.status(204).json(STATUS_CODE[204](subtopics));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
