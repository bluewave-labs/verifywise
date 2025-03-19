import { sequelize } from "../database/db";
import { VendorModel } from "../models/vendor.model";

export async function insertData(insertQuery: string) {
  const result = await sequelize.query(insertQuery);
  return result
};

export async function deleteDEMOData(tablename: string) {
  if (tablename === "vendors") {
    const result = await sequelize.query(
      `SELECT id FROM vendors WHERE is_demo;`,
      {
        mapToModel: true,
        model: VendorModel
      }
    )
    await Promise.all(result.map(async r => {
      await sequelize.query(`DELETE FROM vendors_projects WHERE vendor_id = :vendor_id`,
        {
          replacements: { vendor_id: r.id }
        }
      )
    }))
  }
  await sequelize.query(`DELETE FROM ${tablename} WHERE is_demo;`)
}
