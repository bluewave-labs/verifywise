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
import { logFailure, logProcessing, logSuccess } from "../utils/logger/logHelper";

export async function getAllVendors(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: 'starting getAllVendors',
    functionName: 'getAllVendors',
    fileName: 'vendor.ctrl.ts',
  });

  try {
    const vendors = await getAllVendorsQuery();

    if (vendors) {
      await logSuccess({
        eventType: 'Read',
        description: `Retrieved ${vendors.length} vendors`,
        functionName: 'getAllVendors',
        fileName: 'vendor.ctrl.ts',
      });
      return res.status(200).json(STATUS_CODE[200](vendors));
    }

    await logSuccess({
      eventType: 'Read',
      description: 'No vendors found',
      functionName: 'getAllVendors',
      fileName: 'vendor.ctrl.ts',
    });
    return res.status(204).json(STATUS_CODE[204](vendors));
  } catch (error) {
    await logFailure({
      description: 'Failed to retrieve vendors',
      functionName: 'getAllVendors',
      fileName: 'vendor.ctrl.ts',
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getVendorById(req: Request, res: Response): Promise<any> {
  const vendorId = parseInt(req.params.id);
  logProcessing({
    description: `starting getVendorById for ID ${vendorId}`,
    functionName: 'getVendorById',
    fileName: 'vendor.ctrl.ts',
  });

  try {
    const vendor = await getVendorByIdQuery(vendorId);

    if (vendor) {
      await logSuccess({
        eventType: 'Read',
        description: `Retrieved vendor ID ${vendorId}`,
        functionName: 'getVendorById',
        fileName: 'vendor.ctrl.ts',
      });
      return res.status(200).json(STATUS_CODE[200](vendor));
    }

    await logSuccess({
      eventType: 'Read',
      description: `Vendor not found: ID ${vendorId}`,
      functionName: 'getVendorById',
      fileName: 'vendor.ctrl.ts',
    });
    return res.status(404).json(STATUS_CODE[404](vendor));
  } catch (error) {
    await logFailure({
      description: 'Failed to retrieve vendor by ID',
      functionName: 'getVendorById',
      fileName: 'vendor.ctrl.ts',
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getVendorByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  const vendorId = parseInt(req.params.id);
  logProcessing({
    description: `starting getVendorByProjectId for ID ${vendorId}`,
    functionName: 'getVendorByProjectId',
    fileName: 'vendor.ctrl.ts',
  });

  try {
    const vendor = await getVendorByProjectIdQuery(vendorId);

    if (vendor !== null) {
      await logSuccess({
        eventType: 'Read',
        description: `Retrieved vendor by project ID ${vendorId}`,
        functionName: 'getVendorByProjectId',
        fileName: 'vendor.ctrl.ts',
      });
      return res.status(200).json(STATUS_CODE[200](vendor));
    }

    await logSuccess({
      eventType: 'Read',
      description: `Vendor not found for project ID ${vendorId}`,
      functionName: 'getVendorByProjectId',
      fileName: 'vendor.ctrl.ts',
    });
    return res.status(404).json(STATUS_CODE[404]([]));
  } catch (error) {
    await logFailure({
      description: 'Failed to retrieve vendor by project ID',
      functionName: 'getVendorByProjectId',
      fileName: 'vendor.ctrl.ts',
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createVendor(req: Request, res: Response): Promise<any> {
  const transaction = await sequelize.transaction();
  logProcessing({
    description: 'starting createVendor',
    functionName: 'createVendor',
    fileName: 'vendor.ctrl.ts',
  });
  try {
    const newVendor: Vendor = req.body;

    if (!newVendor.vendor_name || !newVendor.vendor_provides) {
      await logFailure({
        description: 'Validation failed: Missing vendorName or vendorProvides',
        functionName: 'createVendor',
        fileName: 'vendor.ctrl.ts',
        error: new Error('Missing required fields'),
      });
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "vendorName and vendorProvides are required",
        })
      );
    }

    const createdVendor = await createNewVendorQuery(newVendor, transaction);

    if (createdVendor) {
      await transaction.commit();
      await logSuccess({
        eventType: 'Create',
        description: `Created vendor: ${createdVendor.vendor_name}`,
        functionName: 'createVendor',
        fileName: 'vendor.ctrl.ts',
      });
      return res.status(201).json(STATUS_CODE[201](createdVendor));
    }

    await logSuccess({
      eventType: 'Create',
      description: 'Vendor creation returned null',
      functionName: 'createVendor',
      fileName: 'vendor.ctrl.ts',
    });
    return res.status(503).json(STATUS_CODE[503]({}));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      description: 'Failed to create vendor',
      functionName: 'createVendor',
      fileName: 'vendor.ctrl.ts',
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateVendorById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const vendorId = parseInt(req.params.id);
  logProcessing({
    description: `starting updateVendorById for ID ${vendorId}`,
    functionName: 'updateVendorById',
    fileName: 'vendor.ctrl.ts',
  });

  try {
    const { userId, role } = req;
    if (!userId || !role) {
      await logFailure({
        description: 'Unauthorized access attempt to update vendor',
        functionName: 'updateVendorById',
        fileName: 'vendor.ctrl.ts',
        error: new Error('Unauthorized'),
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updatedVendor: Vendor = req.body;

    if (!updatedVendor.vendor_name || !updatedVendor.vendor_provides) {
      await logSuccess({
        eventType: 'Update',
        description: 'Missing vendorName or vendorProvides',
        functionName: 'updateVendorById',
        fileName: 'vendor.ctrl.ts',
      });
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
      await logSuccess({
        eventType: 'Update',
        description: `Updated vendor ID ${vendorId}`,
        functionName: 'updateVendorById',
        fileName: 'vendor.ctrl.ts',
      });
      return res.status(202).json(STATUS_CODE[202](vendor));
    }

    await logSuccess({
      eventType: 'Update',
      description: `Vendor not found for update: ID ${vendorId}`,
      functionName: 'updateVendorById',
      fileName: 'vendor.ctrl.ts',
    });
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      description: 'Failed to update vendor',
      functionName: 'updateVendorById',
      fileName: 'vendor.ctrl.ts',
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteVendorById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const vendorId = parseInt(req.params.id);

  logProcessing({
    description: `starting deleteVendorById for ID ${vendorId}`,
    functionName: 'deleteVendorById',
    fileName: 'vendor.ctrl.ts',
  });

  try {
    const deletedVendor = await deleteVendorByIdQuery(vendorId, transaction);

    if (deletedVendor) {
      await transaction.commit();
      await logSuccess({
        eventType: 'Delete',
        description: `Deleted vendor ID ${vendorId}`,
        functionName: 'deleteVendorById',
        fileName: 'vendor.ctrl.ts',
      });
      return res.status(202).json(STATUS_CODE[202](deletedVendor));
    }

    await logSuccess({
      eventType: 'Delete',
      description: `Vendor not found for deletion: ID ${vendorId}`,
      functionName: 'deleteVendorById',
      fileName: 'vendor.ctrl.ts',
    });
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      description: 'Failed to delete vendor',
      functionName: 'deleteVendorById',
      fileName: 'vendor.ctrl.ts',
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
