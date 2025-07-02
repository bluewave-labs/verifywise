import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  calculateProjectRisks,
  calculateVendirRisks,
  countAnswersByProjectId,
  countSubControlsByProjectId,
  createNewProjectQuery,
  deleteProjectByIdQuery,
  getAllProjectsQuery,
  getProjectByIdQuery,
  updateProjectByIdQuery,
} from "../utils/project.utils";
import { getUserByIdQuery } from "../utils/user.utils";
import { getControlCategoryByProjectIdQuery } from "../utils/controlCategory.utils";
import { ProjectModel } from "../domain.layer/models/project/project.model";
import { getAllControlsByControlGroupQuery } from "../utils/control.utils";
import { getAllSubcontrolsByControlIdQuery } from "../utils/subControl.utils";
import { ControlModel } from "../domain.layer/models/control/control.model";
import { ControlCategoryModel } from "../domain.layer/models/controlCategory/controlCategory.model";
import { createEUFrameworkQuery } from "../utils/eu.utils";
import { sequelize } from "../database/db";
import { createISOFrameworkQuery } from "../utils/iso42001.utils";
import { IProjectAttributes } from "../domain.layer/interfaces/i.project";

export async function getAllProjects(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const { userId, role } = req;
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const projects = (await getAllProjectsQuery({
      userId,
      role,
    })) as IProjectAttributes[];

    if (projects && projects.length > 0) {
      await Promise.all(
        projects.map(async (project) => {
          // calculating compliances
          const { totalSubcontrols, doneSubcontrols } =
            await countSubControlsByProjectId(project.id!);
          project.totalSubcontrols = parseInt(totalSubcontrols);
          project.doneSubcontrols = parseInt(doneSubcontrols);

          // calculating assessments
          const { totalAssessments, answeredAssessments } =
            await countAnswersByProjectId(project.id!);
          project.totalAssessments = parseInt(totalAssessments);
          project.answeredAssessments = parseInt(answeredAssessments);
        })
      );
      return res.status(200).json(STATUS_CODE[200](projects));
    } else {
      return res.status(200).json(STATUS_CODE[200](projects));
    }
    return res.status(200).json(STATUS_CODE[200](projects));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectById(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectId = parseInt(req.params.id);

    const project = await getProjectByIdQuery(projectId);

    if (project) {
      return res.status(200).json(STATUS_CODE[200](project));
    }

    return res.status(404).json(STATUS_CODE[404](project));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createProject(req: Request, res: Response): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const newProject: Partial<ProjectModel> & {
      members: number[];
      framework: number[];
      enable_ai_data_insertion: boolean;
    } = {
      ...req.body,
      framework: req.body.framework ?? [1],
    };

    if (!newProject.project_title || !newProject.owner) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "project_title and owner are required" })
        );
    }

    const createdProject = await createNewProjectQuery(
      newProject,
      newProject.members,
      newProject.framework,
      transaction
    );
    const frameworks: { [key: string]: Object } = {};
    for (const framework of newProject.framework) {
      if (framework === 1) {
        const eu = await createEUFrameworkQuery(
          createdProject.id!,
          newProject.enable_ai_data_insertion,
          transaction
        );
        frameworks["eu"] = eu;
      } else if (framework === 2) {
        const iso42001 = await createISOFrameworkQuery(
          createdProject.id!,
          newProject.enable_ai_data_insertion, // false
          transaction
        );
        frameworks["iso42001"] = iso42001;
      }
    }

    if (createdProject) {
      await transaction.commit();
      return res.status(201).json(
        STATUS_CODE[201]({
          project: createdProject,
          frameworks,
        })
      );
    }

    return res.status(503).json(STATUS_CODE[503]({}));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateProjectById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const projectId = parseInt(req.params.id);
    const updatedProject: Partial<ProjectModel> & { members?: number[] } =
      req.body;
    const members = updatedProject.members || [];

    delete updatedProject.members;
    delete updatedProject.id;

    if (!updatedProject.project_title || !updatedProject.owner) {
      return res
        .status(400)
        .json(
          STATUS_CODE[400]({ message: "project_title and owner are required" })
        );
    }

    const project = await updateProjectByIdQuery(
      projectId,
      updatedProject,
      members,
      transaction
    );

    if (project) {
      await transaction.commit();
      return res.status(202).json(STATUS_CODE[202](project));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteProjectById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const projectId = parseInt(req.params.id);

    const deletedProject = await deleteProjectByIdQuery(projectId, transaction);

    if (deletedProject) {
      await transaction.commit();
      return res.status(202).json(STATUS_CODE[202](deletedProject));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getProjectStatsById(
  req: Request,
  res: Response
): Promise<any> {
  const projectId = parseInt(req.params.id);

  // first getting the project by id
  const project: any = await getProjectByIdQuery(projectId);

  const project_owner = project.owner; // (A user's id) Now, we get the user by this
  const ownerUser: any = getUserByIdQuery(project_owner);

  const project_last_updated = project.last_updated;

  const project_last_updated_by = project.last_updated_by;
  const userWhoUpdated: any = getUserByIdQuery(project_last_updated_by);

  const overviewDetails = {
    user: {
      name: ownerUser.name,
      surname: ownerUser.surname,
      email: ownerUser.email,
      project_last_updated,
      userWhoUpdated,
    },
  };
  return res.status(202).json(STATUS_CODE[202](overviewDetails));
}

export async function getProjectRisksCalculations(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectId = parseInt(req.params.id);

    const projectRisksCalculations = await calculateProjectRisks(projectId);

    if (projectRisksCalculations) {
      return res.status(200).json(STATUS_CODE[200](projectRisksCalculations));
    }

    return res.status(204).json(STATUS_CODE[204](projectRisksCalculations));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getVendorRisksCalculations(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const projectId = parseInt(req.params.id);

    const vendorRisksCalculations = await calculateVendirRisks(projectId);

    if (vendorRisksCalculations) {
      return res.status(200).json(STATUS_CODE[200](vendorRisksCalculations));
    }

    return res.status(204).json(STATUS_CODE[204](vendorRisksCalculations));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getCompliances(req: Request, res: Response) {
  const projectId = parseInt(req.params.projid);
  try {
    const project = await getProjectByIdQuery(projectId);
    if (project) {
      const controlCategories = (await getControlCategoryByProjectIdQuery(
        project.id!
      )) as ControlCategoryModel[];
      for (const category of controlCategories) {
        if (category) {
          const controls = (await getAllControlsByControlGroupQuery(
            category.id
          )) as ControlModel[];
          for (const control of controls) {
            if (control && control.id) {
              const subControls = await getAllSubcontrolsByControlIdQuery(
                control.id
              );
              control.dataValues.numberOfSubcontrols = subControls.length;
              control.dataValues.numberOfDoneSubcontrols = subControls.filter(
                (subControl) => subControl.status === "Done"
              ).length;
              control.dataValues.subControls = subControls;
            }
          }
          category.dataValues.controls = controls;
        }
      }
      return res.status(200).json(STATUS_CODE[200](controlCategories));
    } else {
      return res.status(404).json(STATUS_CODE[404](project));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function projectComplianceProgress(req: Request, res: Response) {
  const projectId = parseInt(req.params.id);
  try {
    const project = await getProjectByIdQuery(projectId);
    if (project) {
      const { totalSubcontrols, doneSubcontrols } =
        await countSubControlsByProjectId(project.id!);
      return res.status(200).json(
        STATUS_CODE[200]({
          allsubControls: totalSubcontrols,
          allDonesubControls: doneSubcontrols,
        })
      );
    } else {
      return res.status(404).json(STATUS_CODE[404](project));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function projectAssessmentProgress(req: Request, res: Response) {
  const projectId = parseInt(req.params.id);
  try {
    const project = await getProjectByIdQuery(projectId);
    if (project) {
      const { totalAssessments, answeredAssessments } =
        await countAnswersByProjectId(project.id!);
      return res.status(200).json(
        STATUS_CODE[200]({
          totalQuestions: totalAssessments,
          answeredQuestions: answeredAssessments,
        })
      );
    } else {
      return res.status(404).json(STATUS_CODE[404](project));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function allProjectsComplianceProgress(
  req: Request,
  res: Response
) {
  let totalNumberOfSubcontrols = 0;
  let totalNumberOfDoneSubcontrols = 0;
  try {
    const { userId, role } = req;
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const projects = await getAllProjectsQuery({ userId, role });
    if (projects && projects.length > 0) {
      await Promise.all(
        projects.map(async (project) => {
          // calculating compliances
          const { totalSubcontrols, doneSubcontrols } =
            await countSubControlsByProjectId(project.id!);
          totalNumberOfSubcontrols += parseInt(totalSubcontrols);
          totalNumberOfDoneSubcontrols += parseInt(doneSubcontrols);
        })
      );
      return res.status(200).json(
        STATUS_CODE[200]({
          allsubControls: totalNumberOfSubcontrols,
          allDonesubControls: totalNumberOfDoneSubcontrols,
        })
      );
    } else {
      return res.status(404).json(STATUS_CODE[404](projects));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function allProjectsAssessmentProgress(
  req: Request,
  res: Response
) {
  let totalNumberOfQuestions = 0;
  let totalNumberOfAnsweredQuestions = 0;
  try {
    const { userId, role } = req;
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const projects = await getAllProjectsQuery({ userId, role });
    if (projects && projects.length > 0) {
      await Promise.all(
        projects.map(async (project) => {
          // // calculating assessments
          const { totalAssessments, answeredAssessments } =
            await countAnswersByProjectId(project.id!);
          totalNumberOfQuestions = parseInt(totalAssessments);
          totalNumberOfAnsweredQuestions = parseInt(answeredAssessments);
        })
      );
      return res.status(200).json(
        STATUS_CODE[200]({
          totalQuestions: totalNumberOfQuestions,
          answeredQuestions: totalNumberOfAnsweredQuestions,
        })
      );
    } else {
      return res.status(404).json(STATUS_CODE[404](projects));
    }
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
