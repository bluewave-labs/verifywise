import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockProjectScope,
  deleteMockProjectScopeById,
  getAllMockProjectScopes,
  getMockProjectScopeById,
  updateMockProjectScopeById,
} from "../mocks/tools/projectScope.mock.db";
import {
  createProjectScopeQuery,
  deleteProjectScopeByIdQuery,
  getAllProjectScopesQuery,
  getProjectScopeByIdQuery,
  updateProjectScopeByIdQuery,
} from "../utils/projectScope.utils";

export async function getAllProjectScopes(
  req: Request,
  res: Response
): Promise<any> {
  try {
    if (MOCKDATA_ON) {
      const projectScopes = getAllMockProjectScopes();

      if (projectScopes) {
        return res.status(200).json(STATUS_CODE[200](projectScopes));
      }

      return res.status(204).json(STATUS_CODE[204](projectScopes));
    } else {
      const projectScopes = await getAllProjectScopesQuery();

      if (projectScopes) {
        return res.status(200).json(STATUS_CODE[200](projectScopes));
      }

      return res.status(204).json(STATUS_CODE[204](projectScopes));
    }
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

    if (MOCKDATA_ON) {
      const projectScope = getMockProjectScopeById(projectScopeId);

      if (projectScope) {
        return res.status(200).json(STATUS_CODE[200](projectScope));
      }

      return res.status(204).json(STATUS_CODE[204](projectScope));
    } else {
      const projectScope = await getProjectScopeByIdQuery(projectScopeId);

      if (projectScope) {
        return res.status(200).json(STATUS_CODE[200](projectScope));
      }

      return res.status(204).json(STATUS_CODE[204](projectScope));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createProjectScope(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectScope = req.body as {
      assessmentId: number;
      describeAiEnvironment: string;
      isNewAiTechnology: boolean;
      usesPersonalData: boolean;
      projectScopeDocuments: string;
      technologyType: string;
      hasOngoingMonitoring: boolean;
      unintendedOutcomes: string;
      technologyDocumentation: string;
    };

    if (MOCKDATA_ON) {
      const createdProjectScope = createMockProjectScope(projectScope);

      if (createdProjectScope) {
        return res.status(201).json(STATUS_CODE[201](createdProjectScope));
      }

      return res.status(204).json(STATUS_CODE[204](createdProjectScope));
    } else {
      const createdProjectScope = await createProjectScopeQuery(projectScope);

      if (createdProjectScope) {
        return res.status(201).json(STATUS_CODE[201](createdProjectScope));
      }

      return res.status(204).json(STATUS_CODE[204](createdProjectScope));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateProjectScopeById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectScopeId = parseInt(req.params.id);
    const projectScope = req.body as {
      assessmentId: number;
      describeAiEnvironment: string;
      isNewAiTechnology: boolean;
      usesPersonalData: boolean;
      projectScopeDocuments: string;
      technologyType: string;
      hasOngoingMonitoring: boolean;
      unintendedOutcomes: string;
      technologyDocumentation: string;
    };

    if (MOCKDATA_ON) {
      const updatedProjectScope = updateMockProjectScopeById(
        projectScopeId,
        projectScope
      );

      if (updatedProjectScope) {
        return res.status(200).json(STATUS_CODE[200](updatedProjectScope));
      }

      return res.status(204).json(STATUS_CODE[204](updatedProjectScope));
    } else {
      const updatedProjectScope = await updateProjectScopeByIdQuery(
        projectScopeId,
        projectScope
      );

      if (updatedProjectScope) {
        return res.status(200).json(STATUS_CODE[200](updatedProjectScope));
      }

      return res.status(204).json(STATUS_CODE[204](updatedProjectScope));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteProjectScopeById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectScopeId = parseInt(req.params.id);

    if (MOCKDATA_ON) {
      const deletedProjectScope = deleteMockProjectScopeById(projectScopeId);

      if (deletedProjectScope) {
        return res.status(200).json(STATUS_CODE[200](deletedProjectScope));
      }

      return res.status(204).json(STATUS_CODE[204](deletedProjectScope));
    } else {
      const deletedProjectScope = await deleteProjectScopeByIdQuery(
        projectScopeId
      );

      if (deletedProjectScope) {
        return res.status(200).json(STATUS_CODE[200](deletedProjectScope));
      }

      return res.status(204).json(STATUS_CODE[204](deletedProjectScope));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
