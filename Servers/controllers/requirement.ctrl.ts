import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockRequirement,
  deleteMockRequirementById,
  getAllMockRequirements,
  getMockRequirementById,
  updateMockRequirementById
} from "../mocks/tools/requirement.mock.db"
import {
  createNewRequirementQuery,
  deleteRequirementByIdQuery,
  getAllRequirementsQuery,
  getRequirementByIdQuery,
  updateRequirementByIdQuery
} from "../utils/requirement.util";

export async function getAllRequirements(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const requirements = getAllMockRequirements();

      if (requirements) {
        return res.status(200).json(STATUS_CODE[200](requirements));
      }

      return res.status(204).json(STATUS_CODE[204](requirements));
    } else {
      const requirements = await getAllRequirementsQuery();

      if (requirements) {
        return res.status(200).json(STATUS_CODE[200](requirements));
      }

      return res.status(204).json(STATUS_CODE[204](requirements));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getRequirementById(req: Request, res: Response): Promise<any> {
  try {
    const requirementId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const requirement = getMockRequirementById(requirementId);

      if (requirement) {
        return res.status(200).json(STATUS_CODE[200](requirement));
      }

      return res.status(404).json(STATUS_CODE[404](requirement));
    } else {
      const requirement = await getRequirementByIdQuery(requirementId);

      if (requirement) {
        return res.status(200).json(STATUS_CODE[200](requirement));
      }

      return res.status(404).json(STATUS_CODE[404](requirement));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createRequirement(req: Request, res: Response): Promise<any> {
  try {
    const {
      compliance_list_id,
      name,
      description,
      status
    } = req.body;

    if (
      !compliance_list_id ||
      !name ||
      !description ||
      !status
    ) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "compliance_list_id, name, description and status are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const newRequirement = createMockRequirement({
        compliance_list_id,
        name,
        description,
        status
      });

      if (newRequirement) {
        return res.status(201).json(STATUS_CODE[201](newRequirement));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const newRequirement = await createNewRequirementQuery({
        compliance_list_id,
        name,
        description,
        status
      });

      if (newRequirement) {
        return res.status(201).json(STATUS_CODE[201](newRequirement));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateRequirementById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("updateRequirementById");
  try {
    const requirementId = parseInt(req.params.id);
    const {
      compliance_list_id,
      name,
      description,
      status
    } = req.body;

    if (
      !compliance_list_id ||
      !name ||
      !description ||
      !status
    ) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "compliance_list_id, name, description and status are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const updatedRequirement = updateMockRequirementById(requirementId, {
        compliance_list_id,
        name,
        description,
        status
      });

      if (updatedRequirement) {
        return res.status(202).json(STATUS_CODE[202](updatedRequirement));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const updatedRequirement = await updateRequirementByIdQuery(requirementId, {
        compliance_list_id,
        name,
        description,
        status
      });

      if (updatedRequirement) {
        return res.status(202).json(STATUS_CODE[202](updatedRequirement));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteRequirementById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const requirementId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const deletedRequirement = deleteMockRequirementById(requirementId);

      if (deletedRequirement) {
        return res.status(202).json(STATUS_CODE[202](deletedRequirement));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedRequirement = await deleteRequirementByIdQuery(requirementId);

      if (deletedRequirement) {
        return res.status(202).json(STATUS_CODE[202](deletedRequirement));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
