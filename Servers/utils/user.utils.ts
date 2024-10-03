import { User } from "../models/User";
import pool from "../database/db";

export const getAllUsersQuery = async (): Promise<User[]> => {
  console.log("getAllUsers");
  const users = await pool.query("SELECT * FROM users");
  return users.rows;
};
