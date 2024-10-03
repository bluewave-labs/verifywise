import { Request, Response } from "express";
import { getAllUsersQuery } from "../utils/user.utils";

interface GetAllUsersRequest extends Request {}
interface GetAllUsersResponse extends Response {}

async function getAllUsers(
  req: GetAllUsersRequest,
  res: GetAllUsersResponse
): Promise<any> {
  console.log("getAllUsers");
  try {
    const users = await getAllUsersQuery();

    if (users) {
      return res.status(200).json({
        users,
      });
    }

    return res.status(400);
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

export { getAllUsers };
