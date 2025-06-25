import { Request, Response } from "express";
import {
  checkUserExistsQuery,
  createNewUserQuery,
  deleteUserByIdQuery,
  getAllUsersQuery,
  getAssessmentsForProject,
  getControlCategoriesForProject,
  getControlForControlCategory,
  getQuestionsForSubTopic,
  getSubControlForControl,
  getSubTopicsForTopic,
  getTopicsForAssessment,
  getUserByEmailQuery,
  getUserByIdQuery,
  getUserProjects,
  resetPasswordQuery,
  updateUserByIdQuery,
} from "../utils/user.utils";
import bcrypt from "bcrypt";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  generateRefreshToken,
  generateToken,
  getRefreshTokenPayload,
} from "../utils/jwt.utils";
import { UserModel } from "../domain.layer/models/user/user.model";
import { sequelize } from "../database/db";
import {
  ValidationException,
  BusinessLogicException,
} from "../domain.layer/exceptions/custom.exception";

async function getAllUsers(req: Request, res: Response): Promise<any> {
  try {
    const users = (await getAllUsersQuery()) as UserModel[];

    if (users && users.length > 0) {
      return res
        .status(200)
        .json(STATUS_CODE[200](users.map((user) => user.toSafeJSON())));
    }

    return res.status(204).json(STATUS_CODE[204](users));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function getUserByEmail(req: Request, res: Response) {
  try {
    const email = req.params.email;
    const user = (await getUserByEmailQuery(email)) as UserModel & {
      role_name: string;
    };

    if (user) {
      return res.status(200).json(STATUS_CODE[200](user.toSafeJSON()));
    }

    return res.status(404).json(STATUS_CODE[404](user));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function getUserById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const user = (await getUserByIdQuery(id)) as UserModel;

    if (user) {
      return res.status(200).json(STATUS_CODE[200](user.toSafeJSON()));
    }

    return res.status(404).json(STATUS_CODE[404](user));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function createNewUser(req: Request, res: Response) {
  const transaction = await sequelize.transaction();
  try {
    const { name, surname, email, password, roleId } = req.body;

    // Check if user already exists
    const existingUser = await getUserByEmailQuery(email);
    if (existingUser) {
      await transaction.rollback();
      return res
        .status(409)
        .json(STATUS_CODE[409]("User with this email already exists"));
    }

    // Create user using the enhanced UserModel method
    const userModel = await UserModel.createNewUser(
      name,
      surname,
      email,
      password,
      roleId
    );

    // Validate user data before saving
    await userModel.validateUserData();

    // Check email uniqueness
    const isEmailUnique = await UserModel.validateEmailUniqueness(email);
    if (!isEmailUnique) {
      await transaction.rollback();
      return res.status(409).json(STATUS_CODE[409]("Email already exists"));
    }

    const user = (await createNewUserQuery(
      userModel,
      transaction
    )) as UserModel;

    if (user) {
      await transaction.commit();
      return res.status(201).json(STATUS_CODE[201](user.toSafeJSON()));
    }

    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400]("Failed to create user"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function loginUser(req: Request, res: Response): Promise<any> {
  try {
    const { email, password } = req.body;

    const userData = await getUserByEmailQuery(email);

    if (userData) {
      // Ensure we have a proper UserModel instance
      let user: UserModel;
      if (userData instanceof UserModel) {
        user = userData;
      } else {
        // Create a new UserModel instance from the data
        user = new UserModel();
        Object.assign(user, userData);
      }

      // Try password comparison with fallback
      let passwordIsMatched = false;
      try {
        // First try the UserModel method
        passwordIsMatched = await user.comparePassword(password);
      } catch (modelError) {
        // Fallback to direct bcrypt comparison
        passwordIsMatched = await bcrypt.compare(
          password,
          userData.password_hash
        );
      }

      if (passwordIsMatched) {
        // Update last login timestamp
        user.updateLastLogin();

        const token = generateToken({
          id: user.id,
          email: email,
          roleName: (userData as any).role_name,
        });

        const refreshToken = generateRefreshToken({
          id: user.id,
          email: email,
          roleName: (userData as any).role_name,
        });

        res.cookie("refresh_token", refreshToken, {
          httpOnly: true,
          path: "/api/users",
          expires: new Date(Date.now() + 1 * 3600 * 1000 * 24 * 30), // 30 days
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });

        return res.status(202).json(
          STATUS_CODE[202]({
            token,
          })
        );
      } else {
        return res.status(403).json(STATUS_CODE[403]("Password mismatch"));
      }
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function refreshAccessToken(req: Request, res: Response): Promise<any> {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res
        .status(400)
        .json(STATUS_CODE[400]("Refresh token is required"));
    }

    const decoded = getRefreshTokenPayload(refreshToken);

    if (!decoded) {
      return res.status(401).json(STATUS_CODE[401]("Invalid refresh token"));
    }

    if (decoded.expire < Date.now())
      return res
        .status(406)
        .json(STATUS_CODE[406]({ message: "Token expired" }));

    const newAccessToken = generateToken({
      id: decoded.id,
      email: decoded.email,
      roleName: decoded.roleName,
    });

    return res.status(200).json(
      STATUS_CODE[200]({
        token: newAccessToken,
      })
    );
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function resetPassword(req: Request, res: Response) {
  const transaction = await sequelize.transaction();
  try {
    const { email, newPassword } = req.body;

    const user = (await getUserByEmailQuery(email)) as UserModel & {
      role_name: string;
    };

    if (user) {
      // Use the enhanced UserModel method for password update
      await user.updatePassword(newPassword);

      const updatedUser = (await resetPasswordQuery(
        email,
        user.password_hash,
        transaction
      )) as UserModel;

      await transaction.commit();
      return res.status(202).json(STATUS_CODE[202](updatedUser.toSafeJSON()));
    }

    await transaction.rollback();
    return res.status(404).json(STATUS_CODE[404]("User not found"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function updateUserById(req: Request, res: Response) {
  const transaction = await sequelize.transaction();
  try {
    const id = parseInt(req.params.id);
    const { name, surname, email, roleId, last_login } = req.body;

    const user = await getUserByIdQuery(id);

    if (user) {
      // Use the enhanced UserModel method for profile updates
      await user.updateCurrentUser({
        name,
        surname,
        email,
      });

      // Validate user data before saving
      await user.validateUserData();

      const updatedUser = (await updateUserByIdQuery(
        id,
        {
          name: user.name,
          surname: user.surname,
          email: user.email,
          role_id: roleId ?? user.role_id,
          last_login: last_login ?? user.last_login,
        },
        transaction
      )) as UserModel;

      await transaction.commit();
      return res.status(202).json(STATUS_CODE[202](updatedUser.toSafeJSON()));
    }

    await transaction.rollback();
    return res.status(404).json(STATUS_CODE[404]("User not found"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function deleteUserById(req: Request, res: Response) {
  const transaction = await sequelize.transaction();
  try {
    const id = parseInt(req.params.id);
    const user = await getUserByIdQuery(id);

    if (user) {
      // Check if user can be deleted (demo users, etc.)
      if (user.isDemoUser()) {
        await transaction.rollback();
        return res
          .status(403)
          .json(STATUS_CODE[403]("Demo users cannot be deleted"));
      }

      const deletedUser = await deleteUserByIdQuery(id, transaction);
      await transaction.commit();

      return res.status(202).json(STATUS_CODE[202](deletedUser));
    }

    await transaction.rollback();
    return res.status(404).json(STATUS_CODE[404]("User not found"));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Checks if any user exists in the database.
 *
 * @param {Request} _req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<Response>} A promise that resolves when the response is sent.
 */
async function checkUserExists(
  _req: Request,
  res: Response
): Promise<Response> {
  try {
    const userExists = await checkUserExistsQuery();
    return res.status(200).json(userExists);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function calculateProgress(
  req: Request,
  res: Response
): Promise<Response> {
  const id = parseInt(req.params.id);
  try {
    const userProjects = await getUserProjects(id);

    let assessmentsMetadata = [];
    let allTotalAssessments = 0;
    let allDoneAssessments = 0;

    let controlsMetadata = [];
    let allTotalSubControls = 0;
    let allDoneSubControls = 0;

    for (const userProject of userProjects) {
      let totalSubControls = 0;
      let doneSubControls = 0;
      const controlcategories = await getControlCategoriesForProject(
        userProject.id!
      );
      for (const controlcategory of controlcategories) {
        const controls = await getControlForControlCategory(
          controlcategory.id!
        );
        for (const control of controls) {
          const subControls = await getSubControlForControl(control.id!);
          for (const subControl of subControls) {
            totalSubControls++;
            if (subControl.status === "Done") {
              doneSubControls++;
            }
          }
        }
      }
      allTotalSubControls += totalSubControls;
      allDoneSubControls += doneSubControls;
      controlsMetadata.push({
        projectId: userProject.id,
        totalSubControls,
        doneSubControls,
      });

      let totalAssessments = 0;
      let doneAssessments = 0;
      const assessments = await getAssessmentsForProject(userProject.id!);
      for (const assessment of assessments) {
        const topics = await getTopicsForAssessment(assessment.id!);
        for (const topic of topics) {
          const subTopics = await getSubTopicsForTopic(topic.id!);
          for (const subTopic of subTopics) {
            const questions = await getQuestionsForSubTopic(subTopic.id!);
            for (const question of questions) {
              totalAssessments++;
              if (question.answer) {
                doneAssessments++;
              }
            }
          }
        }
      }
      allTotalAssessments += totalAssessments;
      allDoneAssessments += doneAssessments;
      assessmentsMetadata.push({
        projectId: userProject.id,
        totalAssessments,
        doneAssessments,
      });
    }

    return res.status(200).json({
      assessmentsMetadata,
      controlsMetadata,
      allTotalAssessments,
      allDoneAssessments,
      allTotalSubControls,
      allDoneSubControls,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function ChangePassword(req: Request, res: Response) {
  const transaction = await sequelize.transaction();
  try {
    const { id, currentPassword, newPassword } = req.body;

    // Fetch the user by ID
    const user = await getUserByIdQuery(id);

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // Use the enhanced UserModel method for password update with current password verification
    await user.updatePassword(newPassword, currentPassword);

    // Update the user in the database
    const updatedUser = (await resetPasswordQuery(
      user.email,
      user.password_hash,
      transaction
    )) as UserModel;

    await transaction.commit();
    return res.status(202).json({
      message: "Password updated successfully",
      data: updatedUser.toSafeJSON(),
    });
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      return res.status(400).json({ message: error.message });
    }

    if (error instanceof BusinessLogicException) {
      return res.status(403).json({ message: error.message });
    }

    return res.status(500).json({ message: (error as Error).message });
  }
}

// New function to update user role
async function updateUserRole(req: Request, res: Response) {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { newRoleId } = req.body;
    const currentUserId = (req as any).user?.id; // From JWT token

    // Fetch the target user
    const targetUser = await getUserByIdQuery(parseInt(id));
    if (!targetUser) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch the current user (admin performing the action)
    const currentUser = await getUserByIdQuery(currentUserId);
    if (!currentUser) {
      await transaction.rollback();
      return res.status(404).json({ message: "Current user not found" });
    }

    // Use the enhanced UserModel method for role update
    await targetUser.updateRole(newRoleId, currentUser);

    // Update the user in the database
    const updatedUser = (await updateUserByIdQuery(
      parseInt(id),
      { role_id: targetUser.role_id },
      transaction
    )) as UserModel;

    await transaction.commit();
    return res.status(202).json({
      message: "User role updated successfully",
      data: updatedUser.toSafeJSON(),
    });
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      return res.status(400).json({ message: error.message });
    }

    if (error instanceof BusinessLogicException) {
      return res.status(403).json({ message: error.message });
    }

    return res.status(500).json({ message: (error as Error).message });
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
  checkUserExists,
  calculateProgress,
  ChangePassword,
  refreshAccessToken,
  updateUserRole,
};
