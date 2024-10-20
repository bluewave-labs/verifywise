import pool from "../database/db";

export async function checkTableExists(tableName: string) {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = $1
    );
  `;
  const result = await pool.query(query, [tableName]);
  return result.rows[0].exists;
};

export async function createTable(createQuery: string) {
  await pool.query(createQuery);
};

export async function deleteExistingData(tableName: string) {
  const query = `DELETE FROM ${tableName} WHERE 1=1;`;
  await pool.query(query);
};

export async function insertData(insertQuery: string) {
  await pool.query(insertQuery);
};
