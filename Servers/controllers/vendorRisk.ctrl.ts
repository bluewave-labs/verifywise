import { Request, Response } from "express";
import { sequelize } from "../database/db";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewVendorRiskQuery,
  deleteVendorRiskByIdQuery,
  getAllVendorRisksAllProjectsQuery,
  getVendorRiskByIdQuery,
  getVendorRisksByProjectIdQuery,
  updateVendorRiskByIdQuery,
} from "../utils/vendorRisk.utils";
import { VendorRiskModel } from "../domain.layer/models/vendorRisk/vendorRisk.model";
import { logProcessing, logSuccess, logFailure } from '../utils/logger/logHelper';

export async function getAllVendorRisksAllProjects(
  req: Request,
  res: Response
): Promise<any> {
  logProcessing({
    description: 'starting getAllVendorRisksAllProjects',
    functionName: 'getAllVendorRisksAllProjects',
    fileName: 'vendorRisk.ctrl.ts'
  });

  try {
    const risks = await getAllVendorRisksAllProjectsQuery(req.tenantId!);
    await logSuccess({
      eventType: 'Read',
      description: 'Retrieved all vendor risks across all projects',
      functionName: 'getAllVendorRisksAllProjects',
      fileName: 'vendorRisk.ctrl.ts'
    });
    return res.status(200).json(STATUS_CODE[200](risks));
  } catch (error) {
    await logFailure({
      eventType: 'Read',
      description: 'Failed to retrieve vendor risks',
      functionName: 'getAllVendorRisksAllProjects',
      fileName: 'vendorRisk.ctrl.ts',
      error: error as Error
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllVendorRisks(
  req: Request,
  res: Response
): Promise<any> {
  const projectId = parseInt(req.params.id);
  logProcessing({
    description: `starting getAllVendorRisks for project ID ${projectId}`,
    functionName: 'getAllVendorRisks',
    fileName: 'vendorRisk.ctrl.ts'
  });

  try {
    const vendorRisks = await getVendorRisksByProjectIdQuery(projectId, req.tenantId!);

    if (vendorRisks) {
      await logSuccess({
        eventType: 'Read',
        description: `Retrieved vendor risks for project ID ${projectId}`,
        functionName: 'getAllVendorRisks',
        fileName: 'vendorRisk.ctrl.ts'
      });
      return res.status(200).json(STATUS_CODE[200](vendorRisks));
    }

    await logSuccess({
      eventType: 'Read',
      description: `No vendor risks found for project ID ${projectId}`,
      functionName: 'getAllVendorRisks',
      fileName: 'vendorRisk.ctrl.ts'
    });
    return res.status(204).json(STATUS_CODE[204](vendorRisks));
  } catch (error) {
    await logFailure({
      eventType: 'Read',
      description: 'Failed to retrieve vendor risks by project',
      functionName: 'getAllVendorRisks',
      fileName: 'vendorRisk.ctrl.ts',
      error: error as Error
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getVendorRiskById(
  req: Request,
  res: Response
): Promise<any> {
  const vendorRiskId = parseInt(req.params.id);
  logProcessing({
    description: `starting getVendorRiskById for ID ${vendorRiskId}`,
    functionName: 'getVendorRiskById',
    fileName: 'vendorRisk.ctrl.ts'
  });

  try {
    const vendorRisk = await getVendorRiskByIdQuery(vendorRiskId, req.tenantId!);

    if (vendorRisk) {
      await logSuccess({
        eventType: 'Read',
        description: `Retrieved vendor risk ID ${vendorRiskId}`,
        functionName: 'getVendorRiskById',
        fileName: 'vendorRisk.ctrl.ts'
      });
      return res.status(200).json(STATUS_CODE[200](vendorRisk));
    }

    await logSuccess({
      eventType: 'Read',
      description: `Vendor risk not found: ID ${vendorRiskId}`,
      functionName: 'getVendorRiskById',
      fileName: 'vendorRisk.ctrl.ts'
    });
    return res.status(404).json(STATUS_CODE[404](vendorRisk));
  } catch (error) {
    await logFailure({
      eventType: 'Read',
      description: 'Failed to retrieve vendor risk by ID',
      functionName: 'getVendorRiskById',
      fileName: 'vendorRisk.ctrl.ts',
      error: error as Error
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createVendorRisk(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  logProcessing({
    description: 'starting createVendorRisk',
    functionName: 'createVendorRisk',
    fileName: 'vendorRisk.ctrl.ts'
  });

  try {
    const newVendorRisk: VendorRiskModel = req.body;
    const vendorRiskModel = await VendorRiskModel.createNewVendorRisk(newVendorRisk);

    const createdVendorRisk = await createNewVendorRiskQuery(
      vendorRiskModel,
      req.tenantId!,
      transaction
    );

    if (createdVendorRisk) {
      await transaction.commit();
      await logSuccess({
        eventType: 'Create',
        description: 'Created new vendor risk',
        functionName: 'createVendorRisk',
        fileName: 'vendorRisk.ctrl.ts'
      });
        
    }

    await logSuccess({
      eventType: 'Create',
      description: 'Vendor risk creation returned null',
      functionName: 'createVendorRisk',
      fileName: 'vendorRisk.ctrl.ts'
    });
    return res.status(503).json(STATUS_CODE[503]({}));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: 'Create',
      description: 'Failed to create vendor risk',
      functionName: 'createVendorRisk',
      fileName: 'vendorRisk.ctrl.ts',
      error: error as Error
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateVendorRiskById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const vendorRiskId = parseInt(req.params.id);
  const updatedVendorRisk = req.body;
  logProcessing({
    description: `starting updateVendorRiskById for ID ${vendorRiskId}`,
    functionName: 'updateVendorRiskById',
    fileName: 'vendorRisk.ctrl.ts'
  });

  try {
    const vendorRiskModel = new VendorRiskModel();
    await vendorRiskModel.updateVendorRisk(updatedVendorRisk);

    const vendorRisk = await updateVendorRiskByIdQuery(
      vendorRiskId,
      vendorRiskModel,
      req.tenantId!,
      transaction
    );

    if (vendorRisk) {
      await transaction.commit();
      await logSuccess({
        eventType: 'Update',
        description: `Updated vendor risk ID ${vendorRiskId}`,
        functionName: 'updateVendorRiskById',
        fileName: 'vendorRisk.ctrl.ts'
      });
      return res.status(202).json(STATUS_CODE[202](vendorRisk));
    }

    await logSuccess({
      eventType: 'Update',
      description: `Vendor risk not found for update: ID ${vendorRiskId}`,
      functionName: 'updateVendorRiskById',
      fileName: 'vendorRisk.ctrl.ts'
    });
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: 'Update',
      description: 'Failed to update vendor risk',
      functionName: 'updateVendorRiskById',
      fileName: 'vendorRisk.ctrl.ts',
      error: error as Error
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteVendorRiskById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const vendorRiskId = parseInt(req.params.id);
  logProcessing({
    description: `starting deleteVendorRiskById for ID ${vendorRiskId}`,
    functionName: 'updateVedeleteVendorRiskByIdndorRiskById',
    fileName: 'vendorRisk.ctrl.ts'
  });

  try {
    const deletedVendorRisk = await deleteVendorRiskByIdQuery(
      vendorRiskId,
      req.tenantId!,
      transaction
    );

    if (deletedVendorRisk) {
      await transaction.commit();
      await logSuccess({
        eventType: 'Delete',
        description: `Deleted vendor risk ID ${vendorRiskId}`,
        functionName: 'deleteVendorRiskById',
        fileName: 'vendorRisk.ctrl.ts'
      });
      return res.status(202).json(STATUS_CODE[202](deletedVendorRisk));
    }

    await logSuccess({
      eventType: 'Delete',
      description: `Deleted vendor risk ID ${vendorRiskId}`,
      functionName: 'deleteVendorRiskById',
      fileName: 'vendorRisk.ctrl.ts'
    });
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: 'Delete',
      description: 'Failed to delete vendor risk',
      functionName: 'deleteVendorRiskById',
      fileName: 'vendorRisk.ctrl.ts',
      error: error as Error
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
