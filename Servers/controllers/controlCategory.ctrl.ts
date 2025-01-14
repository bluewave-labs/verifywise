import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";

import { STATUS_CODE } from "../utils/statusCode.utils";

import {
  getAllMockControlCategories,
  getMockControlCategoryById,
  createMockControlCategory,
  updateMockControlCategoryById,
  deleteMockControlCategoryById,
} from "../mocks/tools/controlCategory.mock.db";

import {
  getAllControlCategoriesQuery,
  getControlCategoryByIdQuery,
  createControlCategoryQuery,
  updateControlCategoryByIdQuery,
  deleteControlCategoryByIdQuery,
} from "../utils/controlCategory.util";
import { ControlCategory } from "../models/controlCategory.model";

export async function getAllControlCategories(
  req: Request,
  res: Response
): Promise<any> {
  try {
    if (MOCKDATA_ON) {
      const controlCategories = getAllMockControlCategories();
      return res.status(200).json(controlCategories);
    }
    const controlCategories = await getAllControlCategoriesQuery();
    return res.status(200).json(controlCategories);
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getControlCategoryById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controlCategoryId = parseInt(req.params.id);
    if (MOCKDATA_ON) {
      const controlCategory = getMockControlCategoryById(controlCategoryId);
      return res.status(200).json(controlCategory);
    }
    const controlCategory = await getControlCategoryByIdQuery(
      controlCategoryId
    );
    return res.status(200).json(controlCategory);
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createControlCategory(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const newControlCategory: ControlCategory = req.body;
    if (MOCKDATA_ON) {
      const createdControlCategory =
        createMockControlCategory(newControlCategory);
      return res.status(201).json(createdControlCategory);
    }
    const createdControlCategory = await createControlCategoryQuery(
      newControlCategory
    );
    return res.status(201).json(createdControlCategory);
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateControlCategoryById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controlCategoryId = parseInt(req.params.id);
    const updatedControlCategoryData: Partial<ControlCategory> = req.body;
    if (MOCKDATA_ON) {
      const updatedControlCategory = updateMockControlCategoryById(
        controlCategoryId,
        updatedControlCategoryData
      );
      return res.status(202).json(updatedControlCategory);
    }
    const updatedControlCategory = await updateControlCategoryByIdQuery(
      controlCategoryId,
      updatedControlCategoryData
    );
    return res.status(202).json(updatedControlCategory);
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteControlCategoryById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const controlCategoryId = parseInt(req.params.id);
    if (MOCKDATA_ON) {
      const deletedControlCategory =
        deleteMockControlCategoryById(controlCategoryId);
      return res.status(202).json(deletedControlCategory);
    }
    const deletedControlCategory = await deleteControlCategoryByIdQuery(
      controlCategoryId
    );
    return res.status(202).json(deletedControlCategory);
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
