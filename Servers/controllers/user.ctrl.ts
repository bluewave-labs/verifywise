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
import {
  checkMockUserExists,
  createMockUser,
  deleteMockUserById,
  getAllMockUsers,
  getMockAssessmentsForProject,
  getMockControlCategoriesForProject,
  getMockControlForControlCategory,
  getMockQuestionsForSubTopic,
  getMockSubControlForControl,
  getMockSubTopicsForTopic,
  getMockTopicsForAssessment,
  getMockUserByEmail,
  getMockUserById,
  getMockUserProjects,
} from "../mocks/tools/user.mock.db";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { generateToken } from "../utils/jwt.util";
import { MOCKDATA_ON } from "../flags";

async function getAllUsers(req: Request, res: Response): Promise<any> {
  try {
    if (MOCKDATA_ON) {
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
    if (MOCKDATA_ON) {
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
    if (MOCKDATA_ON) {
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
    if (MOCKDATA_ON) {
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
    if (MOCKDATA_ON) {
      const { email, password } = req.body;
      const user = getMockUserByEmail(email);

      if (user?.password_hash === password) {
        const token = generateToken({
          id: user!.id,
          email: email,
        });
        return res.status(202).json(
          STATUS_CODE[202]({
            token,
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
            email: email,
          });
          return res.status(202).json(
            STATUS_CODE[202]({
              token,
            })
          );
        } else {
          return res.status(406).json(STATUS_CODE[406]({}));
        }
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function resetPassword(req: Request, res: Response) {
  try {
    const { email, newPassword } = req.body;

    if (MOCKDATA_ON) {
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
    const { name, surname, email, password_hash, role, last_login } = req.body;

    if (MOCKDATA_ON) {
      const user = getMockUserById(parseInt(id));

      if (user) {
        user.name = name || user.name;
        user.surname = surname || user.surname;
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
          surname: surname || user.surname,
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
    const id = parseInt(req.params.id);
    if (MOCKDATA_ON) {
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
    if (MOCKDATA_ON) {
      const userExists = checkMockUserExists();
      return res.status(200).json(userExists);
    } else {
      const userExists = await checkUserExistsQuery();
      return res.status(200).json(userExists);
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function calculateProgress(
  req: Request,
  res: Response
): Promise<Response> {
  const id = parseInt(req.params.id);
  if (MOCKDATA_ON) {
    const mockUserProjects = getMockUserProjects(id);
    let mockAssessmentsMetadata = [];
    let mockAllTotalAssessments = 0;
    let mockAllDoneAssessments = 0;

    let mockControlsMetadata = [];
    let mockAllTotalSubControls = 0;
    let mockAllDoneSubControls = 0;

    for (const mockUserProject of mockUserProjects) {
      let mockTotalSubControls = 0;
      let mockDoneSubControls = 0;
      const mockControlcategories = getMockControlCategoriesForProject(
        mockUserProject.id
      );
      for (const mockControlcategory of mockControlcategories) {
        const mockControls = getMockControlForControlCategory(
          mockControlcategory.id
        );
        for (const mockControl of mockControls) {
          const mockSubControls = await getMockSubControlForControl(
            mockControl.id
          );
          for (const mockSubControl of mockSubControls) {
            mockTotalSubControls++;
            if (mockSubControl.status === "Done") {
              mockDoneSubControls++;
            }
          }
        }
      }
      mockAllTotalSubControls += mockTotalSubControls;
      mockAllDoneSubControls += mockDoneSubControls;
      mockControlsMetadata.push({
        projectId: mockUserProject.id,
        totalSubControls: mockTotalSubControls,
        doneSubControls: mockDoneSubControls,
      });

      let mockTotalAssessments = 0;
      let mockDoneAssessments = 0;
      const mockAssessments = getMockAssessmentsForProject(mockUserProject.id);
      for (const mockAssessment of mockAssessments) {
        const mockTopics = getMockTopicsForAssessment(mockAssessment.id);
        for (const mockTopic of mockTopics) {
          const mockSubTopics = getMockSubTopicsForTopic(mockTopic.id);
          for (const mockSubTopic of mockSubTopics) {
            const mockQuestions = getMockQuestionsForSubTopic(mockSubTopic.id);
            for (const mockQuestion of mockQuestions) {
              mockTotalAssessments++;
              if (mockQuestion.mockQuestion) {
                mockDoneAssessments++;
              }
            }
          }
        }
      }
      mockAllTotalAssessments += mockTotalAssessments;
      mockAllDoneAssessments += mockDoneAssessments;
      mockAssessmentsMetadata.push({
        projectId: mockUserProject.id,
        totalAssessments: mockTotalAssessments,
        doneAssessments: mockDoneAssessments,
      });
    }

    return res.status(200).json({
      assessmentsMetadata: mockAssessmentsMetadata,
      controlsMetadata: mockControlsMetadata,
      allTotalAssessments: mockAllTotalAssessments,
      allDoneAssessments: mockAllDoneAssessments,
      allTotalSubControls: mockAllTotalSubControls,
      allDoneSubControls: mockAllDoneSubControls,
    });
  } else {
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
          userProject.id
        );
        for (const controlcategory of controlcategories) {
          const controls = await getControlForControlCategory(
            controlcategory.id
          );
          for (const control of controls) {
            const subControls = await getSubControlForControl(control.id);
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
        const assessments = await getAssessmentsForProject(userProject.id);
        for (const assessment of assessments) {
          const topics = await getTopicsForAssessment(assessment.id);
          for (const topic of topics) {
            const subTopics = await getSubTopicsForTopic(topic.id);
            for (const subTopic of subTopics) {
              const questions = await getQuestionsForSubTopic(subTopic.id);
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
};
