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
import { STATUS_CODE } from "../utils/statusCode.utils";
import { generateToken } from "../utils/jwt.util";

const MOCK_DATA_ON = process.env.MOCK_DATA_ON;

async function getAllUsers(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const users = getAllMockUsers();

      if (users) {
        return res.status(200).json(STATUS_CODE[200](users));
      }

      return res.status(204).json(STATUS_CODE[204](users));
    } else {
      const users = await getAllUsersQuery();

      if (users) {
        return res.status(200).json(STATUS_CODE[200](users));
      }

      return res.status(204).json(STATUS_CODE[204](users));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function getUserByEmail(req: Request, res: Response) {
  try {
    if (MOCK_DATA_ON === "true") {
      const email = req.params.email;
      const user = getMockUserByEmail(email);
      if (user) {
        return res.status(200).json(STATUS_CODE[200](user));
      }

      return res.status(404).json(STATUS_CODE[404](user));
    } else {
      const email = req.params.email;
      const user = await getUserByEmailQuery(email);

      if (user) {
        return res.status(200).json(STATUS_CODE[200](user));
      }

      return res.status(404).json(STATUS_CODE[404](user));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function getUserById(req: Request, res: Response) {
  try {
    if (MOCK_DATA_ON === "true") {
      const id = parseInt(req.params.id);
      const user = getMockUserById(id);
      if (user) {
        return res.status(200).json(STATUS_CODE[200](user));
      }

      return res.status(404).json(STATUS_CODE[404](user));
    } else {
      const id = req.params.id;
      const user = await getUserByIdQuery(id);

      if (user) {
        return res.status(200).json(STATUS_CODE[200](user));
      }

      return res.status(404).json(STATUS_CODE[404](user));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function createNewUser(req: Request, res: Response) {
  try {
    if (MOCK_DATA_ON === "true") {
      const { name, email, password_hash, role, created_at, last_login } =
        req.body;
      const existingUser = getMockUserByEmail(email);

      if (existingUser) {
        return res.status(409).json(STATUS_CODE[409](existingUser));
      }

      const user = createMockUser({
        name,
        email,
        password_hash,
        role,
        created_at,
        last_login,
      });

      if (user) {
        return res.status(201).json(STATUS_CODE[201](user));
      }

      return res.status(400).json(STATUS_CODE[400](user));
    } else {
      const { name, email, password, role, created_at, last_login } =
        req.body;
        const existingUser = await getUserByEmailQuery(email);

        if (existingUser) {
          return res.status(409).json(STATUS_CODE[409](existingUser));
        }

      const password_hash = await bcrypt.hash(password, 10);
      const user = await createNewUserQuery({
        name,
        email,
        password_hash,
        role,
        created_at,
        last_login,
      });

      if (user) {
        return res.status(201).json(STATUS_CODE[201](user));
      }

      return res.status(400).json(STATUS_CODE[400](user));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function loginUser(req: Request, res: Response): Promise<any> {
  try {
    if (MOCK_DATA_ON === "true") {
      const { email, password } = req.body;
      const user = getMockUserByEmail(email);

      if (user?.password_hash === password) {
        const token = generateToken({
          id: user!.id,
          email: email
        })
        return res.status(202).json(
          STATUS_CODE[202]({
            token
          })
        );
      }

      return res.status(406).json(STATUS_CODE[406]({}));
    } else {
      const { email, password } = req.body;
      const user = await getUserByEmailQuery(email);

      if (user) {
        const passwordIsMatched = await bcrypt.compare(
          password,
          user.password_hash
        );

        if (passwordIsMatched) {
          const token = generateToken({
            id: user!.id,
            email: email
          })
          return res.status(202).json(
            STATUS_CODE[202]({
              token,
            })
          );
        }
      }

      return res.status(406).json(STATUS_CODE[406]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function resetPassword(req: Request, res: Response) {
  try {
    const { email, newPassword } = req.body;

    if (MOCK_DATA_ON === "true") {
      const user = getMockUserByEmail(email);
      if (user) {
        user.password_hash = newPassword;
        return res.status(202).json(STATUS_CODE[202](user));
      }

      return res.status(404).json(STATUS_CODE[404](user));
    } else {
      const user = await getUserByEmailQuery(email);

      if (user) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password_hash = hashedPassword;
        const updatedUser = await resetPasswordQuery(email, hashedPassword);

        return res.status(202).json(STATUS_CODE[202](updatedUser));
      }

      return res.status(404).json(STATUS_CODE[404](user));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function updateUserById(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const { name, email, password_hash, role, last_login } = req.body;

    if (MOCK_DATA_ON === "true") {
      const user = getMockUserById(parseInt(id));

      if (user) {
        user.name = name || user.name;
        user.email = email || user.email;
        user.password_hash = password_hash || user.password_hash;
        user.role = role || user.role;
        user.last_login = last_login || user.last_login;

        return res.status(202).json(STATUS_CODE[202](user));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
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

        return res.status(202).json(STATUS_CODE[202](updatedUser));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function deleteUserById(req: Request, res: Response) {
  try {
    if (MOCK_DATA_ON === "true") {
      const id = parseInt(req.params.id);
      const user = getMockUserById(id);

      if (user) {
        const deletedUser = deleteMockUserById(id);
        return res.status(202).json(STATUS_CODE[202](deletedUser));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } else {
      const id = req.params.id;
      const user = await getUserByIdQuery(id);

      if (user) {
        const deletedUser = await deleteUserByIdQuery(id);

        return res.status(202).json(STATUS_CODE[202](deletedUser));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
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
