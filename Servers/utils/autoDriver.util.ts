import pool from "../database/db";

export async function insertData(insertQuery: string) {
  const result = await pool.query(insertQuery);
  return result.rows
};

export async function deleteDEMOData(tablename: string) {
  if (tablename === "vendors") {
    const result = await pool.query(`SELECT id FROM vendors WHERE is_demo;`)
    await Promise.all(result.rows.map(async r => {
      await pool.query(`DELETE FROM vendors_projects WHERE vendor_id = ${r.id}`)
    }))
  }
  await pool.query(`DELETE FROM ${tablename} WHERE is_demo;`)
}
