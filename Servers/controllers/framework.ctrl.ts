import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  addFrameworkToProjectQuery,
  deleteFrameworkFromProjectQuery,
  getAllFrameworkByIdQuery,
  getAllFrameworksQuery,
} from "../utils/framework.utils";
import { sequelize } from "../database/db";
import { FrameworkModel } from "../domain.layer/models/frameworks/frameworks.model";
import {
  ValidationException,
  BusinessLogicException,
  NotFoundException,
} from "../domain.layer/exceptions/custom.exception";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";

export async function getAllFrameworks(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "starting getAllFrameworks",
    "getAllFrameworks",
    "framework.ctrl.ts"
  );
  logger.debug("🔍 Fetching all frameworks");

  try {
    const frameworks = await getAllFrameworksQuery();

    if (frameworks && frameworks.length > 0) {
      await logEvent("Read", `Retrieved ${frameworks.length} frameworks`);
      logStructured(
        "successful",
        `retrieved ${frameworks.length} frameworks`,
        "getAllFrameworks",
        "framework.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](frameworks));
    }

    logStructured(
      "successful",
      "no frameworks found",
      "getAllFrameworks",
      "framework.ctrl.ts"
    );
    await logEvent("Read", "No frameworks found");
    return res.status(204).json(STATUS_CODE[204](frameworks));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve frameworks",
      "getAllFrameworks",
      "framework.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve frameworks: ${(error as Error).message}`
    );
    logger.error("❌ Error in getAllFrameworks:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getFrameworkById(
  req: Request,
  res: Response
): Promise<any> {
  const frameworkId = parseInt(req.params.id);
  logStructured(
    "processing",
    `fetching framework by ID: ${frameworkId}`,
    "getFrameworkById",
    "framework.ctrl.ts"
  );
  logger.debug(`🔍 Looking up framework with ID: ${frameworkId}`);

  try {
    const framework = await getAllFrameworkByIdQuery(frameworkId);

    if (framework) {
      logStructured(
        "successful",
        `framework found: ID ${frameworkId}`,
        "getFrameworkById",
        "framework.ctrl.ts"
      );
      await logEvent("Read", `Framework retrieved by ID: ${frameworkId}`);
      return res.status(200).json(STATUS_CODE[200](framework));
    }

    logStructured(
      "successful",
      `no framework found: ID ${frameworkId}`,
      "getFrameworkById",
      "framework.ctrl.ts"
    );
    await logEvent("Read", `No framework found with ID: ${frameworkId}`);
    return res.status(404).json(STATUS_CODE[404](framework));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch framework: ID ${frameworkId}`,
      "getFrameworkById",
      "framework.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve framework by ID: ${frameworkId}`
    );
    logger.error("❌ Error in getFrameworkById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createNewFramework(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const { name, description } = req.body;

  logStructured(
    "processing",
    `starting framework creation: ${name}`,
    "createNewFramework",
    "framework.ctrl.ts"
  );
  logger.debug(`🛠️ Creating framework: ${name}`);

  try {
    // Use the model's createNewFramework method for validation and creation
    const frameworkModel = await FrameworkModel.createNewFramework(
      name,
      description
    );
    await frameworkModel.validateFrameworkData();

    // Check if framework with same name already exists
    const existingFrameworks = await FrameworkModel.findByName(name);
    if (existingFrameworks && existingFrameworks.length > 0) {
      logStructured(
        "error",
        `framework already exists: ${name}`,
        "createNewFramework",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Attempted to create duplicate framework: ${name}`
      );
      await transaction.rollback();
      return res
        .status(409)
        .json(STATUS_CODE[409]("Framework with this name already exists"));
    }

    // Save the framework to database
    const savedFramework = await frameworkModel.save({ transaction });

    if (savedFramework) {
      await transaction.commit();
      logStructured(
        "successful",
        `framework created: ${name}`,
        "createNewFramework",
        "framework.ctrl.ts"
      );
      await logEvent("Create", `Framework created: ${name}`);
      return res
        .status(201)
        .json(STATUS_CODE[201](savedFramework.toSafeJSON()));
    }

    logStructured(
      "error",
      `failed to create framework: ${name}`,
      "createNewFramework",
      "framework.ctrl.ts"
    );
    await logEvent("Error", `Framework creation failed: ${name}`);
    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400]("Failed to create framework"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation failed: ${error.message}`,
        "createNewFramework",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during framework creation: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "createNewFramework",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during framework creation: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error: ${name}`,
      "createNewFramework",
      "framework.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during framework creation: ${(error as Error).message}`
    );
    logger.error("❌ Error in createNewFramework:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateFrameworkById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const frameworkId = parseInt(req.params.id);
  const { name, description } = req.body;

  logStructured(
    "processing",
    `updating framework ID ${frameworkId}`,
    "updateFrameworkById",
    "framework.ctrl.ts"
  );
  logger.debug(`✏️ Update requested for framework ID ${frameworkId}`);

  try {
    const existingFramework = await FrameworkModel.findByIdWithValidation(
      frameworkId
    );

    if (!existingFramework) {
      logStructured(
        "error",
        `framework not found: ID ${frameworkId}`,
        "updateFrameworkById",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Update failed — framework not found: ID ${frameworkId}`
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Framework not found"));
    }

    // Check if framework is being used
    const isBeingUsed = await existingFramework.isBeingUsed();
    if (isBeingUsed) {
      logStructured(
        "error",
        `attempted to update framework in use: ID ${frameworkId}`,
        "updateFrameworkById",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Blocked update of framework in use: ID ${frameworkId}`
      );
      await transaction.rollback();
      return res
        .status(403)
        .json(
          STATUS_CODE[403]("Cannot update framework that is currently in use")
        );
    }

    // If name is being updated, check for duplicates
    if (name && name !== existingFramework.name) {
      const existingFrameworks = await FrameworkModel.findByName(name);
      if (existingFrameworks && existingFrameworks.length > 0) {
        logStructured(
          "error",
          `framework name already exists: ${name}`,
          "updateFrameworkById",
          "framework.ctrl.ts"
        );
        await logEvent(
          "Error",
          `Attempted to update to duplicate name: ${name}`
        );
        await transaction.rollback();
        return res
          .status(409)
          .json(STATUS_CODE[409]("Framework with this name already exists"));
      }
    }

    // Use the model's updateFramework method for validation and updates
    await existingFramework.updateFramework({ name, description });
    await existingFramework.validateFrameworkData();

    const updatedFramework = await existingFramework.save({ transaction });

    if (updatedFramework) {
      await transaction.commit();
      logStructured(
        "successful",
        `framework updated: ID ${frameworkId}`,
        "updateFrameworkById",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Update",
        `Framework updated: ID ${frameworkId}, name: ${updatedFramework.name}`
      );
      return res
        .status(202)
        .json(STATUS_CODE[202](updatedFramework.toSafeJSON()));
    }

    logStructured(
      "error",
      `failed to update framework: ID ${frameworkId}`,
      "updateFrameworkById",
      "framework.ctrl.ts"
    );
    await logEvent("Error", `Framework update failed: ID ${frameworkId}`);
    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400]("Failed to update framework"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "updateFrameworkById",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during framework update: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "updateFrameworkById",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during framework update: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    if (error instanceof NotFoundException) {
      logStructured(
        "error",
        `framework not found: ID ${frameworkId}`,
        "updateFrameworkById",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Framework not found during update: ID ${frameworkId}`
      );
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    logStructured(
      "error",
      `unexpected error for framework ID ${frameworkId}`,
      "updateFrameworkById",
      "framework.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during framework update for ID ${frameworkId}: ${
        (error as Error).message
      }`
    );
    logger.error("❌ Error in updateFrameworkById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteFrameworkById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const frameworkId = parseInt(req.params.id);

  logStructured(
    "processing",
    `attempting to delete framework ID ${frameworkId}`,
    "deleteFrameworkById",
    "framework.ctrl.ts"
  );
  logger.debug(`🗑️ Delete request for framework ID ${frameworkId}`);

  try {
    const existingFramework = await FrameworkModel.findByIdWithValidation(
      frameworkId
    );

    if (!existingFramework) {
      logStructured(
        "error",
        `framework not found: ID ${frameworkId}`,
        "deleteFrameworkById",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Delete failed — framework not found: ID ${frameworkId}`
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Framework not found"));
    }

    // Check if framework can be deleted
    if (!existingFramework.canBeDeleted()) {
      logStructured(
        "error",
        `framework cannot be deleted: ID ${frameworkId}`,
        "deleteFrameworkById",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Blocked deletion of framework: ID ${frameworkId}`
      );
      await transaction.rollback();
      return res
        .status(403)
        .json(STATUS_CODE[403]("Framework cannot be deleted"));
    }

    // Check if framework is being used
    const isBeingUsed = await existingFramework.isBeingUsed();
    if (isBeingUsed) {
      logStructured(
        "error",
        `attempted to delete framework in use: ID ${frameworkId}`,
        "deleteFrameworkById",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Blocked deletion of framework in use: ID ${frameworkId}`
      );
      await transaction.rollback();
      return res
        .status(403)
        .json(
          STATUS_CODE[403]("Cannot delete framework that is currently in use")
        );
    }

    const deletedCount = await FrameworkModel.deleteFrameworkById(frameworkId);

    if (deletedCount > 0) {
      await transaction.commit();
      logStructured(
        "successful",
        `framework deleted: ID ${frameworkId}`,
        "deleteFrameworkById",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Delete",
        `Framework deleted: ID ${frameworkId}, name: ${existingFramework.name}`
      );
      return res
        .status(202)
        .json(STATUS_CODE[202]({ message: "Framework deleted successfully" }));
    }

    logStructured(
      "error",
      `failed to delete framework: ID ${frameworkId}`,
      "deleteFrameworkById",
      "framework.ctrl.ts"
    );
    await logEvent("Error", `Framework deletion failed: ID ${frameworkId}`);
    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400]("Failed to delete framework"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "deleteFrameworkById",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during framework deletion: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof NotFoundException) {
      logStructured(
        "error",
        `framework not found: ID ${frameworkId}`,
        "deleteFrameworkById",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Framework not found during deletion: ID ${frameworkId}`
      );
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    logStructured(
      "error",
      `unexpected error deleting framework ID ${frameworkId}`,
      "deleteFrameworkById",
      "framework.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during framework deletion for ID ${frameworkId}: ${
        (error as Error).message
      }`
    );
    logger.error("❌ Error in deleteFrameworkById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function searchFrameworksByName(
  req: Request,
  res: Response
): Promise<any> {
  const { name } = req.query;
  const searchName = name as string;

  logStructured(
    "processing",
    `searching frameworks by name: ${searchName}`,
    "searchFrameworksByName",
    "framework.ctrl.ts"
  );
  logger.debug(`🔍 Searching frameworks with name: ${searchName}`);

  try {
    const frameworks = await FrameworkModel.findByName(searchName);

    if (frameworks && frameworks.length > 0) {
      logStructured(
        "successful",
        `found ${frameworks.length} frameworks matching: ${searchName}`,
        "searchFrameworksByName",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Read",
        `Found ${frameworks.length} frameworks matching: ${searchName}`
      );
      return res
        .status(200)
        .json(STATUS_CODE[200](frameworks.map((f) => f.toSafeJSON())));
    }

    logStructured(
      "successful",
      `no frameworks found matching: ${searchName}`,
      "searchFrameworksByName",
      "framework.ctrl.ts"
    );
    await logEvent("Read", `No frameworks found matching: ${searchName}`);
    return res.status(204).json(STATUS_CODE[204](frameworks));
  } catch (error) {
    logStructured(
      "error",
      `failed to search frameworks: ${searchName}`,
      "searchFrameworksByName",
      "framework.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to search frameworks: ${(error as Error).message}`
    );

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    logger.error("❌ Error in searchFrameworksByName:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getFrameworkMetadata(
  req: Request,
  res: Response
): Promise<any> {
  const frameworkId = parseInt(req.params.id);

  logStructured(
    "processing",
    `fetching metadata for framework ID ${frameworkId}`,
    "getFrameworkMetadata",
    "framework.ctrl.ts"
  );
  logger.debug(`📊 Fetching metadata for framework ID ${frameworkId}`);

  try {
    const framework = await FrameworkModel.findByIdWithValidation(frameworkId);

    if (!framework) {
      logStructured(
        "error",
        `framework not found: ID ${frameworkId}`,
        "getFrameworkMetadata",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Metadata fetch failed — framework not found: ID ${frameworkId}`
      );
      return res.status(404).json(STATUS_CODE[404]("Framework not found"));
    }

    const metadata = framework.getMetadata();
    const usageStats = await framework.getUsageStatistics();

    const fullMetadata = {
      ...metadata,
      usageStatistics: usageStats,
    };

    logStructured(
      "successful",
      `metadata retrieved for framework ID ${frameworkId}`,
      "getFrameworkMetadata",
      "framework.ctrl.ts"
    );
    await logEvent("Read", `Framework metadata retrieved: ID ${frameworkId}`);
    return res.status(200).json(STATUS_CODE[200](fullMetadata));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch metadata for framework ID ${frameworkId}`,
      "getFrameworkMetadata",
      "framework.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to fetch framework metadata: ${(error as Error).message}`
    );

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof NotFoundException) {
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    logger.error("❌ Error in getFrameworkMetadata:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function addFrameworkToProject(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const frameworkId = parseInt(req.query.frameworkId as string);
    const projectId = parseInt(req.query.projectId as string);

    logStructured(
      "processing",
      `adding framework ${frameworkId} to project ${projectId}`,
      "addFrameworkToProject",
      "framework.ctrl.ts"
    );
    logger.debug(`🔗 Adding framework ${frameworkId} to project ${projectId}`);

    // Validate framework exists
    const framework = await FrameworkModel.findByIdWithValidation(frameworkId);
    if (!framework) {
      logStructured(
        "error",
        `framework not found: ID ${frameworkId}`,
        "addFrameworkToProject",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Framework not found during project addition: ID ${frameworkId}`
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Framework not found"));
    }

    const result = await addFrameworkToProjectQuery(
      frameworkId,
      projectId,
      transaction
    );

    if (result) {
      await transaction.commit();
      logStructured(
        "successful",
        `framework ${frameworkId} added to project ${projectId}`,
        "addFrameworkToProject",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Create",
        `Framework ${frameworkId} added to project ${projectId}`
      );
      return res.status(200).json(STATUS_CODE[200](result));
    }

    await transaction.rollback();
    logStructured(
      "error",
      `failed to add framework ${frameworkId} to project ${projectId}`,
      "addFrameworkToProject",
      "framework.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to add framework ${frameworkId} to project ${projectId}`
    );
    return res
      .status(404)
      .json(
        STATUS_CODE[404](
          "Framework not found or could not be added to the project."
        )
      );
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `unexpected error adding framework to project`,
      "addFrameworkToProject",
      "framework.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error adding framework to project: ${
        (error as Error).message
      }`
    );

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof NotFoundException) {
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    logger.error("❌ Error in addFrameworkToProject:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteFrameworkFromProject(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const frameworkId = parseInt(req.query.frameworkId as string);
    const projectId = parseInt(req.query.projectId as string);

    logStructured(
      "processing",
      `removing framework ${frameworkId} from project ${projectId}`,
      "deleteFrameworkFromProject",
      "framework.ctrl.ts"
    );
    logger.debug(
      `🔗 Removing framework ${frameworkId} from project ${projectId}`
    );

    // Validate framework exists
    const framework = await FrameworkModel.findByIdWithValidation(frameworkId);
    if (!framework) {
      logStructured(
        "error",
        `framework not found: ID ${frameworkId}`,
        "deleteFrameworkFromProject",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Framework not found during project removal: ID ${frameworkId}`
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Framework not found"));
    }

    const result = await deleteFrameworkFromProjectQuery(
      frameworkId,
      projectId,
      transaction
    );

    if (result) {
      await transaction.commit();
      logStructured(
        "successful",
        `framework ${frameworkId} removed from project ${projectId}`,
        "deleteFrameworkFromProject",
        "framework.ctrl.ts"
      );
      await logEvent(
        "Delete",
        `Framework ${frameworkId} removed from project ${projectId}`
      );
      return res.status(200).json(STATUS_CODE[200](result));
    }

    await transaction.rollback();
    logStructured(
      "error",
      `failed to remove framework ${frameworkId} from project ${projectId}`,
      "deleteFrameworkFromProject",
      "framework.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to remove framework ${frameworkId} from project ${projectId}`
    );
    return res
      .status(404)
      .json(
        STATUS_CODE[404](
          "Framework not found or could not be removed from the project."
        )
      );
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `unexpected error removing framework from project`,
      "deleteFrameworkFromProject",
      "framework.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error removing framework from project: ${
        (error as Error).message
      }`
    );

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof NotFoundException) {
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    logger.error("❌ Error in deleteFrameworkFromProject:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
