import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewSubcontrolQuery,
  deleteSubcontrolByIdQuery,
  getAllSubcontrolsQuery,
  getSubcontrolByIdQuery,
  updateSubcontrolByIdQuery,
} from "../utils/subControl.utils";
import { RequestWithFile, UploadedFile } from "../utils/question.utils";
import { sequelize } from "../database/db";
import { SubcontrolModel } from "../domain.layer/models/subcontrol/subcontrol.model";
import {
  ValidationException,
  BusinessLogicException,
  NotFoundException,
} from "../domain.layer/exceptions/custom.exception";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";

export async function getAllSubcontrols(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "starting getAllSubcontrols",
    "getAllSubcontrols",
    "subcontrol.ctrl.ts"
  );
  logger.debug("🔍 Fetching all subcontrols");

  try {
    const subcontrols = await getAllSubcontrolsQuery(req.tenantId!);

    if (subcontrols && subcontrols.length > 0) {
      logStructured(
        "successful",
        `${subcontrols.length} subcontrols found`,
        "getAllSubcontrols",
        "subcontrol.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](subcontrols));
    }

    logStructured(
      "successful",
      "no subcontrols found",
      "getAllSubcontrols",
      "subcontrol.ctrl.ts"
    );
    return res.status(204).json(STATUS_CODE[204](subcontrols));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve subcontrols",
      "getAllSubcontrols",
      "subcontrol.ctrl.ts"
    );
    logger.error("❌ Error in getAllSubcontrols:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getSubcontrolById(
  req: Request,
  res: Response
): Promise<any> {
  const subcontrolId = parseInt(req.params.id);
  logStructured(
    "processing",
    `fetching subcontrol by ID: ${subcontrolId}`,
    "getSubcontrolById",
    "subcontrol.ctrl.ts"
  );
  logger.debug(`🔍 Looking up subcontrol with ID: ${subcontrolId}`);

  try {
    const subcontrol =
      await SubcontrolModel.findByIdWithValidation(subcontrolId);

    if (subcontrol) {
      logStructured(
        "successful",
        `subcontrol found: ID ${subcontrolId}`,
        "getSubcontrolById",
        "subcontrol.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](subcontrol.toJSON()));
    }

    logStructured(
      "successful",
      `no subcontrol found: ID ${subcontrolId}`,
      "getSubcontrolById",
      "subcontrol.ctrl.ts"
    );
    return res.status(404).json(STATUS_CODE[404](subcontrol));
  } catch (error) {
    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "getSubcontrolById",
        "subcontrol.ctrl.ts"
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof NotFoundException) {
      logStructured(
        "error",
        `subcontrol not found: ID ${subcontrolId}`,
        "getSubcontrolById",
        "subcontrol.ctrl.ts"
      );
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    logStructured(
      "error",
      `failed to fetch subcontrol: ID ${subcontrolId}`,
      "getSubcontrolById",
      "subcontrol.ctrl.ts"
    );
    logger.error("❌ Error in getSubcontrolById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createNewSubcontrol(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const subcontrolData = req.body;

  logStructured(
    "processing",
    `starting subcontrol creation`,
    "createNewSubcontrol",
    "subcontrol.ctrl.ts"
  );
  logger.debug(
    `🛠️ Creating subcontrol for control ID: ${subcontrolData.control_id}`
  );

  try {
    // Extract file data if present
    const evidenceFiles =
      (req.files as { [key: string]: UploadedFile[] })?.evidenceFiles || [];
    const feedbackFiles =
      (req.files as { [key: string]: UploadedFile[] })?.feedbackFiles || [];

    // Create subcontrol using the enhanced SubcontrolModel method
    const subcontrolModel = await SubcontrolModel.createNewSubcontrol(
      subcontrolData.title,
      subcontrolData.description,
      subcontrolData.control_id,
      subcontrolData.order_no,
      subcontrolData.status,
      subcontrolData.approver,
      subcontrolData.risk_review,
      subcontrolData.owner,
      subcontrolData.reviewer,
      subcontrolData.due_date ? new Date(subcontrolData.due_date) : undefined,
      subcontrolData.implementation_details,
      subcontrolData.evidence_description,
      subcontrolData.feedback_description,
      evidenceFiles.length > 0 ? evidenceFiles : undefined,
      feedbackFiles.length > 0 ? feedbackFiles : undefined,
      subcontrolData.is_demo || false
    );

    // Validate subcontrol data before saving
    await subcontrolModel.validateSubcontrolData();

    // Check if subcontrol can be modified (demo restrictions)
    subcontrolModel.canBeModified();

    const newSubcontrol = await createNewSubcontrolQuery(
      subcontrolData.control_id,
      subcontrolModel,
      subcontrolData.project_id,
      subcontrolData.user_id,
      req.tenantId!,
      transaction,
      evidenceFiles,
      feedbackFiles
    );

    if (newSubcontrol) {
      await transaction.commit();
      logStructured(
        "successful",
        `subcontrol created: ID ${newSubcontrol.id}`,
        "createNewSubcontrol",
        "subcontrol.ctrl.ts"
      );
      await logEvent(
        "Create",
        `Subcontrol created: ID ${newSubcontrol.id}, title: ${subcontrolData.title}`
      );
      return res.status(201).json(STATUS_CODE[201](newSubcontrol));
    }

    logStructured(
      "error",
      "failed to create subcontrol",
      "createNewSubcontrol",
      "subcontrol.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Subcontrol creation failed: ${subcontrolData.title}`
    );
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Failed to create subcontrol"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation failed: ${error.message}`,
        "createNewSubcontrol",
        "subcontrol.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during subcontrol creation: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "createNewSubcontrol",
        "subcontrol.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during subcontrol creation: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error during subcontrol creation`,
      "createNewSubcontrol",
      "subcontrol.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during subcontrol creation: ${(error as Error).message}`
    );
    logger.error("❌ Error in createNewSubcontrol:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateSubcontrolById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const subcontrolId = parseInt(req.params.id);
  const updateData = req.body;

  logStructured(
    "processing",
    `updating subcontrol ID ${subcontrolId}`,
    "updateSubcontrolById",
    "subcontrol.ctrl.ts"
  );
  logger.debug(`✏️ Update requested for subcontrol ID ${subcontrolId}`);

  try {
    // Find existing subcontrol with validation
    const existingSubcontrol =
      await SubcontrolModel.findByIdWithValidation(subcontrolId);

    if (!existingSubcontrol) {
      logStructured(
        "error",
        `subcontrol not found: ID ${subcontrolId}`,
        "updateSubcontrolById",
        "subcontrol.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Update failed — subcontrol not found: ID ${subcontrolId}`
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Subcontrol not found"));
    }

    // Check if subcontrol can be modified (demo restrictions)
    existingSubcontrol.canBeModified();

    // Update subcontrol using the enhanced method
    await existingSubcontrol.updateSubcontrol({
      title: updateData.title,
      description: updateData.description,
      order_no: updateData.order_no,
      status: updateData.status,
      approver: updateData.approver,
      risk_review: updateData.risk_review,
      owner: updateData.owner,
      reviewer: updateData.reviewer,
      due_date: updateData.due_date ? new Date(updateData.due_date) : undefined,
      implementation_details: updateData.implementation_details,
      evidence_description: updateData.evidence_description,
      feedback_description: updateData.feedback_description,
      evidence_files: updateData.evidence_files,
      feedback_files: updateData.feedback_files,
    });

    // Validate updated data
    await existingSubcontrol.validateSubcontrolData();

    const updatedSubcontrol = await updateSubcontrolByIdQuery(
      subcontrolId,
      existingSubcontrol,
      req.tenantId!,
      transaction
    );

    if (updatedSubcontrol) {
      await transaction.commit();
      logStructured(
        "successful",
        `subcontrol updated: ID ${subcontrolId}`,
        "updateSubcontrolById",
        "subcontrol.ctrl.ts"
      );
      await logEvent(
        "Update",
        `Subcontrol updated: ID ${subcontrolId}, title: ${existingSubcontrol.title}`
      );
      return res.status(202).json(STATUS_CODE[202](updatedSubcontrol));
    }

    logStructured(
      "error",
      `failed to update subcontrol: ID ${subcontrolId}`,
      "updateSubcontrolById",
      "subcontrol.ctrl.ts"
    );
    await logEvent("Error", `Subcontrol update failed: ID ${subcontrolId}`);
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Failed to update subcontrol"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "updateSubcontrolById",
        "subcontrol.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during subcontrol update: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "updateSubcontrolById",
        "subcontrol.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during subcontrol update: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    if (error instanceof NotFoundException) {
      logStructured(
        "error",
        `subcontrol not found: ID ${subcontrolId}`,
        "updateSubcontrolById",
        "subcontrol.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Update failed — subcontrol not found: ID ${subcontrolId}`
      );
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    logStructured(
      "error",
      `unexpected error for subcontrol ID ${subcontrolId}`,
      "updateSubcontrolById",
      "subcontrol.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during subcontrol update for ID ${subcontrolId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in updateSubcontrolById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteSubcontrolById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const subcontrolId = parseInt(req.params.id);

  logStructured(
    "processing",
    `attempting to delete subcontrol ID ${subcontrolId}`,
    "deleteSubcontrolById",
    "subcontrol.ctrl.ts"
  );
  logger.debug(`🗑️ Delete request for subcontrol ID ${subcontrolId}`);

  try {
    const subcontrol =
      await SubcontrolModel.findByIdWithValidation(subcontrolId);

    if (subcontrol) {
      // Check if subcontrol can be modified (demo restrictions)
      if (subcontrol.isDemoSubcontrol()) {
        logStructured(
          "error",
          `attempted to delete demo subcontrol ID ${subcontrolId}`,
          "deleteSubcontrolById",
          "subcontrol.ctrl.ts"
        );
        await logEvent(
          "Error",
          `Blocked deletion of demo subcontrol ID ${subcontrolId}`
        );
        await transaction.rollback();
        return res
          .status(403)
          .json(STATUS_CODE[403]("Demo subcontrols cannot be deleted"));
      }

      const deletedSubcontrol = await deleteSubcontrolByIdQuery(
        subcontrolId,
        req.tenantId!,
        transaction
      );

      if (deletedSubcontrol) {
        await transaction.commit();
        logStructured(
          "successful",
          `subcontrol deleted: ID ${subcontrolId}`,
          "deleteSubcontrolById",
          "subcontrol.ctrl.ts"
        );
        await logEvent(
          "Delete",
          `Subcontrol deleted: ID ${subcontrolId}, title: ${subcontrol.title}`
        );
        return res.status(202).json(STATUS_CODE[202](deletedSubcontrol));
      }
    }

    logStructured(
      "error",
      `subcontrol not found: ID ${subcontrolId}`,
      "deleteSubcontrolById",
      "subcontrol.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Delete failed — subcontrol not found: ID ${subcontrolId}`
    );
    await transaction.rollback();
    return res.status(404).json(STATUS_CODE[404]("Subcontrol not found"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "deleteSubcontrolById",
        "subcontrol.ctrl.ts"
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof NotFoundException) {
      logStructured(
        "error",
        `subcontrol not found: ID ${subcontrolId}`,
        "deleteSubcontrolById",
        "subcontrol.ctrl.ts"
      );
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    logStructured(
      "error",
      `unexpected error deleting subcontrol ID ${subcontrolId}`,
      "deleteSubcontrolById",
      "subcontrol.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during subcontrol delete for ID ${subcontrolId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in deleteSubcontrolById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
