import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import { addFrameworkToProjectQuery, deleteFrameworkFromProjectQuery, getAllFrameworkByIdQuery, getAllFrameworksQuery } from "../utils/framework.utils";
import { sequelize } from "../database/db";

export async function getAllFrameworks(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const frameworks = await getAllFrameworksQuery();

    if (frameworks) {
      return res.status(200).json(STATUS_CODE[200](frameworks));
    }

    return res.status(204).json(STATUS_CODE[204](frameworks));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getFrameworkById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const frameworkId = parseInt(req.params.id);

    const framework = await getAllFrameworkByIdQuery(frameworkId);

    if (framework) {
      return res.status(200).json(STATUS_CODE[200](framework));
    }

    return res.status(404).json(STATUS_CODE[404](framework));
  } catch (error) {
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

    // Assuming you have a function to add the framework to the project
    const result = await addFrameworkToProjectQuery(frameworkId, projectId, transaction);

    if (result) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](result));
    }

    await transaction.rollback();
    return res.status(404).json(STATUS_CODE[404]("Framework not found or could not be added to the project."));
  } catch (error) {
    await transaction.rollback();
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

    // Assuming you have a function to delete the framework from the project
    const result = await deleteFrameworkFromProjectQuery(frameworkId, projectId, transaction);

    if (result) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](result));
    }

    await transaction.rollback();
    return res.status(404).json(STATUS_CODE[404]("Framework not found or could not be removed from the project."));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
