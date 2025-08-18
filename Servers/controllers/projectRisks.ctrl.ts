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
  const projectId = parseInt(req.params.id);
  logStructured(
    "processing",
    `fetching all project risks for project ID: ${projectId}`,
    "getAllProjectRisks",
    "projectRisks.ctrl.ts"
  );
  logger.debug(`🔍 Fetching all project risks for project ID: ${projectId}`);
  try {
    const projectRisks = await getAllProjectRisksQuery(
      projectId,
      req.tenantId!
    );

    if (projectRisks) {
      logStructured(
        "successful",
        `project risks found for project ID: ${projectId}`,
        "getAllProjectRisks",
        "projectRisks.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](projectRisks));
    }

    logStructured(
      "successful",
      `no project risks found for project ID: ${projectId}`,
      "getAllProjectRisks",
      "projectRisks.ctrl.ts"
    );
    return res.status(204).json(STATUS_CODE[204](projectRisks));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch project risks for project ID: ${projectId}`,
      "getAllProjectRisks",
      "projectRisks.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve project risks for project ID: ${projectId}`
    );
    logger.error("❌ Error in getAllProjectRisks:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectRiskById(
  req: Request,
  res: Response
): Promise<any> {
  const projectRiskId = parseInt(req.params.id);
  logStructured(
    "processing",
    `fetching project risk by ID: ${projectRiskId}`,
    "getProjectRiskById",
    "projectRisks.ctrl.ts"
  );
  logger.debug(`🔍 Looking up project risk with ID: ${projectRiskId}`);
  try {
    const projectRisk = await getProjectRiskByIdQuery(
      projectRiskId,
      req.tenantId!
    );

    if (projectRisk) {
      logStructured(
        "successful",
        `project risk found: ID ${projectRiskId}`,
        "getProjectRiskById",
        "projectRisks.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](projectRisk));
    }

    logStructured(
      "successful",
      `no project risk found: ID ${projectRiskId}`,
      "getProjectRiskById",
      "projectRisks.ctrl.ts"
    );
    return res.status(204).json(STATUS_CODE[204](projectRisk));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch project risk: ID ${projectRiskId}`,
      "getProjectRiskById",
      "projectRisks.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve project risk by ID: ${projectRiskId}`
    );
    logger.error("❌ Error in getProjectRiskById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getNonMitigatedProjectRisks(
  req: Request,
  res: Response
): Promise<any> {
  const projectId = parseInt(req.params.id);
  logStructured(
    "processing",
    `fetching non-mitigated project risks for project ID: ${projectId}`,
    "getNonMitigatedProjectRisks",
    "projectRisks.ctrl.ts"
  );
  logger.debug(
    `🔍 Fetching non-mitigated project risks for project ID: ${projectId}`
  );
  try {
    const projectRisks = await getNonMitigatedProjectRisksQuery(
      projectId,
      req.tenantId!
    );
    logStructured(
      "successful",
      `non-mitigated project risks fetched for project ID: ${projectId}`,
      "getNonMitigatedProjectRisks",
      "projectRisks.ctrl.ts"
    );
    return res.status(200).json(STATUS_CODE[200](projectRisks));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch non-mitigated project risks for project ID: ${projectId}`,
      "getNonMitigatedProjectRisks",
      "projectRisks.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve non-mitigated project risks for project ID: ${projectId}`
    );
    logger.error("❌ Error in getNonMitigatedProjectRisks:", error);
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
      req.tenantId!,
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

    // First, get the existing project risk to update
    const existingProjectRisk = await getProjectRiskByIdQuery(
      projectRiskId,
      req.tenantId!
    );

    if (!existingProjectRisk) {
      logStructured(
        "error",
        `project risk not found: ID ${projectRiskId}`,
        "updateProjectRiskById",
        "projectRisks.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Project risk not found for update: ID ${projectRiskId}`
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Project risk not found"));
    }

    // Create a ProjectRiskModel instance with the existing data and update it
    const projectRiskModel = new ProjectRiskModel(existingProjectRisk);
    await projectRiskModel.updateProjectRisk(updateData);

    // Validate the updated project risk data
    await projectRiskModel.validateProjectRiskData();

    const updatedProjectRisk = await updateProjectRiskByIdQuery(
      projectRiskId,
      projectRiskModel,
      req.tenantId!,
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
  const projectRiskId = parseInt(req.params.id);
  logStructured(
    "processing",
    `attempting to delete project risk ID ${projectRiskId}`,
    "deleteProjectRiskById",
    "projectRisks.ctrl.ts"
  );
  logger.debug(`🗑️ Delete request for project risk ID ${projectRiskId}`);
  try {
    const deletedProjectRisk = await deleteProjectRiskByIdQuery(
      projectRiskId,
      req.tenantId!,
      transaction
    );

    if (deletedProjectRisk) {
      await transaction.commit();
      logStructured(
        "successful",
        `project risk deleted: ID ${projectRiskId}`,
        "deleteProjectRiskById",
        "projectRisks.ctrl.ts"
      );
      await logEvent("Delete", `Project risk deleted: ID ${projectRiskId}`);
      return res.status(200).json(STATUS_CODE[200](deletedProjectRisk));
    }

    logStructured(
      "error",
      `project risk not found: ID ${projectRiskId}`,
      "deleteProjectRiskById",
      "projectRisks.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Delete failed — project risk not found: ID ${projectRiskId}`
    );
    await transaction.rollback();
    return res.status(404).json(STATUS_CODE[404]("Project risk not found"));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `unexpected error deleting project risk ID ${projectRiskId}`,
      "deleteProjectRiskById",
      "projectRisks.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during delete for project risk ID ${projectRiskId}: ${
        (error as Error).message
      }`
    );
    logger.error("❌ Error in deleteProjectRiskById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
