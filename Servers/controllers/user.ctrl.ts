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
import { generateToken } from "../utils/jwt.util";
import { UserModel } from "../models/user.model";

async function getAllUsers(req: Request, res: Response): Promise<any> {
  try {
    const users = await getAllUsersQuery() as UserModel[];

    if (users) {
      return res.status(200).json(STATUS_CODE[200](users.map(user => {
        const { password_hash, ...safeUser } = user.get({ plain: true });
        return safeUser;
      })));
    }

    return res.status(204).json(STATUS_CODE[204](users));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function getUserByEmail(req: Request, res: Response) {
  try {
    const email = req.params.email;
    const user = await getUserByEmailQuery(email) as UserModel;
    const { password_hash, ...safeUser } = user.get({ plain: true });

    if (user) {
      return res.status(200).json(STATUS_CODE[200](safeUser));
    }

    return res.status(404).json(STATUS_CODE[404](user));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function getUserById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const user = await getUserByIdQuery(id) as UserModel;
    const { password_hash, ...safeUser } = user.get({ plain: true });

    if (user) {
      return res.status(200).json(STATUS_CODE[200](safeUser));
    }

    return res.status(404).json(STATUS_CODE[404](user));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function createNewUser(req: Request, res: Response) {
  try {
    const { name, surname, email, password, role, created_at, last_login } =
      req.body;
    const existingUser = await getUserByEmailQuery(email);

    if (existingUser) {
      return res.status(409).json(STATUS_CODE[409](existingUser));
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await createNewUserQuery({
      name,
      surname,
      email,
      password_hash,
      role,
      created_at,
      last_login,
    }) as UserModel;
    const { password_hash: _, ...safeUser } = user.get({ plain: true });

    if (user) {
      return res.status(201).json(STATUS_CODE[201](safeUser));
    }

    return res.status(400).json(STATUS_CODE[400](user));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function loginUser(req: Request, res: Response): Promise<any> {
  try {
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
          email: email,
        });
        return res.status(202).json(
          STATUS_CODE[202]({
            token,
          })
        );
      } else {
        return res.status(406).json(STATUS_CODE[406]("Password mismatch"));
      }
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function resetPassword(req: Request, res: Response) {
  try {
    const { email, newPassword } = req.body;

    const user = await getUserByEmailQuery(email) as UserModel;

    if (user) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.dataValues.password_hash = hashedPassword;
      const updatedUser = await resetPasswordQuery(email, hashedPassword) as UserModel;
      const { password_hash, ...safeUser } = updatedUser.get({ plain: true });

      return res.status(202).json(STATUS_CODE[202](safeUser));
    }

    return res.status(404).json(STATUS_CODE[404](user));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function updateUserById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const { name, surname, email, role, last_login } = req.body;

    const user = await getUserByIdQuery(id);

    if (user) {
      const updatedUser = await updateUserByIdQuery(id, {
        name: name ?? user.name,
        surname: surname ?? user.surname,
        email: email ?? user.email,
        role: role ?? user.role,
        last_login: last_login ?? user.last_login,
      }) as UserModel;
      const { password_hash, ...safeUser } = updatedUser.get({ plain: true });

      return res.status(202).json(STATUS_CODE[202](safeUser));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function deleteUserById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const user = await getUserByIdQuery(id);

    if (user) {
      const deletedUser = await deleteUserByIdQuery(id);

      return res.status(202).json(STATUS_CODE[202](deletedUser));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
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
    console.log("checkUserExists");
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
        const controls = await getControlForControlCategory(controlcategory.id!);
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
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function ChangePassword(req: Request, res: Response) {
  try {
    const { id, currentPassword, newPassword } = req.body;

    // Fetch the user by ID
    const user = await getUserByIdQuery(id);

    if (!user) {
      return res
        .status(404)
        .json(STATUS_CODE[404]({ message: "User not found" }));
    }

    // Check if the current password is correct
    const passwordIsMatched = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );
    if (!passwordIsMatched) {
      return res
        .status(401)
        .json(STATUS_CODE[401]({ message: "Current password is incorrect" }));
    }

    // Check if the new password is not the same as the current password
    const newPasswordIsMatched = await bcrypt.compare(
      newPassword,
      user.password_hash
    );
    if (newPasswordIsMatched) {
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "New password cannot be the same as the current password",
        })
      );
    }

    // Hash the new password and update the user's password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password_hash = hashedPassword;
    const updatedUser = await resetPasswordQuery(user.email, hashedPassword) as UserModel;
    const { password_hash, ...safeUser } = updatedUser.get({ plain: true });

    return res.status(202).json(STATUS_CODE[202](safeUser));
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
  checkUserExists,
  calculateProgress,
  ChangePassword,
};
