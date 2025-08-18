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
import { sequelize } from "../database/db";
import {
  logFailure,
  logProcessing,
  logSuccess,
} from "../utils/logger/logHelper";
import { VendorModel } from "../domain.layer/models/vendor/vendor.model";
import {
  ValidationException,
  BusinessLogicException,
} from "../domain.layer/exceptions/custom.exception";

export async function getAllVendors(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getAllVendors",
    functionName: "getAllVendors",
    fileName: "vendor.ctrl.ts",
  });

  try {
    const vendors = await getAllVendorsQuery(req.tenantId!);

    if (vendors) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved ${vendors.length} vendors`,
        functionName: "getAllVendors",
        fileName: "vendor.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](vendors));
    }

    await logSuccess({
      eventType: "Read",
      description: "No vendors found",
      functionName: "getAllVendors",
      fileName: "vendor.ctrl.ts",
    });
    return res.status(204).json(STATUS_CODE[204](vendors));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve vendors",
      functionName: "getAllVendors",
      fileName: "vendor.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getVendorById(req: Request, res: Response): Promise<any> {
  const vendorId = parseInt(req.params.id);
  logProcessing({
    description: `starting getVendorById for ID ${vendorId}`,
    functionName: "getVendorById",
    fileName: "vendor.ctrl.ts",
  });

  try {
    const vendor = await getVendorByIdQuery(vendorId, req.tenantId!);

    if (vendor) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved vendor ID ${vendorId}`,
        functionName: "getVendorById",
        fileName: "vendor.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](vendor));
    }

    await logSuccess({
      eventType: "Read",
      description: `Vendor not found: ID ${vendorId}`,
      functionName: "getVendorById",
      fileName: "vendor.ctrl.ts",
    });
    return res.status(404).json(STATUS_CODE[404](vendor));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve vendor by ID",
      functionName: "getVendorById",
      fileName: "vendor.ctrl.ts",
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
    functionName: "getVendorByProjectId",
    fileName: "vendor.ctrl.ts",
  });

  try {
    const vendor = await getVendorByProjectIdQuery(vendorId, req.tenantId!);

    if (vendor !== null) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved vendor by project ID ${vendorId}`,
        functionName: "getVendorByProjectId",
        fileName: "vendor.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](vendor));
    }

    await logSuccess({
      eventType: "Read",
      description: `Vendor not found for project ID ${vendorId}`,
      functionName: "getVendorByProjectId",
      fileName: "vendor.ctrl.ts",
    });
    return res.status(404).json(STATUS_CODE[404]([]));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve vendor by project ID",
      functionName: "getVendorByProjectId",
      fileName: "vendor.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createVendor(req: Request, res: Response): Promise<any> {
  const transaction = await sequelize.transaction();
  const vendorData = req.body;

  logProcessing({
    description: "starting createVendor",
    functionName: "createVendor",
    fileName: "vendor.ctrl.ts",
  });

  try {
    // Create vendor using the enhanced VendorModel method
    const vendorModel = await VendorModel.createNewVendor(
      vendorData.vendor_name,
      vendorData.vendor_provides,
      vendorData.assignee,
      vendorData.website,
      vendorData.vendor_contact_person,
      vendorData.review_result,
      vendorData.review_status,
      vendorData.reviewer,
      vendorData.review_date,
      vendorData.order_no,
      vendorData.is_demo || false,
      vendorData.projects
    );

    // Validate vendor data before saving
    await vendorModel.validateVendorData();

    // Check if vendor can be modified (demo restrictions)
    vendorModel.canBeModified();

    const createdVendor = await createNewVendorQuery(
      vendorModel,
      req.tenantId!,
      transaction
    );

    if (createdVendor) {
      await transaction.commit();
      await logSuccess({
        eventType: "Create",
        description: `Created vendor: ${createdVendor.vendor_name}`,
        functionName: "createVendor",
        fileName: "vendor.ctrl.ts",
      });
      return res.status(201).json(STATUS_CODE[201](createdVendor));
    }

    await logSuccess({
      eventType: "Create",
      description: "Vendor creation returned null",
      functionName: "createVendor",
      fileName: "vendor.ctrl.ts",
    });
    return res.status(503).json(STATUS_CODE[503]({}));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      await logFailure({
        eventType: "Create",
        description: `Validation failed: ${error.message}`,
        functionName: "createVendor",
        fileName: "vendor.ctrl.ts",
        error: error as Error,
      });
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      await logFailure({
        eventType: "Create",
        description: `Business logic error: ${error.message}`,
        functionName: "createVendor",
        fileName: "vendor.ctrl.ts",
        error: error as Error,
      });
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    await logFailure({
      eventType: "Create",
      description: "Failed to create vendor",
      functionName: "createVendor",
      fileName: "vendor.ctrl.ts",
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
  const updateData = req.body;

  logProcessing({
    description: `starting updateVendorById for ID ${vendorId}`,
    functionName: "updateVendorById",
    fileName: "vendor.ctrl.ts",
  });

  try {
    const { userId, role } = req;
    if (!userId || !role) {
      await logFailure({
        eventType: "Update",
        description: "Unauthorized access attempt to update vendor",
        functionName: "updateVendorById",
        fileName: "vendor.ctrl.ts",
        error: new Error("Unauthorized"),
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find existing vendor
    const existingVendor = await getVendorByIdQuery(vendorId, req.tenantId!);

    if (!existingVendor) {
      await logSuccess({
        eventType: "Update",
        description: `Vendor not found for update: ID ${vendorId}`,
        functionName: "updateVendorById",
        fileName: "vendor.ctrl.ts",
      });
      return res.status(404).json(STATUS_CODE[404]({}));
    }

    // Create VendorModel instance and update it
    const vendorModel = new VendorModel(existingVendor);

    // Update vendor using the enhanced method
    await vendorModel.updateVendor({
      vendor_name: updateData.vendor_name,
      vendor_provides: updateData.vendor_provides,
      assignee: updateData.assignee,
      website: updateData.website,
      vendor_contact_person: updateData.vendor_contact_person,
      review_result: updateData.review_result,
      review_status: updateData.review_status,
      reviewer: updateData.reviewer,
      review_date: updateData.review_date,
      order_no: updateData.order_no,
      projects: updateData.projects,
    });

    // Validate updated data
    await vendorModel.validateVendorData();

    const vendor = await updateVendorByIdQuery(
      {
        id: vendorId,
        vendor: vendorModel,
        userId,
        role,
        transaction,
      },
      req.tenantId!
    );

    if (vendor) {
      await transaction.commit();
      await logSuccess({
        eventType: "Update",
        description: `Updated vendor ID ${vendorId}`,
        functionName: "updateVendorById",
        fileName: "vendor.ctrl.ts",
      });
      return res.status(202).json(STATUS_CODE[202](vendor));
    }

    await logSuccess({
      eventType: "Update",
      description: `Vendor not found for update: ID ${vendorId}`,
      functionName: "updateVendorById",
      fileName: "vendor.ctrl.ts",
    });
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      await logFailure({
        eventType: "Update",
        description: `Validation failed: ${error.message}`,
        functionName: "updateVendorById",
        fileName: "vendor.ctrl.ts",
        error: error as Error,
      });
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      await logFailure({
        eventType: "Update",
        description: `Business logic error: ${error.message}`,
        functionName: "updateVendorById",
        fileName: "vendor.ctrl.ts",
        error: error as Error,
      });
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    await logFailure({
      eventType: "Update",
      description: "Failed to update vendor",
      functionName: "updateVendorById",
      fileName: "vendor.ctrl.ts",
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
    functionName: "deleteVendorById",
    fileName: "vendor.ctrl.ts",
  });

  try {
    const deletedVendor = await deleteVendorByIdQuery(
      vendorId,
      req.tenantId!,
      transaction
    );

    if (deletedVendor) {
      await transaction.commit();
      await logSuccess({
        eventType: "Delete",
        description: `Deleted vendor ID ${vendorId}`,
        functionName: "deleteVendorById",
        fileName: "vendor.ctrl.ts",
      });
      return res.status(202).json(STATUS_CODE[202](deletedVendor));
    }

    await logSuccess({
      eventType: "Delete",
      description: `Vendor not found for deletion: ID ${vendorId}`,
      functionName: "deleteVendorById",
      fileName: "vendor.ctrl.ts",
    });
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: "Delete",
      description: "Failed to delete vendor",
      functionName: "deleteVendorById",
      fileName: "vendor.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
