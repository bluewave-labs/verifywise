import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  getAllInventoryQuery,
  getInventoryByIdQuery,
  updateInventoryQuery,
} from "../utils/shadowAi.utils";

export async function getAllInventory(req: Request, res: Response): Promise<any> {
  try {
    const filters = {
      category: req.query.category,
      approval_status: req.query.approval_status,
      risk_classification: req.query.risk_classification,
      search: req.query.search,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
    };

    const result = await getAllInventoryQuery(filters, req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getInventoryById(req: Request, res: Response): Promise<any> {
  try {
    const id = parseInt(req.params.id);
    const item = await getInventoryByIdQuery(id, req.tenantId!);
    if (!item) {
      return res.status(404).json(STATUS_CODE[404]("Inventory item not found"));
    }
    return res.status(200).json(STATUS_CODE[200](item));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateInventory(req: Request, res: Response): Promise<any> {
  try {
    const id = parseInt(req.params.id);
    const result = await updateInventoryQuery(id, req.body, req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
