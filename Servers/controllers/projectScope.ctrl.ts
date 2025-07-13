import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createProjectScopeQuery,
  deleteProjectScopeByIdQuery,
  getAllProjectScopesQuery,
  getProjectScopeByIdQuery,
  updateProjectScopeByIdQuery,
} from "../utils/projectScope.utils";
import { sequelize } from "../database/db";
import { ProjectScopeModel } from "../domain.layer/models/projectScope/projectScope.model";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";
import {
  ValidationException,
  BusinessLogicException,
} from "../domain.layer/exceptions/custom.exception";

export async function getAllProjectScopes(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "starting getAllProjectScopes",
    "getAllProjectScopes",
    "projectScope.ctrl.ts"
  );
  logger.debug("🔍 Fetching all project scopes");

  try {
    const projectScopes = await getAllProjectScopesQuery(req.tenantId!);

    if (projectScopes && projectScopes.length > 0) {
      logStructured(
        "successful",
        `retrieved ${projectScopes.length} project scopes`,
        "getAllProjectScopes",
        "projectScope.ctrl.ts"
      );
      await logEvent(
        "Read",
        `Retrieved ${projectScopes.length} project scopes`
      );
      return res.status(200).json(STATUS_CODE[200](projectScopes));
    }

    logStructured(
      "successful",
      "no project scopes found",
      "getAllProjectScopes",
      "projectScope.ctrl.ts"
    );
    await logEvent("Read", "No project scopes found");
    return res.status(204).json(STATUS_CODE[204](projectScopes));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve project scopes",
      "getAllProjectScopes",
      "projectScope.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve project scopes: ${(error as Error).message}`
    );
    logger.error("❌ Error in getAllProjectScopes:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectScopeById(
  req: Request,
  res: Response
): Promise<any> {
  const projectScopeId = parseInt(req.params.id);
  logStructured(
    "processing",
    `fetching project scope by ID: ${projectScopeId}`,
    "getProjectScopeById",
    "projectScope.ctrl.ts"
  );
  logger.debug(`🔍 Looking up project scope with ID: ${projectScopeId}`);

  try {
    const projectScope = await getProjectScopeByIdQuery(projectScopeId, req.tenantId!);

    if (projectScope) {
      logStructured(
        "successful",
        `project scope found: ID ${projectScopeId}`,
        "getProjectScopeById",
        "projectScope.ctrl.ts"
      );
      await logEvent(
        "Read",
        `Project scope retrieved by ID: ${projectScopeId}`
      );
      return res.status(200).json(STATUS_CODE[200](projectScope));
    }

    logStructured(
      "successful",
      `no project scope found: ID ${projectScopeId}`,
      "getProjectScopeById",
      "projectScope.ctrl.ts"
    );
    await logEvent("Read", `No project scope found with ID: ${projectScopeId}`);
    return res.status(404).json(STATUS_CODE[404]("Project scope not found"));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch project scope: ID ${projectScopeId}`,
      "getProjectScopeById",
      "projectScope.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve project scope by ID: ${projectScopeId}`
    );
    logger.error("❌ Error in getProjectScopeById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createProjectScope(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const {
    assessmentId,
    describeAiEnvironment,
    isNewAiTechnology,
    usesPersonalData,
    projectScopeDocuments,
    technologyType,
    hasOngoingMonitoring,
    unintendedOutcomes,
    technologyDocumentation,
    is_demo = false,
  } = req.body;

  logStructured(
    "processing",
    `starting project scope creation for assessment ID: ${assessmentId}`,
    "createProjectScope",
    "projectScope.ctrl.ts"
  );
  logger.debug(`🛠️ Creating project scope for assessment ID: ${assessmentId}`);

  try {
    // Use the model's validation method to create a new project scope
    const projectScope = await ProjectScopeModel.createNewProjectScope(
      assessmentId,
      describeAiEnvironment,
      isNewAiTechnology,
      usesPersonalData,
      projectScopeDocuments,
      technologyType,
      hasOngoingMonitoring,
      unintendedOutcomes,
      technologyDocumentation,
      is_demo
    );

    // Validate the project scope data before saving
    await projectScope.validateProjectScopeData();

    // Check if the project scope can be modified (demo restrictions)
    projectScope.canBeModified();

    const createdProjectScope = await createProjectScopeQuery(
      projectScope,
      req.tenantId!,
      transaction
    );

    if (createdProjectScope) {
      await transaction.commit();
      logStructured(
        "successful",
        `project scope created: ID ${createdProjectScope.id}`,
        "createProjectScope",
        "projectScope.ctrl.ts"
      );
      await logEvent(
        "Create",
        `Project scope created: ID ${createdProjectScope.id}, assessment ID: ${assessmentId}`
      );
      return res.status(201).json(STATUS_CODE[201](createdProjectScope));
    }

    logStructured(
      "error",
      `failed to create project scope for assessment ID: ${assessmentId}`,
      "createProjectScope",
      "projectScope.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Project scope creation failed for assessment ID: ${assessmentId}`
    );
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Failed to create project scope"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation failed: ${error.message}`,
        "createProjectScope",
        "projectScope.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during project scope creation: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "createProjectScope",
        "projectScope.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during project scope creation: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error for assessment ID: ${assessmentId}`,
      "createProjectScope",
      "projectScope.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during project scope creation for assessment ID ${assessmentId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in createProjectScope:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateProjectScopeById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const projectScopeId = parseInt(req.params.id);

  logStructured(
    "processing",
    `updating project scope ID: ${projectScopeId}`,
    "updateProjectScopeById",
    "projectScope.ctrl.ts"
  );
  logger.debug(`✏️ Update requested for project scope ID ${projectScopeId}`);

  try {
    // First, get the existing project scope to validate it can be modified
    const existingProjectScope = await getProjectScopeByIdQuery(projectScopeId, req.tenantId!);

    if (!existingProjectScope) {
      logStructured(
        "error",
        `project scope not found: ID ${projectScopeId}`,
        "updateProjectScopeById",
        "projectScope.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Update failed — project scope not found: ID ${projectScopeId}`
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Project scope not found"));
    }

    // Create a ProjectScopeModel instance from the existing data
    const projectScopeModel = new ProjectScopeModel(existingProjectScope);

    // Check if the project scope can be modified (demo restrictions)
    projectScopeModel.canBeModified();

    const updateData = req.body;

    // Use the model's update method with validation
    await projectScopeModel.updateProjectScope(updateData);

    // Validate the updated project scope data
    await projectScopeModel.validateProjectScopeData();

    const updatedProjectScope = await updateProjectScopeByIdQuery(
      projectScopeId,
      projectScopeModel,
      req.tenantId!,
      transaction
    );

    if (updatedProjectScope) {
      await transaction.commit();
      logStructured(
        "successful",
        `project scope updated: ID ${projectScopeId}`,
        "updateProjectScopeById",
        "projectScope.ctrl.ts"
      );
      await logEvent(
        "Update",
        `Project scope updated: ID ${projectScopeId}, assessment ID: ${updatedProjectScope.assessmentId}`
      );
      return res.status(200).json(STATUS_CODE[200](updatedProjectScope));
    }

    logStructured(
      "error",
      `failed to update project scope: ID ${projectScopeId}`,
      "updateProjectScopeById",
      "projectScope.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Project scope update failed: ID ${projectScopeId}`
    );
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Failed to update project scope"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "updateProjectScopeById",
        "projectScope.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during project scope update: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "updateProjectScopeById",
        "projectScope.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during project scope update: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error for project scope ID ${projectScopeId}`,
      "updateProjectScopeById",
      "projectScope.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during project scope update for ID ${projectScopeId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in updateProjectScopeById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteProjectScopeById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const projectScopeId = parseInt(req.params.id);

  logStructured(
    "processing",
    `attempting to delete project scope ID ${projectScopeId}`,
    "deleteProjectScopeById",
    "projectScope.ctrl.ts"
  );
  logger.debug(`🗑️ Delete request for project scope ID ${projectScopeId}`);

  try {
    // First, get the existing project scope to validate it can be deleted
    const existingProjectScope = await getProjectScopeByIdQuery(projectScopeId, req.tenantId!);

    if (!existingProjectScope) {
      logStructured(
        "error",
        `project scope not found: ID ${projectScopeId}`,
        "deleteProjectScopeById",
        "projectScope.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Delete failed — project scope not found: ID ${projectScopeId}`
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Project scope not found"));
    }

    // Create a ProjectScopeModel instance from the existing data
    const projectScopeModel = new ProjectScopeModel(existingProjectScope);

    // Check if the project scope can be modified (demo restrictions)
    projectScopeModel.canBeModified();

    const deletedProjectScope = await deleteProjectScopeByIdQuery(
      projectScopeId,
      req.tenantId!,
      transaction
    );

    if (deletedProjectScope) {
      await transaction.commit();
      logStructured(
        "successful",
        `project scope deleted: ID ${projectScopeId}`,
        "deleteProjectScopeById",
        "projectScope.ctrl.ts"
      );
      await logEvent(
        "Delete",
        `Project scope deleted: ID ${projectScopeId}, assessment ID: ${existingProjectScope.assessmentId}`
      );
      return res.status(200).json(STATUS_CODE[200](deletedProjectScope));
    }

    logStructured(
      "error",
      `failed to delete project scope: ID ${projectScopeId}`,
      "deleteProjectScopeById",
      "projectScope.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Project scope deletion failed: ID ${projectScopeId}`
    );
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Failed to delete project scope"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "deleteProjectScopeById",
        "projectScope.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during project scope deletion: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "deleteProjectScopeById",
        "projectScope.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during project scope deletion: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error deleting project scope ID ${projectScopeId}`,
      "deleteProjectScopeById",
      "projectScope.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during project scope deletion for ID ${projectScopeId}: ${(error as Error).message}`
    );
    logger.error("❌ Error in deleteProjectScopeById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
