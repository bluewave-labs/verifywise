import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  getAllPoliciesQuery,
  getPolicyByIdQuery,
  createPolicyQuery,
  updatePolicyQuery,
  deletePolicyQuery,
} from "../utils/shadowAi.utils";

export async function getAllPolicies(req: Request, res: Response): Promise<any> {
  try {
    const policies = await getAllPoliciesQuery(req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](policies));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getPolicyById(req: Request, res: Response): Promise<any> {
  try {
    const id = parseInt(req.params.id);
    const policy = await getPolicyByIdQuery(id, req.tenantId!);
    if (!policy) {
      return res.status(404).json(STATUS_CODE[404]("Policy not found"));
    }
    return res.status(200).json(STATUS_CODE[200](policy));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createPolicy(req: Request, res: Response): Promise<any> {
  try {
    const data = { ...req.body, created_by: req.userId };
    if (!data.name || !data.rules) {
      return res.status(400).json(STATUS_CODE[400]("name and rules are required"));
    }
    const policy = await createPolicyQuery(data, req.tenantId!);
    return res.status(201).json(STATUS_CODE[201](policy));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updatePolicy(req: Request, res: Response): Promise<any> {
  try {
    const id = parseInt(req.params.id);
    const policy = await updatePolicyQuery(id, req.body, req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](policy));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deletePolicy(req: Request, res: Response): Promise<any> {
  try {
    const id = parseInt(req.params.id);
    await deletePolicyQuery(id, req.tenantId!);
    return res.status(200).json(STATUS_CODE[200]({ deleted: true }));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
