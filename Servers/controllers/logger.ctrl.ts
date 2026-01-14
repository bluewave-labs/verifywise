import { Request, Response } from "express";
import { getEventsQuery, getLogsQuery } from "../utils/logger.util";
import { STATUS_CODE } from "../utils/statusCode.utils";

async function getEvents(req: Request, res: Response): Promise<any> {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
    }
    const events = await getEventsQuery(tenantId);
    return res.status(200).json(STATUS_CODE[200](events));
  } catch (error) {
    return res.status(500).json({ message: "Failed to get events" });
  }
}

async function getLogs(req: Request, res: Response): Promise<any> {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
    }
    const logs = await getLogsQuery(tenantId);
    return res.status(200).json(STATUS_CODE[200](logs));
  } catch (error) {
    return res.status(500).json({ message: "Failed to get logs" });
  }
}

export { getEvents, getLogs };
