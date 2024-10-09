import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockRisk,
  deleteMockRiskById,
  getAllMockRisks,
  getMockRiskById,
  updateMockRiskById
} from "../mocks/tools/risk.mock.db"
import {
  createNewRiskQuery,
  deleteRiskByIdQuery,
  getAllRisksQuery,
  getRiskByIdQuery,
  updateRiskByIdQuery
} from "../utils/risk.utils";

export async function getAllRisks(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const risks = getAllMockRisks();

      if (risks) {
        return res.status(200).json(STATUS_CODE[200](risks));
      }

      return res.status(204).json(STATUS_CODE[204](risks));
    } else {
      const risks = await getAllRisksQuery();

      if (risks) {
        return res.status(200).json(STATUS_CODE[200](risks));
      }

      return res.status(204).json(STATUS_CODE[204](risks));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getRiskById(req: Request, res: Response): Promise<any> {
  try {
    const riskId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const risk = getMockRiskById(riskId);

      if (risk) {
        return res.status(200).json(STATUS_CODE[200](risk));
      }

      return res.status(404).json(STATUS_CODE[404](risk));
    } else {
      const risk = await getRiskByIdQuery(riskId);

      if (risk) {
        return res.status(200).json(STATUS_CODE[200](risk));
      }

      return res.status(404).json(STATUS_CODE[404](risk));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createRisk(req: Request, res: Response): Promise<any> {
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
      const newRisk = createMockRisk({ name, description });

      if (newRisk) {
        return res.status(201).json(STATUS_CODE[201](newRisk));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const newRisk = await createNewRiskQuery({ name, description });

      if (newRisk) {
        return res.status(201).json(STATUS_CODE[201](newRisk));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateRiskById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("updateRiskById");
  try {
    const riskId = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "name and description are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const updatedRisk = updateMockRiskById(riskId, { name, description });

      if (updatedRisk) {
        return res.status(202).json(STATUS_CODE[202](updatedRisk));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const updatedRisk = await updateRiskByIdQuery(riskId, {
        name,
        description,
      });

      if (updatedRisk) {
        return res.status(202).json(STATUS_CODE[202](updatedRisk));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteRiskById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const riskId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const deletedRisk = deleteMockRiskById(riskId);

      if (deletedRisk) {
        return res.status(202).json(STATUS_CODE[202](deletedRisk));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedRisk = await deleteRiskByIdQuery(riskId);

      if (deletedRisk) {
        return res.status(202).json(STATUS_CODE[202](deletedRisk));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
