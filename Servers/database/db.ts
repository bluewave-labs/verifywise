import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  port: Number(process.env.DB_PORT) || 5432,
  password: process.env.DB_PASSWORD || "1377",
  database: process.env.DB_NAME || "verifywise",
});

export default pool;
