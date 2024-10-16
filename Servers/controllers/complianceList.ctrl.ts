import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockComplianceList,
  deleteMockComplianceListById,
  getAllMockComplianceLists,
  getMockComplianceListById,
  updateMockComplianceListById
} from "../mocks/tools/complianceList.mock.db"
import {
  createNewComplianceListQuery,
  deleteComplianceListByIdQuery,
  getAllComplianceListsQuery,
  getComplianceListByIdQuery,
  updateComplianceListByIdQuery
} from "../utils/complianceList.util";

export async function getAllComplianceLists(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const complianceLists = getAllMockComplianceLists();

      if (complianceLists) {
        return res.status(200).json(STATUS_CODE[200](complianceLists));
      }

      return res.status(204).json(STATUS_CODE[204](complianceLists));
    } else {
      const complianceLists = await getAllComplianceListsQuery();

      if (complianceLists) {
        return res.status(200).json(STATUS_CODE[200](complianceLists));
      }

      return res.status(204).json(STATUS_CODE[204](complianceLists));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getComplianceListById(req: Request, res: Response): Promise<any> {
  try {
    const complianceListId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const complianceList = getMockComplianceListById(complianceListId);

      if (complianceList) {
        return res.status(200).json(STATUS_CODE[200](complianceList));
      }

      return res.status(404).json(STATUS_CODE[404](complianceList));
    } else {
      const complianceList = await getComplianceListByIdQuery(complianceListId);

      if (complianceList) {
        return res.status(200).json(STATUS_CODE[200](complianceList));
      }

      return res.status(404).json(STATUS_CODE[404](complianceList));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createComplianceList(req: Request, res: Response): Promise<any> {
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
      const newComplianceList = createMockComplianceList({ name, description });

      if (newComplianceList) {
        return res.status(201).json(STATUS_CODE[201](newComplianceList));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const newComplianceList = await createNewComplianceListQuery({ name, description });

      if (newComplianceList) {
        return res.status(201).json(STATUS_CODE[201](newComplianceList));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateComplianceListById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("updateComplianceListById");
  try {
    const complianceListId = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "name and description are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const updatedComplianceList = updateMockComplianceListById(complianceListId, { name, description });

      if (updatedComplianceList) {
        return res.status(202).json(STATUS_CODE[202](updatedComplianceList));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const updatedComplianceList = await updateComplianceListByIdQuery(complianceListId, {
        name,
        description,
      });

      if (updatedComplianceList) {
        return res.status(202).json(STATUS_CODE[202](updatedComplianceList));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteComplianceListById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const complianceListId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const deletedComplianceList = deleteMockComplianceListById(complianceListId);

      if (deletedComplianceList) {
        return res.status(202).json(STATUS_CODE[202](deletedComplianceList));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedComplianceList = await deleteComplianceListByIdQuery(complianceListId);

      if (deletedComplianceList) {
        return res.status(202).json(STATUS_CODE[202](deletedComplianceList));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
