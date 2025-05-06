import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import { getAllFrameworkByIdQuery, getAllFrameworksQuery } from "../utils/framework.utils";

export async function getAllFrameworks(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const frameworks = await getAllFrameworksQuery();

    if (frameworks) {
      return res.status(200).json(STATUS_CODE[200](frameworks));
    }

    return res.status(204).json(STATUS_CODE[204](frameworks));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getFrameworkById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const frameworkId = parseInt(req.params.id);

    const framework = await getAllFrameworkByIdQuery(frameworkId);

    if (framework) {
      return res.status(200).json(STATUS_CODE[200](framework));
    }

    return res.status(404).json(STATUS_CODE[404](framework));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
