import { Request, Response } from "express";
import { insertMockData } from "../driver/autoDriver.driver";
import { STATUS_CODE } from "../utils/statusCode.utils";

export async function postAutoDriver(req: Request, res: Response) {
  try {
    insertMockData()
    res.status(201).json(STATUS_CODE[201]("Mock data inserted"))
  } catch(error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
