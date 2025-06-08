import { Request, Response } from "express";
import { deleteMockData, insertMockData } from "../driver/autoDriver.driver";
import { STATUS_CODE } from "../utils/statusCode.utils";

export async function postAutoDriver(req: Request, res: Response) {
  try {
    await insertMockData(req.userId!)
    res.status(201).json(STATUS_CODE[201]("Mock data inserted"))
  } catch(error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteAutoDriver(req: Request, res: Response) {
  try {
    await deleteMockData()
    res.status(200).json(STATUS_CODE[200]("Mock data deleted"))
  } catch(error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
