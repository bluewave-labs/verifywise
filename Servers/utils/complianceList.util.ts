import { ComplianceList } from "../models/ComplianceList";
import pool from "../database/db";

export const getAllComplianceListsQuery = async (): Promise<ComplianceList[]> => {
  console.log("getAllComplianceLists");
  const complianceLists = await pool.query("SELECT * FROM complianceLists");
  return complianceLists.rows;
};

export const getComplianceListByIdQuery = async (id: number): Promise<ComplianceList | null> => {
  console.log("getComplianceListById", id);
  const result = await pool.query("SELECT * FROM complianceLists WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewComplianceListQuery = async (complianceList: {
  name: string;
  description: string;
}): Promise<ComplianceList> => {
  console.log("createNewComplianceList", complianceList);
  const result = await pool.query(
    "INSERT INTO complianceLists (name, description) VALUES ($1, $2) RETURNING *",
    [complianceList.name, complianceList.description]
  );
  return result.rows[0];
};

export const updateComplianceListByIdQuery = async (
  id: number,
  complianceList: { name?: string; description?: string }
): Promise<ComplianceList | null> => {
  console.log("updateComplianceListById", id, complianceList);
  const fields = [];
  const values = [];
  let query = "UPDATE complianceLists SET ";

  if (complianceList.name) {
    fields.push("name = $1");
    values.push(complianceList.name);
  }
  if (complianceList.description) {
    fields.push("description = $2");
    values.push(complianceList.description);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $3 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteComplianceListByIdQuery = async (id: number): Promise<boolean> => {
  console.log("deleteComplianceListById", id);
  const result = await pool.query(
    "DELETE FROM complianceLists WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
