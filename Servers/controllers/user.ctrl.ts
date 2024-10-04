import { Request, Response } from "express";
import {
  createNewUserQuery,
  deleteUserByIdQuery,
  getAllUsersQuery,
  getUserByEmailQuery,
  getUserByIdQuery,
  resetPasswordQuery,
  updateUserByIdQuery,
} from "../utils/user.utils";
import bcrypt from "bcrypt";
import {
  createMockUser,
  deleteMockUserById,
  getAllMockUsers,
  getMockUserByEmail,
  getMockUserById,
} from "../mocks/tools/user.mock.db";

const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

async function getAllUsers(req: Request, res: Response): Promise<any> {
  console.log("getAllUsers");
  try {
    if (MOCK_DATA_ON === "true") {
      // using getAllMockUsers
      const users = getAllMockUsers();

      if (users) {
        return res.status(200).json(users);
      }

      return res.status(400);
    } else {
      const users = await getAllUsersQuery();

      if (users) {
        return res.status(200).json({
          users,
        });
      }

      return res.status(400);
    }
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

async function getUserByEmail(req: Request, res: Response) {
  console.log("getUserByEmail");
  try {
    if (MOCK_DATA_ON === "true") {
      // getMockUserByEmail
      const email = req.params.email;
      const user = getMockUserByEmail(email);
      if (user) {
        return res.status(200).json(user);
      }

      return res.status(400).json({
        error: "User not found",
      });
    } else {
      const email = req.params.email;
      const user = await getUserByEmailQuery(email);

      if (user) {
        return res.status(200).json(user);
      }

      return res.status(400);
    }
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

async function getUserById(req: Request, res: Response) {
  console.log("getUserById");
  try {
    if (MOCK_DATA_ON === "true") {
      // getMockUserById
      const id = parseInt(req.params.id);
      const user = getMockUserById(id);
      if (user) {
        return res.status(200).json(user);
      }

      return res.status(400).json({
        error: "User not found",
      });
    } else {
      const id = req.params.id;
      const user = await getUserByIdQuery(id);

      if (user) {
        return res.status(200).json(user);
      }

      return res.status(400);
    }
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

async function createNewUser(req: Request, res: Response) {
  console.log("createNewUser");
  try {
    if (MOCK_DATA_ON === "true") {
      // createMockUser
      const { name, email, password_hash, role, created_at, last_login } =
        req.body;
      const user = createMockUser({
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
    } else {
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
    }
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

async function loginUser(req: Request, res: Response): Promise<any> {
  console.log("loginUser");
  try {
    if (MOCK_DATA_ON === "true") {
      // getMockUserByEmail
      const { email, password } = req.body;
      const user = getMockUserByEmail(email);

      if (user?.password_hash === password) {
        return res.status(200).json({
          token: "Generated token",
        });
      }

      return res.status(404);
    } else {
      const { email, password } = req.body;
      const user = await getUserByEmailQuery(email);

      if (user) {
        const passwordIsMatched = await bcrypt.compare(
          password,
          user.password_hash
        );

        if (passwordIsMatched) {
          return res.status(200).json({
            token: "Generated token",
          });
        }
      }

      return res.status(400);
    }
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

async function resetPassword(req: Request, res: Response) {
  console.log("resetPassword");
  try {
    const { email, newPassword } = req.body;

    if (MOCK_DATA_ON === "true") {
      // resetMockPassword
      const user = getMockUserByEmail(email);
      if (user) {
        user.password_hash = newPassword;
        return res.status(200).json({
          user,
          message: "Password reset successfully",
        });
      }

      return res.status(400).json({
        error: "User not found",
      });
    } else {
      const user = await getUserByEmailQuery(email);

      if (user) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password_hash = hashedPassword;
        const updatedUser = await resetPasswordQuery(email, hashedPassword);

        return res.status(200).json({
          updatedUser,
          message: "Password reset successfully",
        });
      }

      return res.status(400).json({
        error: "User not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

async function updateUserById(req: Request, res: Response) {
  console.log("updateUserById");
  try {
    const id = req.params.id;
    const { name, email, password_hash, role, last_login } = req.body;

    if (MOCK_DATA_ON === "true") {
      // updateMockUserById
      const user = getMockUserById(parseInt(id));

      if (user) {
        user.name = name || user.name;
        user.email = email || user.email;
        user.password_hash = password_hash || user.password_hash;
        user.role = role || user.role;
        user.last_login = last_login || user.last_login;

        return res.status(200).json({
          user,
          message: "User updated successfully",
        });
      }

      return res.status(400).json({
        error: "User not found",
      });
    } else {
      const user = await getUserByIdQuery(id);

      if (user) {
        const updatedUser = await updateUserByIdQuery(id, {
          name: name || user.name,
          email: email || user.email,
          password_hash: password_hash || user.password_hash,
          role: role || user.role,
          last_login: last_login || user.last_login,
        });

        return res
          .status(200)
          .json({ updatedUser, message: "User updated successfully" });
      }

      return res.status(400).json({
        error: "User not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

async function deleteUserById(req: Request, res: Response) {
  console.log("deleteUserById");
  try {
    if (MOCK_DATA_ON === "true") {
      // deleteMockUserById
      const id = parseInt(req.params.id);
      const user = getMockUserById(id);

      if (user) {
        // Simulate deletion
        const deletedUser = deleteMockUserById(id);
        return res.status(200).json({
          deletedUser,
          message: "User deleted successfully",
        });
      }

      return res.status(400).json({
        error: "User not found",
      });
    } else {
      const id = req.params.id;
      const user = await getUserByIdQuery(id);

      if (user) {
        // Delete user
        const deletedUser = await deleteUserByIdQuery(id);

        return res.status(200).json({
          deletedUser,
          message: "User deleted successfully",
        });
      }

      return res.status(400).json({
        error: "User not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

export {
  getAllUsers,
  getUserByEmail,
  getUserById,
  createNewUser,
  loginUser,
  resetPassword,
  updateUserById,
  deleteUserById,
};
