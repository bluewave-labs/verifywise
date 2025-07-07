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
import { VendorRisk } from "../domain.layer/models/vendorRisk/vendorRisk.model";
import { logProcessing, logSuccess, logFailure } from '../utils/logger/logHelper';

export async function getAllVendorRisksAllProjects(
  req: Request,
  res: Response
): Promise<any> {
  logProcessing('starting getAllVendorRisksAllProjects', 'getAllVendorRisksAllProjects', 'vendorRisk.ctrl.ts');

  try {
    const risks = await getAllVendorRisksAllProjectsQuery();
    await logSuccess('Read', 'Retrieved all vendor risks across all projects', 'getAllVendorRisksAllProjects', 'vendorRisk.ctrl.ts');
    return res.status(200).json(STATUS_CODE[200](risks));
  } catch (error) {
    await logFailure('Failed to retrieve vendor risks', 'getAllVendorRisksAllProjects', 'vendorRisk.ctrl.ts', error as Error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllVendorRisks(
  req: Request,
  res: Response
): Promise<any> {
  const projectId = parseInt(req.params.id);
  logProcessing(`starting getAllVendorRisks for project ID ${projectId}`, 'getAllVendorRisks', 'vendorRisk.ctrl.ts');

  try {
    const vendorRisks = await getVendorRisksByProjectIdQuery(projectId);

    if (vendorRisks) {
      await logSuccess('Read', `Retrieved vendor risks for project ID ${projectId}`, 'getAllVendorRisks', 'vendorRisk.ctrl.ts');
      return res.status(200).json(STATUS_CODE[200](vendorRisks));
    }

    await logSuccess('Read', `No vendor risks found for project ID ${projectId}`, 'getAllVendorRisks', 'vendorRisk.ctrl.ts');
    return res.status(204).json(STATUS_CODE[204](vendorRisks));
  } catch (error) {
    await logFailure('Failed to retrieve vendor risks by project', 'getAllVendorRisks', 'vendorRisk.ctrl.ts', error as Error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getVendorRiskById(
  req: Request,
  res: Response
): Promise<any> {
  const vendorRiskId = parseInt(req.params.id);
  logProcessing(`starting getVendorRiskById for ID ${vendorRiskId}`, 'getVendorRiskById', 'vendorRisk.ctrl.ts');

  try {
    const vendorRisk = await getVendorRiskByIdQuery(vendorRiskId);

    if (vendorRisk) {
      await logSuccess('Read', `Retrieved vendor risk ID ${vendorRiskId}`, 'getVendorRiskById', 'vendorRisk.ctrl.ts');
      return res.status(200).json(STATUS_CODE[200](vendorRisk));
    }

    await logSuccess('Read', `Vendor risk not found: ID ${vendorRiskId}`, 'getVendorRiskById', 'vendorRisk.ctrl.ts');
    return res.status(404).json(STATUS_CODE[404](vendorRisk));
  } catch (error) {
    await logFailure('Failed to retrieve vendor risk by ID', 'getVendorRiskById', 'vendorRisk.ctrl.ts', error as Error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createVendorRisk(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  logProcessing('starting createVendorRisk', 'createVendorRisk', 'vendorRisk.ctrl.ts');

  try {
    const newVendorRisk: VendorRisk = req.body;

    const createdVendorRisk = await createNewVendorRiskQuery(
      newVendorRisk,
      transaction
    );

    if (createdVendorRisk) {
      await transaction.commit();
      await logSuccess('Create', 'Created new vendor risk', 'createVendorRisk', 'vendorRisk.ctrl.ts');
      return res.status(201).json(STATUS_CODE[201](createdVendorRisk));
    }

    await logSuccess('Create', 'Vendor risk creation returned null', 'createVendorRisk', 'vendorRisk.ctrl.ts');
    return res.status(503).json(STATUS_CODE[503]({}));
  } catch (error) {
    await transaction.rollback();
    await logFailure('Failed to create vendor risk', 'createVendorRisk', 'vendorRisk.ctrl.ts', error as Error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateVendorRiskById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const vendorRiskId = parseInt(req.params.id);
  logProcessing(`starting updateVendorRiskById for ID ${vendorRiskId}`, 'updateVendorRiskById', 'vendorRisk.ctrl.ts');

  try {
    const updatedVendorRisk: VendorRisk = req.body;

    const vendorRisk = await updateVendorRiskByIdQuery(
      vendorRiskId,
      updatedVendorRisk,
      transaction
    );

    if (vendorRisk) {
      await transaction.commit();
      await logSuccess('Update', `Updated vendor risk ID ${vendorRiskId}`, 'updateVendorRiskById', 'vendorRisk.ctrl.ts');
      return res.status(202).json(STATUS_CODE[202](vendorRisk));
    }

    await logSuccess('Update', `Vendor risk not found for update: ID ${vendorRiskId}`, 'updateVendorRiskById', 'vendorRisk.ctrl.ts');
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    await logFailure('Failed to update vendor risk', 'updateVendorRiskById', 'vendorRisk.ctrl.ts', error as Error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteVendorRiskById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const vendorRiskId = parseInt(req.params.id);
  logProcessing(`starting deleteVendorRiskById for ID ${vendorRiskId}`, 'deleteVendorRiskById', 'vendorRisk.ctrl.ts');

  try {
    const deletedVendorRisk = await deleteVendorRiskByIdQuery(
      vendorRiskId,
      transaction
    );

    if (deletedVendorRisk) {
      await transaction.commit();
      await logSuccess('Delete', `Deleted vendor risk ID ${vendorRiskId}`, 'deleteVendorRiskById', 'vendorRisk.ctrl.ts');
      return res.status(202).json(STATUS_CODE[202](deletedVendorRisk));
    }

    await logSuccess('Delete', `Vendor risk not found for deletion: ID ${vendorRiskId}`, 'deleteVendorRiskById', 'vendorRisk.ctrl.ts');
    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    await logFailure('Failed to delete vendor risk', 'deleteVendorRiskById', 'vendorRisk.ctrl.ts', error as Error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
