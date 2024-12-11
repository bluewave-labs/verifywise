import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";

import { STATUS_CODE } from "../utils/statusCode.utils";

export async function getAllControlCategories(
  req: Request,
  res: Response
): Promise<any> {}

export async function getControlCategoryById(
  req: Request,
  res: Response
): Promise<any> {}

export async function createControlCategory(
  req: Request,
  res: Response
): Promise<any> {}

export async function updateControlCategoryById(
  req: Request,
  res: Response
): Promise<any> {}

export async function deleteControlCategoryById(
  req: Request,
  res: Response
): Promise<any> {}
