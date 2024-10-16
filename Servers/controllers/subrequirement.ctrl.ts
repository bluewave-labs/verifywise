import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockSubrequirement,
  deleteMockSubrequirementById,
  getAllMockSubrequirements,
  getMockSubrequirementById,
  updateMockSubrequirementById
} from "../mocks/tools/subrequirement.mock.db"
import {
  createNewSubrequirementQuery,
  deleteSubrequirementByIdQuery,
  getAllSubrequirementsQuery,
  getSubrequirementByIdQuery,
  updateSubrequirementByIdQuery
} from "../utils/subrequirement.util";

export async function getAllSubrequirements(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const subrequirements = getAllMockSubrequirements();

      if (subrequirements) {
        return res.status(200).json(STATUS_CODE[200](subrequirements));
      }

      return res.status(204).json(STATUS_CODE[204](subrequirements));
    } else {
      const subrequirements = await getAllSubrequirementsQuery();

      if (subrequirements) {
        return res.status(200).json(STATUS_CODE[200](subrequirements));
      }

      return res.status(204).json(STATUS_CODE[204](subrequirements));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getSubrequirementById(req: Request, res: Response): Promise<any> {
  try {
    const subrequirementId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const subrequirement = getMockSubrequirementById(subrequirementId);

      if (subrequirement) {
        return res.status(200).json(STATUS_CODE[200](subrequirement));
      }

      return res.status(404).json(STATUS_CODE[404](subrequirement));
    } else {
      const subrequirement = await getSubrequirementByIdQuery(subrequirementId);

      if (subrequirement) {
        return res.status(200).json(STATUS_CODE[200](subrequirement));
      }

      return res.status(404).json(STATUS_CODE[404](subrequirement));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createSubrequirement(req: Request, res: Response): Promise<any> {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "name and description are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const newSubrequirement = createMockSubrequirement({ name, description });

      if (newSubrequirement) {
        return res.status(201).json(STATUS_CODE[201](newSubrequirement));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const newSubrequirement = await createNewSubrequirementQuery({ name, description });

      if (newSubrequirement) {
        return res.status(201).json(STATUS_CODE[201](newSubrequirement));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateSubrequirementById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("updateSubrequirementById");
  try {
    const subrequirementId = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "name and description are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const updatedSubrequirement = updateMockSubrequirementById(subrequirementId, { name, description });

      if (updatedSubrequirement) {
        return res.status(202).json(STATUS_CODE[202](updatedSubrequirement));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const updatedSubrequirement = await updateSubrequirementByIdQuery(subrequirementId, {
        name,
        description,
      });

      if (updatedSubrequirement) {
        return res.status(202).json(STATUS_CODE[202](updatedSubrequirement));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteSubrequirementById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const subrequirementId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const deletedSubrequirement = deleteMockSubrequirementById(subrequirementId);

      if (deletedSubrequirement) {
        return res.status(202).json(STATUS_CODE[202](deletedSubrequirement));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedSubrequirement = await deleteSubrequirementByIdQuery(subrequirementId);

      if (deletedSubrequirement) {
        return res.status(202).json(STATUS_CODE[202](deletedSubrequirement));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
