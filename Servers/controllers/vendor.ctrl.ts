import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewVendorQuery,
  deleteVendorByIdQuery,
  getAllVendorsQuery,
  getVendorByIdQuery,
  getVendorByProjectIdQuery,
  updateVendorByIdQuery,
} from "../utils/vendor.utils";
import { Vendor } from "../domain.layer/models/vendor/vendor.model";
import { sequelize } from "../database/db";

export async function getAllVendors(req: Request, res: Response): Promise<any> {
  try {
    const vendors = await getAllVendorsQuery();

    if (vendors) {
      return res.status(200).json(STATUS_CODE[200](vendors));
    }

    return res.status(204).json(STATUS_CODE[204](vendors));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getVendorById(req: Request, res: Response): Promise<any> {
  try {
    const vendorId = parseInt(req.params.id);

    const vendor = await getVendorByIdQuery(vendorId);

    if (vendor) {
      return res.status(200).json(STATUS_CODE[200](vendor));
    }

    return res.status(404).json(STATUS_CODE[404](vendor));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getVendorByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const vendorId = parseInt(req.params.id);

    const vendor = await getVendorByProjectIdQuery(vendorId);

    if (vendor !== null) {
      return res.status(200).json(STATUS_CODE[200](vendor));
    }

    return res.status(404).json(STATUS_CODE[404]([]));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createVendor(req: Request, res: Response): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const newVendor: Vendor = req.body;

    if (!newVendor.vendor_name || !newVendor.vendor_provides) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "vendorName and vendorProvides are required",
        })
      );
    }

    const createdVendor = await createNewVendorQuery(newVendor, transaction);

    if (createdVendor) {
      await transaction.commit();
      return res.status(201).json(STATUS_CODE[201](createdVendor));
    }

    return res.status(503).json(STATUS_CODE[503]({}));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateVendorById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const { userId, role } = req;
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const vendorId = parseInt(req.params.id);
    const updatedVendor: Vendor = req.body;

    if (!updatedVendor.vendor_name || !updatedVendor.vendor_provides) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "vendorName and vendorProvides are required",
        })
      );
    }

    const vendor = await updateVendorByIdQuery({
      id: vendorId,
      vendor: updatedVendor,
      userId,
      role,
      transaction,
    });

    if (vendor) {
      await transaction.commit();
      return res.status(202).json(STATUS_CODE[202](vendor));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteVendorById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const vendorId = parseInt(req.params.id);

    const deletedVendor = await deleteVendorByIdQuery(vendorId, transaction);

    if (deletedVendor) {
      await transaction.commit();
      return res.status(202).json(STATUS_CODE[202](deletedVendor));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
