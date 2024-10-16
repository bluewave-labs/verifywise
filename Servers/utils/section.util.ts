import { Section } from "../models/Section";
import pool from "../database/db";

export const getAllSectionsQuery = async (): Promise<Section[]> => {
  console.log("getAllSections");
  const sections = await pool.query("SELECT * FROM sections");
  return sections.rows;
};

export const getSectionByIdQuery = async (id: number): Promise<Section | null> => {
  console.log("getSectionById", id);
  const result = await pool.query("SELECT * FROM sections WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewSectionQuery = async (section: {
  name: string;
  description: string;
}): Promise<Section> => {
  console.log("createNewSection", section);
  const result = await pool.query(
    "INSERT INTO sections (name, description) VALUES ($1, $2) RETURNING *",
    [section.name, section.description]
  );
  return result.rows[0];
};

export const updateSectionByIdQuery = async (
  id: number,
  section: { name?: string; description?: string }
): Promise<Section | null> => {
  console.log("updateSectionById", id, section);
  const fields = [];
  const values = [];
  let query = "UPDATE sections SET ";

  if (section.name) {
    fields.push("name = $1");
    values.push(section.name);
  }
  if (section.description) {
    fields.push("description = $2");
    values.push(section.description);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $3 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteSectionByIdQuery = async (id: number): Promise<boolean> => {
  console.log("deleteSectionById", id);
  const result = await pool.query(
    "DELETE FROM sections WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
