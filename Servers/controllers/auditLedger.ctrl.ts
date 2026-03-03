import { Request, Response } from "express";
import { QueryTypes } from "sequelize";
import { sequelize } from "../database/db";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { verifyChain } from "../utils/auditLedger.utils";
import { logProcessing, logSuccess, logFailure } from "../utils/logger/logHelper";

export async function getAuditLedger(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getAuditLedger",
    functionName: "getAuditLedger",
    fileName: "auditLedger.ctrl.ts",
    userId: req.userId!,
    tenantId: req.tenantId!,
  });

  try {
    const tenantId = req.tenantId!;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    const countResult: any[] = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${tenantId}".audit_ledger`,
      { type: QueryTypes.SELECT }
    );
    const total = parseInt(countResult[0]?.count || "0", 10);

    const entries = await sequelize.query(
      `SELECT al.*, u.name as user_name, u.surname as user_surname
       FROM "${tenantId}".audit_ledger al
       LEFT JOIN public.users u ON al.user_id = u.id
       ORDER BY al.id DESC
       LIMIT :limit OFFSET :offset`,
      {
        replacements: { limit, offset },
        type: QueryTypes.SELECT,
      }
    );

    await logSuccess({
      eventType: "Read",
      description: "Retrieved audit ledger entries",
      functionName: "getAuditLedger",
      fileName: "auditLedger.ctrl.ts",
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(200).json(
      STATUS_CODE[200]({
        entries,
        total,
        limit,
        offset,
        hasMore: offset + entries.length < total,
      })
    );
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve audit ledger",
      functionName: "getAuditLedger",
      fileName: "auditLedger.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function verifyAuditLedger(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting verifyAuditLedger",
    functionName: "verifyAuditLedger",
    fileName: "auditLedger.ctrl.ts",
    userId: req.userId!,
    tenantId: req.tenantId!,
  });

  try {
    const tenantId = req.tenantId!;
    const result = await verifyChain(tenantId);

    await logSuccess({
      eventType: "Read",
      description: `Audit ledger verification: ${result.status}`,
      functionName: "verifyAuditLedger",
      fileName: "auditLedger.ctrl.ts",
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to verify audit ledger",
      functionName: "verifyAuditLedger",
      fileName: "auditLedger.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
