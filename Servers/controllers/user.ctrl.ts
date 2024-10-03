import { Request, Response } from "express";
import {
  createNewUserQuery,
  getAllUsersQuery,
  getUserByEmailQuery,
  getUserByIdQuery,
} from "../utils/user.utils";

async function getAllUsers(req: Request, res: Response): Promise<any> {
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

async function getUserByEmail(req: Request, res: Response) {
  console.log("getUserByEmail");
  try {
    const email = req.params.email;
    const user = await getUserByEmailQuery(email);

    if (user) {
      return res.status(200).json(user);
    }

    return res.status(400);
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

async function getUserById(req: Request, res: Response) {
  console.log("getUserById");
  try {
    const id = req.params.id;
    const user = await getUserByIdQuery(id);

    if (user) {
      return res.status(200).json(user);
    }

    return res.status(400);
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

async function createNewUser(req: Request, res: Response) {
  console.log("createNewUser");
  try {
    const { name, email, password_hash, role, created_at, last_login } =
      req.body;
    const user = await createNewUserQuery({
      name,
      email,
      password_hash,
      role,
      created_at,
      last_login,
    });

    if (user) {
      return res.status(201).json(user);
    }

    return res.status(400);
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

export { getAllUsers, getUserByEmail, getUserById, createNewUser };
