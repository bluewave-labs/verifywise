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

export async function getAllProjectScopes(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectScopes = await getAllProjectScopesQuery();

    if (projectScopes) {
      return res.status(200).json(STATUS_CODE[200](projectScopes));
    }

    return res.status(204).json(STATUS_CODE[204](projectScopes));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectScopeById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectScopeId = parseInt(req.params.id);

    const projectScope = await getProjectScopeByIdQuery(projectScopeId);

    if (projectScope) {
      return res.status(200).json(STATUS_CODE[200](projectScope));
    }

    return res.status(204).json(STATUS_CODE[204](projectScope));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createProjectScope(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
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
      transaction
    );

    if (createdProjectScope) {
      await transaction.commit();
      return res.status(201).json(STATUS_CODE[201](createdProjectScope));
    }

    return res.status(204).json(STATUS_CODE[204](createdProjectScope));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateProjectScopeById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const projectScopeId = parseInt(req.params.id);

    // First, get the existing project scope to validate it can be modified
    const existingProjectScope = await getProjectScopeByIdQuery(projectScopeId);

    if (!existingProjectScope) {
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
      transaction
    );

    if (updatedProjectScope) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](updatedProjectScope));
    }

    return res.status(204).json(STATUS_CODE[204](updatedProjectScope));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteProjectScopeById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const projectScopeId = parseInt(req.params.id);

    // First, get the existing project scope to validate it can be deleted
    const existingProjectScope = await getProjectScopeByIdQuery(projectScopeId);

    if (!existingProjectScope) {
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Project scope not found"));
    }

    // Create a ProjectScopeModel instance from the existing data
    const projectScopeModel = new ProjectScopeModel(existingProjectScope);

    // Check if the project scope can be modified (demo restrictions)
    projectScopeModel.canBeModified();

    const deletedProjectScope = await deleteProjectScopeByIdQuery(
      projectScopeId,
      transaction
    );

    if (deletedProjectScope) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](deletedProjectScope));
    }

    return res.status(204).json(STATUS_CODE[204](deletedProjectScope));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
