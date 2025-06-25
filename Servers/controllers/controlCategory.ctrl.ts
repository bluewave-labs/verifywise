import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";

import {
  getAllControlCategoriesQuery,
  getControlCategoryByIdQuery,
  createControlCategoryQuery,
  updateControlCategoryByIdQuery,
  deleteControlCategoryByIdQuery,
  getControlCategoryByProjectIdQuery,
} from "../utils/controlCategory.utils";
import { ControlCategory } from "../domain.layer/models/controlCategory/controlCategory.model";
import { sequelize } from "../database/db";

export async function getAllControlCategories(
  req: Request,
  res: Response
): Promise<any> {
  try {
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
    const controlCategory = await getControlCategoryByIdQuery(
      controlCategoryId
    );
    return res.status(200).json(controlCategory);
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getControlCategoryByProjectId(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectId = parseInt(req.params.id);
    const controlCategories = await getControlCategoryByProjectIdQuery(
      projectId
    );
    return res.status(200).json(controlCategories);
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createControlCategory(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const newControlCategory: ControlCategory = req.body;
    const createdControlCategory = await createControlCategoryQuery(
      newControlCategory,
      transaction
    );
    await transaction.commit();
    return res.status(201).json(createdControlCategory);
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateControlCategoryById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const controlCategoryId = parseInt(req.params.id);
    const updatedControlCategoryData: Partial<ControlCategory> = req.body;
    const updatedControlCategory = await updateControlCategoryByIdQuery(
      controlCategoryId,
      updatedControlCategoryData,
      transaction
    );
    await transaction.commit();
    return res.status(202).json(updatedControlCategory);
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteControlCategoryById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const controlCategoryId = parseInt(req.params.id);
    const deletedControlCategory = await deleteControlCategoryByIdQuery(
      controlCategoryId,
      transaction
    );
    await transaction.commit();
    return res.status(202).json(deletedControlCategory);
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
