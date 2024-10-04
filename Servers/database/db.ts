/**
 * @file db.ts
 * @description This file sets up a connection pool to a PostgreSQL database using the `pg` library and environment variables.
 *
 * @module database
 *
 * @requires pg
 * @requires dotenv
 *
 * @example
 * // Import the pool instance to use in your queries
 * import pool from './db';
 *
 * pool.query('SELECT * FROM users', (err, res) => {
 *   if (err) {
 *     console.error('Error executing query', err.stack);
 *   } else {
 *     console.log('Query result', res.rows);
 *   }
 * });
 *
 * @see {@link https://node-postgres.com/} for more information about the `pg` library.
 * @see {@link https://www.npmjs.com/package/dotenv} for more information about the `dotenv` library.
 */

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
