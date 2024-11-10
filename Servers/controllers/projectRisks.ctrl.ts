import { Request, Response } from "express";
import { ProjectRisk } from "../models/projectRisk.model";
const MOCK_DATA_ON = true;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockProjectRisk,
  deleteMockProjectRiskById,
  getAllMockProjectRisks,
  getMockProjectRiskById,
  updateMockProjectRiskById,
} from "../mocks/tools/projectRisk.mock.db";
import {
  createProjectRiskQuery,
  deleteProjectRiskByIdQuery,
  getAllProjectRisksQuery,
  getProjectRiskByIdQuery,
  updateProjectRiskByIdQuery,
} from "../utils/projectRisk.utils";

export async function getAllProjectRisks(
  req: Request,
  res: Response
): Promise<any> {
  try {
    if (MOCK_DATA_ON === true) {
      const projectRisks = getAllMockProjectRisks();

      if (projectRisks) {
        return res.status(200).json(STATUS_CODE[200](projectRisks));
      }

      return res.status(204).json(STATUS_CODE[204](projectRisks));
    } else {
      const projectRisks = await getAllProjectRisksQuery();

      if (projectRisks) {
        return res.status(200).json(STATUS_CODE[200](projectRisks));
      }

      return res.status(204).json(STATUS_CODE[204](projectRisks));
    }
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

    if (MOCK_DATA_ON === true) {
      const projectRisk = getMockProjectRiskById(projectRiskId);

      if (projectRisk) {
        return res.status(200).json(STATUS_CODE[200](projectRisk));
      }

      return res.status(204).json(STATUS_CODE[204](projectRisk));
    } else {
      const projectRisk = await getProjectRiskByIdQuery(projectRiskId);

      if (projectRisk) {
        return res.status(200).json(STATUS_CODE[200](projectRisk));
      }

      return res.status(204).json(STATUS_CODE[204](projectRisk));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createProjectRisk(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectRisk: ProjectRisk = req.body;

    if (MOCK_DATA_ON === true) {
      const newProjectRisk = createMockProjectRisk(projectRisk);

      if (newProjectRisk) {
        return res.status(201).json(STATUS_CODE[201](newProjectRisk));
      }

      return res.status(204).json(STATUS_CODE[204](newProjectRisk));
    } else {
      const newProjectRisk = await createProjectRiskQuery(projectRisk);

      if (newProjectRisk) {
        return res.status(201).json(STATUS_CODE[201](newProjectRisk));
      }

      return res.status(204).json(STATUS_CODE[204](newProjectRisk));
    }
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

    if (MOCK_DATA_ON === true) {
      const updatedProjectRisk = updateMockProjectRiskById(
        projectRiskId,
        projectRisk
      );

      if (updatedProjectRisk) {
        return res.status(200).json(STATUS_CODE[200](updatedProjectRisk));
      }

      return res.status(204).json(STATUS_CODE[204](updatedProjectRisk));
    } else {
      const updatedProjectRisk = await updateProjectRiskByIdQuery(
        projectRiskId,
        projectRisk
      );

      if (updatedProjectRisk) {
        return res.status(200).json(STATUS_CODE[200](updatedProjectRisk));
      }

      return res.status(204).json(STATUS_CODE[204](updatedProjectRisk));
    }
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

    if (MOCK_DATA_ON === true) {
      const deletedProjectRisk = deleteMockProjectRiskById(projectRiskId);

      if (deletedProjectRisk) {
        return res.status(200).json(STATUS_CODE[200](deletedProjectRisk));
      }

      return res.status(204).json(STATUS_CODE[204](deletedProjectRisk));
    } else {
      const deletedProjectRisk = await deleteProjectRiskByIdQuery(
        projectRiskId
      );

      if (deletedProjectRisk) {
        return res.status(200).json(STATUS_CODE[200](deletedProjectRisk));
      }

      return res.status(204).json(STATUS_CODE[204](deletedProjectRisk));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
