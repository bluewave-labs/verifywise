import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createProjectRiskQuery,
  deleteProjectRiskByIdQuery,
  getAllProjectRisksQuery,
  getNonMitigatedProjectRisksQuery,
  getProjectRiskByIdQuery,
  updateProjectRiskByIdQuery,
} from "../utils/projectRisk.utils";
import { ProjectRiskModel } from "../domain.layer/models/projectRisks/projectRisk.model";
import { sequelize } from "../database/db";
import {
  ValidationException,
  BusinessLogicException,
} from "../domain.layer/exceptions/custom.exception";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";

export async function getAllProjectRisks(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectId = parseInt(req.params.id);
    const projectRisks = await getAllProjectRisksQuery(projectId);

    if (projectRisks) {
      return res.status(200).json(STATUS_CODE[200](projectRisks));
    }

    return res.status(204).json(STATUS_CODE[204](projectRisks));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectRiskById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectRiskId = parseInt(req.params.id);

    const projectRisk = await getProjectRiskByIdQuery(projectRiskId);

    if (projectRisk) {
      return res.status(200).json(STATUS_CODE[200](projectRisk));
    }

    return res.status(204).json(STATUS_CODE[204](projectRisk));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getNonMitigatedProjectRisks(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectId = parseInt(req.params.id);
    const projectRisks = await getNonMitigatedProjectRisksQuery(projectId);
    return res.status(204).json(STATUS_CODE[200](projectRisks));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createProjectRisk(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  logStructured(
    "processing",
    "starting createProjectRisk",
    "createProjectRisk",
    "projectRisks.ctrl.ts"
  );
  logger.debug("🛠️ Creating new project risk");
  try {
    const projectRiskData = req.body;
    const is_demo = projectRiskData.is_demo || false;

    // Use the ProjectRiskModel's createProjectRisk method with validation
    const projectRiskModel = await ProjectRiskModel.createProjectRisk(
      projectRiskData,
      is_demo
    );

    // Validate the project risk data before saving
    await projectRiskModel.validateProjectRiskData();

    const newProjectRisk = await createProjectRiskQuery(
      projectRiskModel,
      transaction
    );

    if (newProjectRisk) {
      await transaction.commit();
      logStructured(
        "successful",
        `project risk created: ${projectRiskModel.risk_name}`,
        "createProjectRisk",
        "projectRisks.ctrl.ts"
      );
      await logEvent(
        "Create",
        `Project risk created: ${projectRiskModel.risk_name}`
      );
      return res.status(201).json(STATUS_CODE[201](newProjectRisk));
    }

    logStructured(
      "error",
      "failed to create project risk",
      "createProjectRisk",
      "projectRisks.ctrl.ts"
    );
    await logEvent("Error", "Project risk creation failed");
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Unable to create project risk"));
  } catch (error) {
    await transaction.rollback();

    // Handle specific validation errors
    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation failed: ${error.message}`,
        "createProjectRisk",
        "projectRisks.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during project risk creation: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "createProjectRisk",
        "projectRisks.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during project risk creation: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      "unexpected error during project risk creation",
      "createProjectRisk",
      "projectRisks.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during project risk creation: ${
        (error as Error).message
      }`
    );
    logger.error("❌ Error in createProjectRisk:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateProjectRiskById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const projectRiskId = parseInt(req.params.id);
  logStructured(
    "processing",
    `updating project risk ID: ${projectRiskId}`,
    "updateProjectRiskById",
    "projectRisks.ctrl.ts"
  );
  logger.debug(`✏️ Update requested for project risk ID: ${projectRiskId}`);
  try {
    const updateData = req.body;

    // Find the project risk by ID with validation
    const projectRisk =
      await ProjectRiskModel.findByIdWithValidation(projectRiskId);

    // Update the project risk using the model's update method
    await projectRisk.updateProjectRisk(updateData);

    // Validate the updated project risk data
    await projectRisk.validateProjectRiskData();

    const updatedProjectRisk = await updateProjectRiskByIdQuery(
      projectRiskId,
      projectRisk,
      transaction
    );

    if (updatedProjectRisk) {
      await transaction.commit();
      logStructured(
        "successful",
        `project risk updated: ID ${projectRiskId}`,
        "updateProjectRiskById",
        "projectRisks.ctrl.ts"
      );
      await logEvent("Update", `Project risk updated: ID ${projectRiskId}`);
      return res.status(200).json(STATUS_CODE[200](updatedProjectRisk));
    }

    logStructured(
      "error",
      "project risk not found for update",
      "updateProjectRiskById",
      "projectRisks.ctrl.ts"
    );
    await logEvent("Error", "Project risk not found for updateProjectRiskById");
    await transaction.rollback();
    return res.status(404).json(STATUS_CODE[404]("Project risk not found"));
  } catch (error) {
    await transaction.rollback();

    // Handle specific validation and business logic errors
    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "updateProjectRiskById",
        "projectRisks.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during project risk update: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "updateProjectRiskById",
        "projectRisks.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during project risk update: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error for project risk ID ${projectRiskId}`,
      "updateProjectRiskById",
      "projectRisks.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during update for project risk ID ${projectRiskId}: ${
        (error as Error).message
      }`
    );
    logger.error("❌ Error in updateProjectRiskById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteProjectRiskById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const projectRiskId = parseInt(req.params.id);

    const deletedProjectRisk = await deleteProjectRiskByIdQuery(
      projectRiskId,
      transaction
    );

    if (deletedProjectRisk) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](deletedProjectRisk));
    }

    return res.status(204).json(STATUS_CODE[204](deletedProjectRisk));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
