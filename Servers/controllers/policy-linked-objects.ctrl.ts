import { Request, Response } from "express";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { createPolicyLinkedObjectQuery, deletePolicyLinkedObjectQuery, getAllPolicyLinkedObjectsQuery, getPolicyLinkedObjectByIdQuery } from "../utils/policyLinkedObject.utils";
import { Transaction } from "sequelize";
import { sequelize } from "../database/db";

/**
 * GET /policies/:policyId/linked-objects
 */

export async function getAllLinkedObjects(req: Request, res: Response) {
  logStructured(
    "processing",
    "starting getAllLinkedObjects",
    "getAllLinkedObjects",
    "policyLinkedObjects.ctrl.ts"
  );
  logger.debug("🔍 Fetching all linked objects");

  try {
    const tenant = req.tenantId!;
    const rows = await getAllPolicyLinkedObjectsQuery(tenant);

    const grouped = rows.reduce(
      (acc, row: any) => {
        switch (row.object_type) {
          case "control":
            acc.controls.push(row);
            break;
          case "risk":
            acc.risks.push(row);
            break;
          case "evidence":
            acc.evidence.push(row);
            break;
        }
        return acc;
      },
      {
        controls: [] as any[],
        risks: [] as any[],
        evidence: [] as any[],
      }
    );

    logStructured(
      "successful",
      rows.length > 0 ? "linked objects found" : "no linked objects found",
      "getAllLinkedObjects",
      "policyLinkedObjects.ctrl.ts"
    );

    logger.debug(
      `✅ Linked objects fetched: controls=${grouped.controls.length}, risks=${grouped.risks.length}, evidence=${grouped.evidence.length}`
    );

    return res.status(200).json(STATUS_CODE[200](grouped));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve linked objects",
      "getAllLinkedObjects",
      "policyLinkedObjects.ctrl.ts"
    );
    logger.error("❌ Error in getAllLinkedObjects:", error);

    return res.status(500).json(
      STATUS_CODE[500]((error as Error).message)
    );
  }
}




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

    const grouped = rows.reduce(
      (acc, row: any) => {
        switch (row.object_type) {
          case "control":
            acc.controls.push(row);
            break;
          case "risk":
            acc.risks.push(row);
            break;
          case "evidence":
            acc.evidence.push(row);
            break;
        }
        return acc;
      },
      {
        controls: [] as any[],
        risks: [] as any[],
        evidence: [] as any[],
      }
    );

    logStructured(
      "successful",
      `linked objects fetched for policy ${policyId}`,
      "getLinkedObjects",
      "policyLinkedObjects.ctrl.ts"
    );
    logger.debug(
      `✅ Linked objects fetched: controls=${grouped.controls.length}, risks=${grouped.risks.length}, evidence=${grouped.evidence.length}`
    );

    return res.status(200).json(STATUS_CODE[200](grouped));
  } catch (error) {
    logStructured(
      "error",
      "failed to fetch linked objects",
      "getLinkedObjects",
      "policyLinkedObjects.ctrl.ts"
    );
    logger.error("❌ Error in getLinkedObjects:", error);
    return res.status(500).json(
      STATUS_CODE[500]((error as Error).message)
    );
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


export async function deleteRiskFromAllPolicies(req: Request, res: Response) {
  const riskId = parseInt(req.params.riskId);

  logStructured(
    "processing",
    `Deleting risk ${riskId} from all policies`,
    "deleteRiskFromAllPolicies",
    "policyLinkedObjects.ctrl.ts"
  );

  let transaction: Transaction | null = null;

  try {
    const tenant = req.tenantId!;
    transaction = await sequelize.transaction();

    await sequelize.query(
      `DELETE FROM "${tenant}".policy_linked_objects
       WHERE object_id = :riskId AND object_type = 'risk'`,
      {
        replacements: { riskId },
        transaction,
      }
    );

    await transaction.commit();

    logStructured(
      "successful",
      `Risk ${riskId} removed from all policies`,
      "deleteRiskFromAllPolicies",
      "policyLinkedObjects.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200]("Risk unlinked from all policies successfully"));
  } catch (error) {
    if (transaction) await transaction.rollback();
    logStructured(
      "error",
      "failed to unlink risk from all policies",
      "deleteRiskFromAllPolicies",
      "policyLinkedObjects.ctrl.ts"
    );
    logger.error("❌ Error in deleteRiskFromAllPolicies:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}


export async function deleteEvidenceFromAllPolicies(req: Request, res: Response) {
  const evidenceId = parseInt(req.params.evidenceId);

  let transaction: Transaction | null = null;

  try {
    const tenant = req.tenantId!;
    transaction = await sequelize.transaction();

    await sequelize.query(
      `DELETE FROM "${tenant}".policy_linked_objects
       WHERE object_id = :evidenceId AND object_type = 'evidence'`,
      {
        replacements: { evidenceId },
        transaction,
      }
    );

    await transaction.commit();

    return res.status(200).json(STATUS_CODE[200]("Evidence unlinked from all policies successfully"));
  } catch (error) {
    if (transaction) await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

  
  

/**
 * DELETE /policies/:policyId/linked-objects
 */
export async function deleteLinkedObject(req: Request, res: Response) {
    const id = parseInt(req.params.policyId);
  
    logStructured(
      "processing",
      `Deleting link for policy ${id}`,
      "deleteLinkedObject",
      "policyLinkedObjects.ctrl.ts"
    );
    logger.debug(`🗑️ Unlinking ${id} ($ from policy ${id}`);
  
    let transaction: Transaction | null = null;
  
    try {
      const tenant = req.tenantId!;
      transaction = await sequelize.transaction();
  
      await deletePolicyLinkedObjectQuery(id, tenant, transaction);
  
      await transaction.commit();
  
      logStructured(
        "successful",
        `link removed for policy ${id}`,
        "deleteLinkedObject",
        "policyLinkedObjects.ctrl.ts"
      );
      logger.debug(`✅ Link removed for policy ${id}`);
  
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
  