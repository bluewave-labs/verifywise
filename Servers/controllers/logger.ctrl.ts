import { Request, Response } from "express";

async function getEvents(req: Request, res: Response) {
  try {
  } catch (error) {
    res.status(500).json({ message: "Failed to get events" });
  }
}

async function getLogs(req: Request, res: Response) {
  try {
  } catch (error) {
    res.status(500).json({ message: "Failed to get logs" });
  }
}

export { getEvents, getLogs };
