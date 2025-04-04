import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewVendorRiskQuery,
  deleteVendorRiskByIdQuery,
  getVendorRiskByIdQuery,
  getVendorRisksByProjectIdQuery,
  updateVendorRiskByIdQuery,
} from "../utils/vendorRisk.util";
import { VendorRisk } from "../models/vendorRisk.model";

export async function getAllVendorRisks(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectId = parseInt(req.params.id);
    const vendorRisks = await getVendorRisksByProjectIdQuery(projectId);

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
    const newVendorRisk: VendorRisk = req.body;

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
    const updatedVendorRisk: VendorRisk = req.body;

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
