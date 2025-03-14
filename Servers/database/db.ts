import { Pool } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Sequelize } from "sequelize-typescript";

dotenv.config();

// const pool = new Pool({
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER || "postgres",
//   port: Number(process.env.DB_PORT) || 5432,
//   password: process.env.DB_PASSWORD || "1377",
//   database: process.env.DB_NAME || "verifywise",
// });

// /**
//  * Function to check if tables exist and create them if necessary.
//  */
// export const checkAndCreateTables = async () => {
//   try {
//     const client = await pool.connect();
//     console.log("Checking if tables exist...");

//     // Modify this list with your actual table names
//     const tableNames = [
//       "roles",
//       "users",
//       "projects",
//       "vendors",
//       "assessments",
//       "controlcategories",
//       "controls",
//       "subcontrols",
//       "projectrisks",
//       "vendorrisks",
//       "vendors_projects",
//       "projectscopes",
//       "topics",
//       "subtopics",
//       "questions",
//       "files",
//     ];

//     const query = `
//       SELECT tablename FROM pg_catalog.pg_tables 
//       WHERE schemaname = 'public' AND tablename = ANY($1);
//     `;

//     const result = await client.query(query, [tableNames]);

//     if (result.rows.length < tableNames.length) {
//       console.log("Some tables are missing. Creating tables...");
//       const sqlFilePath = path.join(__dirname, "./SQL_Commands.sql");

//       if (fs.existsSync(sqlFilePath)) {
//         const sql = fs.readFileSync(sqlFilePath, "utf8");
//         await client.query(sql);
//         console.log("Tables created successfully.");
//       } else {
//         console.error(`SQL file not found at path: ${sqlFilePath}`);
//       }
//     } else {
//       console.log("All tables exist. Skipping creation.");
//     }

//     client.release();
//   } catch (error) {
//     console.error("Error checking or creating tables:", error);
//   }
// };

// export default pool;

const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "1377",
  database: process.env.DB_NAME || "verifywise",
  models: [],
});

export { sequelize };
