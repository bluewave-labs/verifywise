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

export async function deleteExistingData(tableName: string, key: string) {
  await pool.query(`DELETE FROM ${tableName} WHERE ${key} LIKE 'DEMO - %';`);
  // await pool.query(`ALTER SEQUENCE ${tableName}_id_seq RESTART WITH 1;`);
};

export async function insertData(insertQuery: string) {
  const result = await pool.query(insertQuery);
  return result.rows
};

export async function dropTable(tableName: string) {
  await pool.query(`DROP TABLE ${tableName};`);
}

export async function checkDataExists(tableName: string) {
  const result = await pool.query(`SELECT * from ${tableName} LIMIT 2;`)
  return result.rows.length
}

export async function getDEMOProjects() {
  const result = await pool.query(`SELECT id FROM projects WHERE project_title LIKE 'DEMO - %';`)
  return result.rows
}
