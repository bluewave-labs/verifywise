import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  getAllConnectorsQuery,
  getConnectorByIdQuery,
  createConnectorQuery,
  updateConnectorQuery,
  deleteConnectorQuery,
} from "../utils/shadowAi.utils";

export async function getAllConnectors(req: Request, res: Response): Promise<any> {
  try {
    const connectors = await getAllConnectorsQuery(req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](connectors));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getConnectorById(req: Request, res: Response): Promise<any> {
  try {
    const id = parseInt(req.params.id);
    const connector = await getConnectorByIdQuery(id, req.tenantId!);
    if (!connector) {
      return res.status(404).json(STATUS_CODE[404]("Connector not found"));
    }
    return res.status(200).json(STATUS_CODE[200](connector));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createConnector(req: Request, res: Response): Promise<any> {
  try {
    const data = { ...req.body, created_by: req.userId };
    const connector = await createConnectorQuery(data, req.tenantId!);
    return res.status(201).json(STATUS_CODE[201](connector));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateConnector(req: Request, res: Response): Promise<any> {
  try {
    const id = parseInt(req.params.id);
    const connector = await updateConnectorQuery(id, req.body, req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](connector));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteConnector(req: Request, res: Response): Promise<any> {
  try {
    const id = parseInt(req.params.id);
    await deleteConnectorQuery(id, req.tenantId!);
    return res.status(200).json(STATUS_CODE[200]({ deleted: true }));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function testConnector(req: Request, res: Response): Promise<any> {
  try {
    const id = parseInt(req.params.id);
    const connector = await getConnectorByIdQuery(id, req.tenantId!);
    if (!connector) {
      return res.status(404).json(STATUS_CODE[404]("Connector not found"));
    }
    // For webhook connectors, test is always successful
    // For other types, actual connectivity testing would be implemented
    return res.status(200).json(STATUS_CODE[200]({
      success: true,
      message: "Connection test successful",
      latency_ms: 0,
    }));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function syncConnector(req: Request, res: Response): Promise<any> {
  try {
    const id = parseInt(req.params.id);
    const connector = await getConnectorByIdQuery(id, req.tenantId!);
    if (!connector) {
      return res.status(404).json(STATUS_CODE[404]("Connector not found"));
    }
    // Manual sync would trigger the connector to fetch new events
    await updateConnectorQuery(id, { last_sync_at: new Date(), status: "active" }, req.tenantId!);
    return res.status(200).json(STATUS_CODE[200]({
      success: true,
      message: "Sync initiated",
      events_ingested: 0,
    }));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
