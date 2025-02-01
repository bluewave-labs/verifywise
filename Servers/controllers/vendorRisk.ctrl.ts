import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewVendorRiskQuery,
  deleteVendorRiskByIdQuery,
  getAllVendorRisksQuery,
  getVendorRiskByIdQuery,
  updateVendorRiskByIdQuery,
} from "../utils/vendorRisk.util";

export async function getAllVendorRisks(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const vendorRisks = await getAllVendorRisksQuery();

    if (vendorRisks) {
      return res.status(200).json(STATUS_CODE[200](vendorRisks));
    }

    return res.status(204).json(STATUS_CODE[204](vendorRisks));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getVendorRiskById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const vendorRiskId = parseInt(req.params.id);

    const vendorRisk = await getVendorRiskByIdQuery(vendorRiskId);

    if (vendorRisk) {
      return res.status(200).json(STATUS_CODE[200](vendorRisk));
    }

    return res.status(404).json(STATUS_CODE[404](vendorRisk));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createVendorRisk(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const newVendorRisk: {
      project_id: number;
      vendor_name: string;
      risk_name: string;
      owner: string;
      risk_level: string;
      review_date: Date;
    } = req.body;

    if (
      !newVendorRisk.project_id ||
      !newVendorRisk.vendor_name ||
      !newVendorRisk.risk_name ||
      !newVendorRisk.owner ||
      !newVendorRisk.risk_level ||
      !newVendorRisk.review_date
    ) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message:
            "project_id, vendor_name, risk_name, owner, risk_level, and review_date are required",
        })
      );
    }

    const createdVendorRisk = await createNewVendorRiskQuery(newVendorRisk);

    if (createdVendorRisk) {
      return res.status(201).json(STATUS_CODE[201](createdVendorRisk));
    }

    return res.status(503).json(STATUS_CODE[503]({}));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateVendorRiskById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const vendorRiskId = parseInt(req.params.id);
    const updatedVendorRisk: {
      project_id: number;
      vendor_name: string;
      risk_name: string;
      owner: string;
      risk_level: string;
      review_date: Date;
    } = req.body;

    if (
      !updatedVendorRisk.project_id ||
      !updatedVendorRisk.vendor_name ||
      !updatedVendorRisk.risk_name ||
      !updatedVendorRisk.owner ||
      !updatedVendorRisk.risk_level ||
      !updatedVendorRisk.review_date
    ) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message:
            "project_id, vendor_name, risk_name, owner, risk_level, and review_date are required",
        })
      );
    }

    const vendorRisk = await updateVendorRiskByIdQuery(
      vendorRiskId,
      updatedVendorRisk
    );

    if (vendorRisk) {
      return res.status(202).json(STATUS_CODE[202](vendorRisk));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
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

    const deletedVendorRisk = await deleteVendorRiskByIdQuery(vendorRiskId);

    if (deletedVendorRisk) {
      return res.status(202).json(STATUS_CODE[202](deletedVendorRisk));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
