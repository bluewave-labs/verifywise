import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createRiskQuery,
  deleteRiskByIdQuery,
  getAllRisksQuery,
  getRiskByIdQuery,
  getRisksByFrameworkQuery,
  getRisksByProjectQuery,
  updateRiskByIdQuery,
} from "../utils/risk.utils";
import { RiskModel } from "../domain.layer/models/risks/risk.model";
import { sequelize } from "../database/db";
import {
  ValidationException,
  BusinessLogicException,
} from "../domain.layer/exceptions/custom.exception";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";

export async function getAllRisks(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    `fetching all project risks`,
    "getAllProjectRisks",
    "projectRisks.ctrl.ts"
  );
  logger.debug(`🔍 Fetching all project risks`);
  try {
    const projectRisks = await getAllRisksQuery(req.tenantId!);

    if (projectRisks) {
      logStructured(
        "successful",
        `project risks found`,
        "getAllProjectRisks",
        "projectRisks.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](projectRisks));
    }

    logStructured(
      "successful",
      `no project risks found`,
      "getAllProjectRisks",
      "projectRisks.ctrl.ts"
    );
    return res.status(204).json(STATUS_CODE[204](projectRisks));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch project risks`,
      "getAllProjectRisks",
      "projectRisks.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve project risks`
    );
    logger.error("❌ Error in getAllProjectRisks:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getRisksByProject(
  req: Request,
  res: Response
): Promise<any> {
  const projectId = parseInt(req.params.id as string);
  logStructured(
    "processing",
    `fetching risks for project ID: ${projectId}`,
    "getRisksByProject",
    "risks.ctrl.ts"
  );
  logger.debug(`🔍 Fetching risks for project ID: ${projectId}`);
  try {
    const risks = await getRisksByProjectQuery(
      projectId,
      req.tenantId!
    );

    if (risks) {
      logStructured(
        "successful",
        `risks found for project ID: ${projectId}`,
        "getRisksByProject",
        "risks.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](risks));
    }

    logStructured(
      "successful",
      `no risks found for project ID: ${projectId}`,
      "getRisksByProject",
      "risks.ctrl.ts"
    );
    return res.status(204).json(STATUS_CODE[204](risks));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch risks for project ID: ${projectId}`,
      "getRisksByProject",
      "risks.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve risks for project ID: ${projectId}`
    );
    logger.error("❌ Error in getRisksByProject:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getRisksByFramework(
  req: Request,
  res: Response
): Promise<any> {
  const frameworkId = parseInt(req.params.id as string);
  logStructured(
    "processing",
    `fetching risks for framework ID: ${frameworkId}`,
    "getRisksByFramework",
    "risks.ctrl.ts"
  );
  logger.debug(`🔍 Fetching risks for framework ID: ${frameworkId}`);
  try {
    const risks = await getRisksByFrameworkQuery(
      frameworkId,
      req.tenantId!
    );

    if (risks) {
      logStructured(
        "successful",
        `risks found for framework ID: ${frameworkId}`,
        "getRisksByFramework",
        "risks.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](risks));
    }

    logStructured(
      "successful",
      `no risks found for framework ID: ${frameworkId}`,
      "getRisksByFramework",
      "risks.ctrl.ts"
    );
    return res.status(204).json(STATUS_CODE[204](risks));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch risks for framework ID: ${frameworkId}`,
      "getRisksByFramework",
      "risks.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve risks for framework ID: ${frameworkId}`
    );
    logger.error("❌ Error in getRisksByFramework:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getRiskById(
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
    const projectRisk = await getRiskByIdQuery(
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

export async function createRisk(
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
    const projectRiskData = req.body as Partial<RiskModel & { projects: number[], frameworks: number[] }>;

    const newProjectRisk = await createRiskQuery(
      { ...projectRiskData, projects: req.body.projects || [], frameworks: req.body.frameworks || [] },
      req.tenantId!,
      transaction
    );

    if (newProjectRisk) {
      await transaction.commit();
      logStructured(
        "successful",
        `project risk created: ${newProjectRisk.risk_name}`,
        "createProjectRisk",
        "projectRisks.ctrl.ts"
      );
      await logEvent(
        "Create",
        `Project risk created: ${newProjectRisk.risk_name}`
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
      `Unexpected error during project risk creation: ${(error as Error).message
      }`
    );
    logger.error("❌ Error in createProjectRisk:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateRiskById(
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
    const updateData = req.body as Partial<RiskModel & { projects: number[], frameworks: number[] }>;

    // if (!existingProjectRisk) {
    //   logStructured(
    //     "error",
    //     `project risk not found: ID ${projectRiskId}`,
    //     "updateProjectRiskById",
    //     "projectRisks.ctrl.ts"
    //   );
    //   await logEvent(
    //     "Error",
    //     `Project risk not found for update: ID ${projectRiskId}`
    //   );
    //   await transaction.rollback();
    //   return res.status(404).json(STATUS_CODE[404]("Project risk not found"));
    // }

    // // Create a RiskModel instance with the existing data and update it
    // const riskModel = new RiskModel(existingProjectRisk);
    // await riskModel.updateProjectRisk(updateData);

    // // Validate the updated project risk data
    // await riskModel.validateProjectRiskData();

    const updatedProjectRisk = await updateRiskByIdQuery(
      projectRiskId,
      { ...updateData, projects: req.body.projects || [], frameworks: req.body.frameworks || [] },
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
      `Unexpected error during update for project risk ID ${projectRiskId}: ${(error as Error).message
      }`
    );
    logger.error("❌ Error in updateProjectRiskById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteRiskById(
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
    const deletedProjectRisk = await deleteRiskByIdQuery(
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
      `Unexpected error during delete for project risk ID ${projectRiskId}: ${(error as Error).message
      }`
    );
    logger.error("❌ Error in deleteProjectRiskById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
