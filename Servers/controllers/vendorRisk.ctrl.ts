import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createMockVendorRisk,
  deleteMockVendorRiskById,
  getAllMockVendorRisks,
  getMockVendorRiskById,
  updateMockVendorRiskById
} from "../mocks/tools/vendorRisk.mock.db"
import {
  createNewVendorRiskQuery,
  deleteVendorRiskByIdQuery,
  getAllVendorRisksQuery,
  getVendorRiskByIdQuery,
  updateVendorRiskByIdQuery
} from "../utils/vendorRisk.util";

export async function getAllVendorRisks(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const vendorRisks = getAllMockVendorRisks();

      if (vendorRisks) {
        return res.status(200).json(STATUS_CODE[200](vendorRisks));
      }

      return res.status(204).json(STATUS_CODE[204](vendorRisks));
    } else {
      const vendorRisks = await getAllVendorRisksQuery();

      if (vendorRisks) {
        return res.status(200).json(STATUS_CODE[200](vendorRisks));
      }

      return res.status(204).json(STATUS_CODE[204](vendorRisks));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getVendorRiskById(req: Request, res: Response): Promise<any> {
  try {
    const vendorRiskId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const vendorRisk = getMockVendorRiskById(vendorRiskId);

      if (vendorRisk) {
        return res.status(200).json(STATUS_CODE[200](vendorRisk));
      }

      return res.status(404).json(STATUS_CODE[404](vendorRisk));
    } else {
      const vendorRisk = await getVendorRiskByIdQuery(vendorRiskId);

      if (vendorRisk) {
        return res.status(200).json(STATUS_CODE[200](vendorRisk));
      }

      return res.status(404).json(STATUS_CODE[404](vendorRisk));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createVendorRisk(req: Request, res: Response): Promise<any> {
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
      const newVendorRisk = createMockVendorRisk({ name, description });

      if (newVendorRisk) {
        return res.status(201).json(STATUS_CODE[201](newVendorRisk));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    } else {
      const newVendorRisk = await createNewVendorRiskQuery({ name, description });

      if (newVendorRisk) {
        return res.status(201).json(STATUS_CODE[201](newVendorRisk));
      }

      return res.status(503).json(STATUS_CODE[503]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateVendorRiskById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("updateVendorRiskById");
  try {
    const vendorRiskId = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "name and description are required" })
        );
    }

    if (MOCK_DATA_ON === "true") {
      const updatedVendorRisk = updateMockVendorRiskById(vendorRiskId, { name, description });

      if (updatedVendorRisk) {
        return res.status(202).json(STATUS_CODE[202](updatedVendorRisk));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const updatedVendorRisk = await updateVendorRiskByIdQuery(vendorRiskId, {
        name,
        description,
      });

      if (updatedVendorRisk) {
        return res.status(202).json(STATUS_CODE[202](updatedVendorRisk));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteVendorRiskById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const vendorRiskId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      const deletedVendorRisk = deleteMockVendorRiskById(vendorRiskId);

      if (deletedVendorRisk) {
        return res.status(202).json(STATUS_CODE[202](deletedVendorRisk));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const deletedVendorRisk = await deleteVendorRiskByIdQuery(vendorRiskId);

      if (deletedVendorRisk) {
        return res.status(202).json(STATUS_CODE[202](deletedVendorRisk));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
