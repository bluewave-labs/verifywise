import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { VendorModel } from "../domain.layer/models/vendor/vendor.model";

export async function getData(tableName: string, transaction: Transaction) {
  const result = await sequelize.query(
    `SELECT * FROM ${tableName} WHERE is_demo;`,
    { transaction }
  );
  return result[0];
}

export async function insertData(
  insertQuery: string,
  transaction: Transaction
) {
  const result = await sequelize.query(insertQuery, { transaction });
  return result;
}

export async function deleteDemoVendorsData(transaction: Transaction) {
  const result = await sequelize.query(
    `SELECT id FROM vendors WHERE is_demo;`,
    {
      mapToModel: true,
      model: VendorModel,
      transaction,
    }
  );
  // this might not be needed, but keeping just in case
  await Promise.all(
    result.map(async (r) => {
      await sequelize.query(
        `DELETE FROM vendors_projects WHERE vendor_id = :vendor_id`,
        {
          replacements: { vendor_id: r.id },
          transaction,
        }
      );
    })
  );
  await Promise.all(
    result.map(async (r) => {
      await sequelize.query(
        `DELETE FROM vendorrisks WHERE vendor_id = :vendor_id`,
        {
          replacements: { vendor_id: r.id },
          transaction,
        }
      );
    })
  );
  await sequelize.query(`DELETE FROM vendors WHERE is_demo;`, { transaction });
}
