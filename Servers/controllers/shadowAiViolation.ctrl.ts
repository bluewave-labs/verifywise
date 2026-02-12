import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  getViolationsQuery,
  updateViolationQuery,
  createExceptionQuery,
  updateExceptionQuery,
  getAllExceptionsQuery,
} from "../utils/shadowAi.utils";

export async function getViolations(req: Request, res: Response): Promise<any> {
  try {
    const filters = {
      status: req.query.status,
      severity: req.query.severity,
      policy_id: req.query.policy_id ? parseInt(req.query.policy_id as string) : undefined,
      user_identifier: req.query.user_identifier,
      department: req.query.department,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
    };

    const result = await getViolationsQuery(filters, req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateViolation(req: Request, res: Response): Promise<any> {
  try {
    const id = parseInt(req.params.id);
    const data = { ...req.body };

    // If resolving, add resolver info
    if (data.status === "resolved") {
      data.resolved_by = req.userId;
      data.resolved_at = new Date();
    }

    const result = await updateViolationQuery(id, data, req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// ==================== EXCEPTIONS ====================

export async function getExceptions(req: Request, res: Response): Promise<any> {
  try {
    const filters = {
      status: req.query.status,
      policy_id: req.query.policy_id ? parseInt(req.query.policy_id as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
    };

    const exceptions = await getAllExceptionsQuery(filters, req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](exceptions));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createException(req: Request, res: Response): Promise<any> {
  try {
    const data = req.body;
    if (!data.policy_id || !data.reason) {
      return res.status(400).json(STATUS_CODE[400]("policy_id and reason are required"));
    }
    const exception = await createExceptionQuery(data, req.tenantId!);
    return res.status(201).json(STATUS_CODE[201](exception));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateException(req: Request, res: Response): Promise<any> {
  try {
    const id = parseInt(req.params.id);
    const data = { ...req.body };

    // If approving, add approver info
    if (data.status === "approved") {
      data.approved_by = req.userId;
      data.approved_at = new Date();
    }

    const result = await updateExceptionQuery(id, data, req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
