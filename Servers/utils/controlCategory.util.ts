import { ControlCategory } from "../models/controlCategory.model";
import pool from "../database/db";

export const getAllControlCategoriesQuery = async (): Promise<
  ControlCategory[]
> => {
  const controlCategories = await pool.query(
    "SELECT * FROM controlcategories"
  );
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

export const createControlCategoryQuery = async (
  controlCategory: ControlCategory
): Promise<ControlCategory> => {
  const result = await pool.query(
    "INSERT INTO controlcategories (project_id, name) VALUES ($1, $2) RETURNING *",
    [controlCategory.projectId, controlCategory.name]
  );
  return result.rows[0];
};

export const updateControlCategoryByIdQuery = async (
  id: number,
  controlCategory: Partial<ControlCategory>
): Promise<ControlCategory | null> => {
  const result = await pool.query(
    "UPDATE controlcategories SET $1 WHERE id = $2 RETURNING *",
    [controlCategory, id]
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
