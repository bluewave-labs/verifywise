import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createProjectRiskQuery,
  deleteProjectRiskByIdQuery,
  getAllProjectRisksQuery,
  getProjectRiskByIdQuery,
  updateProjectRiskByIdQuery,
} from "../utils/projectRisk.utils";
import { ProjectRisk } from "../models/projectRisk.model";

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

export async function createProjectRisk(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectRisk: Partial<ProjectRisk> = req.body;

    const newProjectRisk = await createProjectRiskQuery(projectRisk);

    if (newProjectRisk) {
      return res.status(201).json(STATUS_CODE[201](newProjectRisk));
    }

    return res.status(204).json(STATUS_CODE[204](newProjectRisk));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateProjectRiskById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectRiskId = parseInt(req.params.id);
    const projectRisk: Partial<ProjectRisk> = req.body;

    const updatedProjectRisk = await updateProjectRiskByIdQuery(
      projectRiskId,
      projectRisk
    );

    if (updatedProjectRisk) {
      return res.status(200).json(STATUS_CODE[200](updatedProjectRisk));
    }

    return res.status(204).json(STATUS_CODE[204](updatedProjectRisk));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteProjectRiskById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectRiskId = parseInt(req.params.id);

    const deletedProjectRisk = await deleteProjectRiskByIdQuery(projectRiskId);

    if (deletedProjectRisk) {
      return res.status(200).json(STATUS_CODE[200](deletedProjectRisk));
    }

    return res.status(204).json(STATUS_CODE[204](deletedProjectRisk));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
