import { ControlCategory } from "../models/controlCategory.model";
import pool from "../database/db";
import { createNewControlsQuery } from "./control.utils";
import { ControlCategories } from "../structures/compliance-tracker/controlCategories.struct"

export const getAllControlCategoriesQuery = async (): Promise<
  ControlCategory[]
> => {
  const controlCategories = await pool.query("SELECT * FROM controlcategories");
  return controlCategories.rows;
};

export const getControlCategoryByIdQuery = async (
  id: number
): Promise<ControlCategory | null> => {
  const result = await pool.query(
    "SELECT * FROM controlcategories WHERE id = $1",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const getControlCategoryByTitleAndProjectIdQuery = async (
  title: string,
  projectId: number
): Promise<ControlCategory | null> => {
  const result = await pool.query(
    "SELECT * FROM controlcategories WHERE title = $1 AND project_id = $2",
    [title, projectId]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const getControlCategoryByProjectIdQuery = async (
  projectId: number
): Promise<ControlCategory[]> => {
  const result = await pool.query(
    "SELECT * FROM controlcategories WHERE project_id = $1",
    [projectId]
  );
  return result.rows;
};

export const createControlCategoryQuery = async (
  controlCategory: ControlCategory
): Promise<ControlCategory> => {
  const result = await pool.query(
    "INSERT INTO controlcategories (project_id, title, order_no) VALUES ($1, $2, $3) RETURNING *",
    [controlCategory.project_id, controlCategory.title, controlCategory.order_no]
  );
  return result.rows[0];
};

export const updateControlCategoryByIdQuery = async (
  id: number,
  controlCategory: Partial<ControlCategory>
): Promise<ControlCategory | null> => {
  const result = await pool.query(
    "UPDATE controlcategories SET title = $1 WHERE id = $2 RETURNING *",
    [controlCategory.title, id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteControlCategoryByIdQuery = async (
  id: number
): Promise<ControlCategory | null> => {
  const result = await pool.query(
    "DELETE FROM controlcategories WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const createNewControlCategories = async (projectId: number) => {
  const createdControlCategories = []
  let query = "INSERT INTO controlcategories(project_id, title, order_no) VALUES ($1, $2, $3) RETURNING *;";
  for (let controlCategoryStruct of ControlCategories) {
    const result = await pool.query(query, [projectId, controlCategoryStruct.title, controlCategoryStruct.order_no])
    const control_category_id = result.rows[0].id
    const controls = await createNewControlsQuery(control_category_id, controlCategoryStruct.controls)
    createdControlCategories.push({ ...result.rows[0], controls })
  }
  return createdControlCategories;
};
