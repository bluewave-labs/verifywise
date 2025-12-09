import { Request, Response } from "express";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { createPolicyLinkedObjectQuery, deletePolicyLinkedObjectQuery, getAllPolicyLinkedObjectsQuery, getPolicyLinkedObjectByIdQuery, updatePolicyLinkedObjectQuery } from "../utils/policyLinkedObject.utils";
import { Transaction } from "sequelize";
import { sequelize } from "../database/db";

/**
 * GET /policies/:policyId/linked-objects
 */
export async function getLinkedObjects(req: Request, res: Response) {
  const policyId = parseInt(req.params.policyId);

  logStructured(
    "processing",
    `Fetching linked objects for policy ${policyId}`,
    "getLinkedObjects",
    "policyLinkedObjects.ctrl.ts"
  );
  logger.debug(`🔍 Fetching linked objects for policy ${policyId}`);

  try {
    const tenant = req.tenantId!;
    const rows = await getPolicyLinkedObjectByIdQuery(policyId, tenant);

    const controls = rows.filter((r: any) => r.object_type === "control");
    const risks = rows.filter((r: any) => r.object_type === "risk");
    const evidence = rows.filter((r: any) => r.object_type === "evidence");

    logStructured(
      "successful",
      `linked objects fetched for policy ${policyId}`,
      "getLinkedObjects",
      "policyLinkedObjects.ctrl.ts"
    );
    logger.debug(
      `✅ Linked objects fetched: controls=${controls.length}, risks=${risks.length}, evidence=${evidence.length}`
    );

    return res.status(200).json(
      STATUS_CODE[200]({
        controls,
        risks,
        evidence,
      })
    );
  } catch (error) {
    logStructured(
      "error",
      "failed to fetch linked objects",
      "getLinkedObjects",
      "policyLinkedObjects.ctrl.ts"
    );
    logger.error("❌ Error in getLinkedObjects:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * POST /policies/:policyId/linked-objects
 */
export async function createLinkedObject(req: Request, res: Response) {
  const policyId = parseInt(req.params.policyId);
  const { object_type, object_id, object_ids } = req.body;

  logger.debug(`🔗 Linking ${object_type} to policy ${policyId}`);

  let transaction: Transaction | null = null;

  try {
    const tenant = req.tenantId!;
    transaction = await sequelize.transaction();

    // Handle single insert (old)
    if (object_id) {
      await createPolicyLinkedObjectQuery(
        policyId,
        object_type,
        object_id,
        tenant,
        transaction
      );
    }

    // Handle bulk insert (new)
    if (Array.isArray(object_ids)) {
      for (const id of object_ids) {
        await createPolicyLinkedObjectQuery(
          policyId,
          object_type,
          id,
          tenant,
          transaction
        );
      }
    }

    await transaction.commit();

    return res.status(201).json({
      message: "Linked successfully",
    });
  } catch (error: any) {
    if (transaction) await transaction.rollback();
    logger.error("❌ Error in createLinkedObject:", error);
    return res.status(500).json({ message: error.message });
  }
}

  

export async function updateLinkedObject(req: Request, res: Response) {
    const policyId = parseInt(req.params.policyId);
    const { old_object_type, old_object_id, new_object_type, new_object_id } = req.body;
  
    logger.debug(
      `♻️ Updating link for policy ${policyId}: ${old_object_type}(${old_object_id}) → ${new_object_type}(${new_object_id})`
    );
  
    let transaction: Transaction | null = null;
  
    try {
      const tenant = req.tenantId!;
      transaction = await sequelize.transaction();
  
      await updatePolicyLinkedObjectQuery(
        policyId,
        old_object_type,
        old_object_id,
        new_object_type,
        new_object_id,
        tenant,
        transaction
      );
  
      await transaction.commit();
  
      logger.debug(`✅ Link updated successfully for policy ${policyId}`);
  
      return res
        .status(200)
        .json(STATUS_CODE[200]("Linked object updated successfully"));
    } catch (error) {
      if (transaction) await transaction.rollback();
  
      logger.error("❌ Error in updateLinkedObject:", error);
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
}
  
  

/**
 * DELETE /policies/:policyId/linked-objects
 */
export async function deleteLinkedObject(req: Request, res: Response) {
    const policyId = parseInt(req.params.policyId);
    const { object_type, object_id } = req.body;
  
    logStructured(
      "processing",
      `Deleting link for policy ${policyId}`,
      "deleteLinkedObject",
      "policyLinkedObjects.ctrl.ts"
    );
    logger.debug(`🗑️ Unlinking ${object_type} (${object_id}) from policy ${policyId}`);
  
    let transaction: Transaction | null = null;
  
    try {
      const tenant = req.tenantId!;
      transaction = await sequelize.transaction();
  
      await deletePolicyLinkedObjectQuery(policyId, object_type, object_id, tenant, transaction);
  
      await transaction.commit();
  
      logStructured(
        "successful",
        `link removed for policy ${policyId}`,
        "deleteLinkedObject",
        "policyLinkedObjects.ctrl.ts"
      );
      logger.debug(`✅ Link removed for policy ${policyId}`);
  
      return res
        .status(200)
        .json(STATUS_CODE[200]("Unlinked successfully"));
    } catch (error) {
      if (transaction) await transaction.rollback();
  
      logStructured(
        "error",
        "failed to unlink object",
        "deleteLinkedObject",
        "policyLinkedObjects.ctrl.ts"
      );
      logger.error("❌ Error in deleteLinkedObject:", error);
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
}
  