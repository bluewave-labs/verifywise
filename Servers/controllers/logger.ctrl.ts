import { Request, Response } from "express";
import { getEventsQuery, getLogsQuery } from "../utils/logger.util";
import { STATUS_CODE } from "../utils/statusCode.utils";

async function getEvents(req: Request, res: Response) {
  try {
    const events = await getEventsQuery();
    res.status(200).json(STATUS_CODE[200](events));
  } catch (error) {
    res.status(500).json({ message: "Failed to get events" });
  }
}

async function getLogs(req: Request, res: Response) {
  try {
    const logs = await getLogsQuery();
    res.status(200).json(STATUS_CODE[200](logs));
  } catch (error) {
    res.status(500).json({ message: "Failed to get logs" });
  }
}

export { getEvents, getLogs };
