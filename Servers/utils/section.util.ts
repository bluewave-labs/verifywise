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
  assessment_tracker_id: number
  name: string
  total_questions: number
  completed_questions: number
}): Promise<Section> => {
  console.log("createNewSection", section);
  const result = await pool.query(
    "INSERT INTO sections (assessment_tracker_id, name, total_questions, completed_questions) VALUES ($1, $2, $3, $4) RETURNING *",
    [section.assessment_tracker_id, section.name, section.total_questions, section.completed_questions]
  );
  return result.rows[0];
};

export const updateSectionByIdQuery = async (
  id: number,
  section: {
    assessment_tracker_id?: number
    name?: string
    total_questions?: number
    completed_questions?: number
  }
): Promise<Section | null> => {
  console.log("updateSectionById", id, section);
  const fields = [];
  const values = [];
  let query = "UPDATE sections SET ";

  if(section.assessment_tracker_id) {
    fields.push("assessment_tracker_id = $1")
    values.push(section.assessment_tracker_id)
  }
  if(section.name) {
    fields.push("name = $2")
    values.push(section.name)
  }
  if(section.total_questions) {
    fields.push("total_questions = $3")
    values.push(section.total_questions)
  }
  if(section.completed_questions) {
    fields.push("completed_questions = $4")
    values.push(section.completed_questions)
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $5 RETURNING *";
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
